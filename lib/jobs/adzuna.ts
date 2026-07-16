import { env, hasAdzunaConfig } from "@/lib/env";
import { formatJobLocation } from "@/lib/jobs/display";
import { calculateFreshnessScore, inferRemoteType } from "@/lib/jobs/freshness";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSourceHealthStatus, recordSourceFailure, recordSourceSuccess } from "@/lib/jobs/source-health";
import type { Company, Database, Json } from "@/types/database";
import type { JobSyncResult, JobSyncSourceResult } from "@/lib/jobs/sync-types";

const requestTimeoutMs = 12_000;

const defaultQueries = [
  "software engineer",
  "data analyst",
  "product manager",
  "project manager",
  "business analyst",
  "marketing manager",
  "sales representative",
  "customer success",
  "operations manager",
  "designer"
];

type AdzunaCompany = {
  display_name?: string | null;
};

type AdzunaCategory = {
  label?: string | null;
  tag?: string | null;
};

type AdzunaLocation = {
  area?: string[];
  display_name?: string | null;
};

type AdzunaJob = {
  category?: AdzunaCategory | null;
  company?: AdzunaCompany | null;
  contract_time?: string | null;
  contract_type?: string | null;
  created?: string | null;
  description?: string | null;
  id: string | number;
  location?: AdzunaLocation | null;
  redirect_url?: string | null;
  salary_max?: number | null;
  salary_min?: number | null;
  title: string;
};

type AdzunaSearchResponse = {
  count?: number;
  results?: AdzunaJob[];
};

type AdzunaFetchBatch = {
  jobs: AdzunaJob[];
  query: string;
  sourceKey: string;
};

export type AdzunaSyncOptions = {
  maxDaysOld?: number | string;
  queries?: string[];
  resultsPerQuery?: number;
};

function getQuerySourceKey(query: string) {
  return query.toLowerCase().replace(/\s+/g, " ").trim();
}

