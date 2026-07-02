import { createHash } from "crypto";
import { env, hasSerpApiConfig } from "@/lib/env";
import { calculateFreshnessScore, inferRemoteType } from "@/lib/jobs/freshness";
import { getSourceUsage, reserveSourceSearch } from "@/lib/jobs/source-usage";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Company, Database, Json } from "@/types/database";
import type { JobSyncResult } from "@/lib/jobs/sync-types";

const sourceName = "serpapi";
const quotaSetupSqlPath = "supabase/migrations/006_job_source_usage.sql";
const defaultQueries = [
  "remote jobs",
  "project manager jobs",
  "software engineer jobs",
  "data analyst jobs",
  "customer success jobs"
];

type SerpApiApplyOption = {
  link?: string | null;
  title?: string | null;
};

type SerpApiDetectedExtensions = {
  posted_at?: string | null;
  schedule_type?: string | null;
};

type SerpApiJob = {
  apply_options?: SerpApiApplyOption[] | null;
  company_name?: string | null;
  description?: string | null;
  detected_extensions?: SerpApiDetectedExtensions | null;
  extensions?: string[] | null;
  job_id?: string | null;
  location?: string | null;
  share_link?: string | null;
  title?: string | null;
  via?: string | null;
};

type SerpApiSearchResponse = {
  error?: string;
  jobs_results?: SerpApiJob[];
  search_metadata?: {
    id?: string;
    status?: string;
  };
};

type SerpApiFetchBatch = {
  jobs: SerpApiJob[];
  query: string;
};

function sanitizeSerpApiMessage(message: string) {
  return env.serpApiKey ? message.replaceAll(env.serpApiKey, "[redacted]") : message;
}

async function readSerpApiError(response: Response) {
  const body = await response.text().catch(() => "");

  if (!body) return `SerpApi returned ${response.status}`;

  try {
    const payload = JSON.parse(body) as { error?: unknown };
    const detail = typeof payload.error === "string" ? payload.error : body.slice(0, 240);
    return sanitizeSerpApiMessage(`SerpApi returned ${response.status}: ${detail}`);
  } catch {
    return sanitizeSerpApiMessage(`SerpApi returned ${response.status}: ${body.slice(0, 240)}`);
  }
}

function parsePositiveInt(value: string, fallback: number, max: number) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), max);
}

function getMonthlyLimit() {
  return parsePositiveInt(env.serpApiMonthlyLimit, 220, 250);
}

function getMaxSearchesPerSync() {
  return parsePositiveInt(env.serpApiMaxSearchesPerSync, 5, 10);
}

function getSearchQueries() {
  const queries = env.serpApiSearchQueries
    ? env.serpApiSearchQueries
        .split(/[,\n;]/)
        .map((query) => query.trim())
        .filter(Boolean)
    : defaultQueries;

  return queries.slice(0, getMaxSearchesPerSync());
}

function slugifyCompanyName(companyName: string) {
  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

  return slug || "unknown-company";
}

function getCompanyName(job: SerpApiJob) {
  return job.company_name?.trim() || "SerpApi listing";
}

function getCompanySlug(job: SerpApiJob) {
  return `serpapi-${slugifyCompanyName(getCompanyName(job))}`;
}

function getApplyUrl(job: SerpApiJob) {
  return job.apply_options?.find((option) => option.link)?.link ?? job.share_link ?? null;
}

function getPostedAt(postedAt: string | null | undefined) {
  if (!postedAt) return null;

  const normalized = postedAt.toLowerCase();
  const now = new Date();
  const relativeMatch = normalized.match(/(\d+)\s+(hour|day|week|month)s?\s+ago/);

  if (normalized.includes("today") || normalized.includes("just posted")) {
    return now.toISOString();
  }

  if (!relativeMatch) return null;

  const amount = Number.parseInt(relativeMatch[1] ?? "", 10);
  const unit = relativeMatch[2];
  if (!Number.isFinite(amount)) return null;

  const days =
    unit === "hour"
      ? Math.max(amount / 24, 0)
      : unit === "week"
        ? amount * 7
        : unit === "month"
          ? amount * 30
          : amount;

  now.setTime(now.getTime() - days * 86_400_000);
  return now.toISOString();
}

function buildFallbackJobId(job: SerpApiJob) {
  return createHash("sha256")
    .update(`${job.title ?? ""}:${job.company_name ?? ""}:${job.location ?? ""}:${job.share_link ?? ""}`)
    .digest("hex")
    .slice(0, 32);
}

function getSerpApiUrl(query: string) {
  const url = new URL("https://serpapi.com/search");

  url.searchParams.set("engine", "google_jobs");
  const freshnessSuffix = env.serpApiFreshnessQuerySuffix.trim();
  url.searchParams.set("q", freshnessSuffix ? `${query} ${freshnessSuffix}` : query);
  url.searchParams.set("api_key", env.serpApiKey);
  url.searchParams.set("google_domain", env.serpApiGoogleDomain);
  url.searchParams.set("gl", env.serpApiGl);
  url.searchParams.set("hl", env.serpApiHl);
  url.searchParams.set("output", "json");
  url.searchParams.set("no_cache", "false");

  if (env.serpApiDefaultLocation) {
    url.searchParams.set("location", env.serpApiDefaultLocation);
  }

  return url;
}

async function fetchSerpApiJobs(query: string): Promise<SerpApiFetchBatch> {
  const response = await fetch(getSerpApiUrl(query), {
    headers: {
      accept: "application/json"
    },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(await readSerpApiError(response));
  }

  const payload = (await response.json()) as SerpApiSearchResponse;
  if (payload.error) {
    throw new Error(sanitizeSerpApiMessage(payload.error));
  }

  return {
    jobs: payload.jobs_results ?? [],
    query
  };
}

async function ensureSerpApiCompanies(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  jobs: SerpApiJob[]
) {
  const companiesBySlug = new Map<string, Database["public"]["Tables"]["companies"]["Insert"]>();

  for (const job of jobs) {
    const greenhouseSlug = getCompanySlug(job);
    if (!companiesBySlug.has(greenhouseSlug)) {
      companiesBySlug.set(greenhouseSlug, {
        name: getCompanyName(job),
        greenhouse_slug: greenhouseSlug,
        industry: job.via ? `Google Jobs via ${job.via}` : "Google Jobs",
        is_active: true,
        website: null
      });
    }
  }

  const companyRows = Array.from(companiesBySlug.values());
  if (companyRows.length === 0) return new Map<string, Pick<Company, "id" | "greenhouse_slug">>();

  const { error } = await supabase.from("companies").upsert(companyRows, {
    onConflict: "greenhouse_slug"
  });

  if (error) {
    throw error;
  }

  const { data, error: selectError } = await supabase
    .from("companies")
    .select("id, greenhouse_slug")
    .in("greenhouse_slug", Array.from(companiesBySlug.keys()));

  if (selectError) {
    throw selectError;
  }

  return new Map((data ?? []).map((company) => [company.greenhouse_slug, company]));
}

function normalizeJob(job: SerpApiJob, companyId: string) {
  const title = job.title?.trim() || "Untitled role";
  const location = job.location ?? env.serpApiDefaultLocation ?? null;
  const applyUrl = getApplyUrl(job);
  const postedAt = getPostedAt(job.detected_extensions?.posted_at);
  const externalId = job.job_id ?? buildFallbackJobId(job);

  return {
    company_id: companyId,
    external_id: `serpapi:${externalId}`,
    title,
    description: job.description ?? null,
    location,
    remote_type: inferRemoteType(title, location),
    source: sourceName,
    source_url: job.share_link ?? applyUrl,
    apply_url: applyUrl,
    posted_at: postedAt,
    updated_at: postedAt,
    freshness_score: calculateFreshnessScore({
      applyUrl,
      location,
      sourceUrl: job.share_link ?? applyUrl,
      title,
      updatedAt: postedAt
    }),
    status: "active",
    raw_data: job as unknown as Json
  } satisfies Database["public"]["Tables"]["jobs"]["Insert"];
}

export async function syncSerpApiJobs(): Promise<JobSyncResult> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role environment variables are not configured.");
  }

  const monthlyLimit = getMonthlyLimit();
  const initialUsage = await getSourceUsage(sourceName, monthlyLimit);
  const sourceResult = {
    configured: hasSerpApiConfig(),
    monthlyLimit,
    searchesRemaining: initialUsage.searchesRemaining,
    searchesUsed: initialUsage.searchesUsed,
    setupRequired: initialUsage.setupRequired,
    setupSqlPath: initialUsage.setupRequired ? quotaSetupSqlPath : undefined,
    skippedReason: initialUsage.setupRequired ? "Run migration 006 to enable SerpApi quota tracking." : undefined,
    source: sourceName,
    totalJobsFetched: 0,
    totalJobsInserted: 0,
    totalJobsUpdated: 0,
    totalRequests: 0
  };

  const result: JobSyncResult = {
    errors: [],
    sourceResults: [sourceResult],
    totalCompaniesChecked: 0,
    totalJobsInserted: 0,
    totalJobsUpdated: 0
  };

  if (!hasSerpApiConfig()) {
    sourceResult.skippedReason = "SerpApi API key is not configured.";
    return result;
  }

  if (initialUsage.setupRequired) {
    return result;
  }

  try {
    const batches: SerpApiFetchBatch[] = [];

    for (const query of getSearchQueries()) {
      const reservation = await reserveSourceSearch(sourceName, monthlyLimit);
      sourceResult.searchesRemaining = reservation.searchesRemaining;
      sourceResult.searchesUsed = reservation.searchesUsed;

      if (!reservation.allowed) {
        sourceResult.setupRequired = reservation.setupRequired;
        sourceResult.setupSqlPath = reservation.setupRequired ? quotaSetupSqlPath : undefined;
        sourceResult.skippedReason = reservation.setupRequired
          ? "Run migration 006 to enable SerpApi quota tracking."
          : "Monthly SerpApi search budget reached.";
        break;
      }

      sourceResult.totalRequests += 1;

      try {
        const batch = await fetchSerpApiJobs(query);
        sourceResult.totalJobsFetched += batch.jobs.length;
        batches.push(batch);
      } catch (error) {
        result.errors.push({
          source: sourceName,
          query,
          message: error instanceof Error ? error.message : "Unknown SerpApi sync error"
        });
      }
    }

    if (result.errors.some((error) => error.source === sourceName)) {
      sourceResult.skippedReason = "Some SerpApi searches failed. Review the errors below.";
    }

    const jobs = batches.flatMap((batch) => batch.jobs);
    const companies = await ensureSerpApiCompanies(supabase, jobs);
    const normalizedJobs = jobs
      .map((job) => {
        const company = companies.get(getCompanySlug(job));
        return company ? normalizeJob(job, company.id) : null;
      })
      .filter(Boolean) as Database["public"]["Tables"]["jobs"]["Insert"][];
    const uniqueJobs = Array.from(
      new Map(normalizedJobs.map((job) => [`${job.company_id}:${job.external_id}`, job])).values()
    );

    if (uniqueJobs.length === 0) {
      return result;
    }

    const companyIds = Array.from(new Set(uniqueJobs.map((job) => job.company_id).filter(Boolean))) as string[];
    const externalIds = uniqueJobs.map((job) => job.external_id);
    const { data: existingJobs, error: existingError } = await supabase
      .from("jobs")
      .select("company_id, external_id")
      .in("company_id", companyIds)
      .in("external_id", externalIds);

    if (existingError) {
      throw existingError;
    }

    const existingKeys = new Set((existingJobs ?? []).map((job) => `${job.company_id}:${job.external_id}`));
    const { error: upsertError } = await supabase.from("jobs").upsert(uniqueJobs, {
      onConflict: "company_id,external_id"
    });

    if (upsertError) {
      throw upsertError;
    }

    for (const job of uniqueJobs) {
      if (existingKeys.has(`${job.company_id}:${job.external_id}`)) {
        sourceResult.totalJobsUpdated += 1;
        result.totalJobsUpdated += 1;
      } else {
        sourceResult.totalJobsInserted += 1;
        result.totalJobsInserted += 1;
      }
    }

    result.totalCompaniesChecked = companies.size;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown SerpApi sync error";
    sourceResult.skippedReason = `SerpApi sync failed: ${message}`;
    result.errors.push({
      source: sourceName,
      message
    });
  }

  return result;
}