function getSearchQueries(options: AdzunaSyncOptions = {}) {
  const plannedQueries = options.queries?.map((query) => query.trim()).filter(Boolean) ?? [];
  if (plannedQueries.length > 0) return plannedQueries.slice(0, 20);

  if (!env.adzunaSearchQueries) {
    return defaultQueries;
  }

  return env.adzunaSearchQueries
    .split(/[,\n;]/)
    .map((query) => query.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function getResultsPerQuery(options: AdzunaSyncOptions = {}) {
  const parsed = Number.parseInt(String(options.resultsPerQuery ?? env.adzunaResultsPerQuery), 10);
  if (!Number.isFinite(parsed)) return 30;
  return Math.min(Math.max(parsed, 1), 50);
}

function slugifyCompanyName(companyName: string) {
  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);

  return slug || "unknown-company";
}

function getCompanyName(job: AdzunaJob) {
  return job.company?.display_name?.trim() || "Adzuna listing";
}

function getCompanySlug(job: AdzunaJob) {
  return `adzuna-${slugifyCompanyName(getCompanyName(job))}`;
}

function getLocation(job: AdzunaJob) {
  return formatJobLocation(
    job.location?.display_name ?? job.location?.area?.filter(Boolean).join(", ") ?? null
  );
}

function getAdzunaUrl(query: string, options: AdzunaSyncOptions = {}) {
  const country = env.adzunaCountry.toLowerCase();
  const url = new URL(`https://api.adzuna.com/v1/api/jobs/${country}/search/1`);

  url.searchParams.set("app_id", env.adzunaAppId);
  url.searchParams.set("app_key", env.adzunaAppKey);
  url.searchParams.set("results_per_page", String(getResultsPerQuery(options)));
  url.searchParams.set("what", query);
  url.searchParams.set("content-type", "application/json");
  url.searchParams.set("sort_by", "date");

  const maxDaysOld = options.maxDaysOld ?? env.adzunaMaxDaysOld;
  if (maxDaysOld) {
    url.searchParams.set("max_days_old", String(maxDaysOld));
  }

  if (env.adzunaDefaultWhere) {
    url.searchParams.set("where", env.adzunaDefaultWhere);
  }

  return url;
}

async function fetchAdzunaJobs(query: string, options: AdzunaSyncOptions = {}): Promise<AdzunaFetchBatch> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(getAdzunaUrl(query, options), {
      headers: {
        accept: "application/json"
      },
      next: { revalidate: 0 },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Adzuna returned ${response.status}`);
    }

    const payload = (await response.json()) as AdzunaSearchResponse;
    return {
      jobs: payload.results ?? [],
      query,
      sourceKey: getQuerySourceKey(query)
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function ensureAdzunaCompanies(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  jobs: AdzunaJob[]
) {
  const companiesBySlug = new Map<string, Database["public"]["Tables"]["companies"]["Insert"]>();

  for (const job of jobs) {
    const greenhouseSlug = getCompanySlug(job);
    if (!companiesBySlug.has(greenhouseSlug)) {
      companiesBySlug.set(greenhouseSlug, {
        name: getCompanyName(job),
        greenhouse_slug: greenhouseSlug,
        industry: job.category?.label ?? null,
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

function normalizeJob(job: AdzunaJob, companyId: string) {
  const location = getLocation(job);
  const applyUrl = job.redirect_url ?? null;
  const createdAt = job.created ?? null;
  const lastSeenAt = new Date().toISOString();
  const title = job.title.trim();

  return {
    company_id: companyId,
    external_id: `adzuna:${env.adzunaCountry.toLowerCase()}:${job.id}`,
    title,
    description: job.description ?? null,
    location,
    last_seen_at: lastSeenAt,
    remote_type: inferRemoteType(title, location),
    source: "adzuna",
    source_url: applyUrl,
    apply_url: applyUrl,
    posted_at: createdAt,
    updated_at: createdAt,
    freshness_score: calculateFreshnessScore({
      applyUrl,
      location,
      sourceUrl: applyUrl,
      title,
      updatedAt: createdAt
    }),
    status: "active",
    raw_data: job as unknown as Json
  } satisfies Database["public"]["Tables"]["jobs"]["Insert"];
}

export async function syncAdzunaJobs(options: AdzunaSyncOptions = {}): Promise<JobSyncResult> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role environment variables are not configured.");
  }

  const sourceResult: JobSyncSourceResult = {
    configured: hasAdzunaConfig(),
    source: "adzuna",
    totalJobsFetched: 0,
    totalJobsInserted: 0,
    totalJobsUpdated: 0,
    totalRequests: 0,
    totalSkipped: 0
  };

  const result: JobSyncResult = {
    errors: [],
    sourceResults: [sourceResult],
    totalCompaniesChecked: 0,
    totalJobsInserted: 0,
    totalJobsUpdated: 0
  };

  if (!hasAdzunaConfig()) {
    result.errors.push({
      source: "adzuna",
      message: "Adzuna environment variables are not configured."
    });
    return result;
  }

  const batches: AdzunaFetchBatch[] = [];

  for (const query of getSearchQueries(options)) {
    const sourceKey = getQuerySourceKey(query);
    const healthIdentity = {
      displayName: `Adzuna: ${query}`,
      source: "adzuna",
      sourceKey
    };
    const healthStatus = await getSourceHealthStatus(supabase, healthIdentity);

    if (healthStatus.shouldSkip) {
      sourceResult.totalSkipped = (sourceResult.totalSkipped ?? 0) + 1;
      continue;
    }

    sourceResult.totalRequests += 1;

    try {
      const batch = await fetchAdzunaJobs(query, options);
      sourceResult.totalJobsFetched += batch.jobs.length;
      batches.push(batch);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Adzuna sync error";
      await recordSourceFailure(supabase, healthIdentity, message);
      result.errors.push({
        source: "adzuna",
        query,
        message
      });
    }
  }

  const jobs = batches.flatMap((batch) => batch.jobs);
  const companies = await ensureAdzunaCompanies(supabase, jobs);
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
    for (const batch of batches) {
      await recordSourceSuccess(
        supabase,
        {
          displayName: `Adzuna: ${batch.query}`,
          source: "adzuna",
          sourceKey: batch.sourceKey
        },
        {
          jobsFetched: batch.jobs.length,
          jobsInserted: 0
        }
      );
    }

    if ((sourceResult.totalSkipped ?? 0) > 0) {
      sourceResult.skippedReason = `${sourceResult.totalSkipped} Adzuna queries were skipped because they are cooling down.`;
    }

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

  const insertedExternalIds = new Set<string>();
  for (const job of uniqueJobs) {
    if (existingKeys.has(`${job.company_id}:${job.external_id}`)) {
      sourceResult.totalJobsUpdated += 1;
      result.totalJobsUpdated += 1;
    } else {
      sourceResult.totalJobsInserted += 1;
      result.totalJobsInserted += 1;
      insertedExternalIds.add(job.external_id);
    }
  }

  for (const batch of batches) {
    await recordSourceSuccess(
      supabase,
      {
        displayName: `Adzuna: ${batch.query}`,
        source: "adzuna",
        sourceKey: batch.sourceKey
      },
      {
        jobsFetched: batch.jobs.length,
        jobsInserted: batch.jobs.filter((job) => insertedExternalIds.has(`adzuna:${env.adzunaCountry.toLowerCase()}:${job.id}`)).length
      }
    );
  }

  if ((sourceResult.totalSkipped ?? 0) > 0) {
    sourceResult.skippedReason = `${sourceResult.totalSkipped} Adzuna queries were skipped because they are cooling down.`;
  }

  result.totalCompaniesChecked = companies.size;
  return result;
}
