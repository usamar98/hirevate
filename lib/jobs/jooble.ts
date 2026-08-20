import { env, hasJoobleConfig } from "@/lib/env";
import { formatJobLocation } from "@/lib/jobs/display";
import { calculateFreshnessScore, inferRemoteType } from "@/lib/jobs/freshness";
import { getSourceHealthStatus, recordSourceFailure, recordSourceSuccess } from "@/lib/jobs/source-health";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Company, Database, Json } from "@/types/database";
import type { JobSyncResult, JobSyncSourceResult } from "@/lib/jobs/sync-types";

const requestTimeoutMs = 12_000;
const defaultQueries = [
  "software engineer",
  "data analyst",
  "product manager",
  "business analyst",
  "customer service",
  "sales",
  "marketing",
  "healthcare",
  "construction",
  "hospitality"
];

type JoobleJob = {
  company?: string | null;
  id: string | number;
  link?: string | null;
  location?: string | null;
  salary?: string | null;
  snippet?: string | null;
  source?: string | null;
  title?: string | null;
  type?: string | null;
  updated?: string | null;
};

type JoobleSearchResponse = {
  jobs?: JoobleJob[];
  totalCount?: number;
};

type JoobleFetchBatch = {
  jobs: JoobleJob[];
  query: string;
  sourceKey: string;
};

export type JoobleSyncOptions = {
  maxDaysOld?: number;
  queries?: string[];
  resultsPerQuery?: number;
};

function parsePositiveInt(value: string | number | undefined, fallback: number, max: number) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), max);
}

function getQueries(options: JoobleSyncOptions) {
  const planned = options.queries?.map((query) => query.trim()).filter(Boolean) ?? [];
  if (planned.length > 0) return Array.from(new Set(planned)).slice(0, 12);

  const configured = env.joobleSearchQueries
    .split(/[,\n;]/)
    .map((query) => query.trim())
    .filter(Boolean);

  return (configured.length > 0 ? Array.from(new Set(configured)) : defaultQueries).slice(0, 12);
}

function getResultsPerQuery(options: JoobleSyncOptions) {
  return parsePositiveInt(options.resultsPerQuery ?? env.joobleResultsPerQuery, 20, 50);
}

function getSourceKey(query: string) {
  return `au:${query.toLowerCase().replace(/\s+/g, " ").trim()}`;
}

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  action: (item: T) => Promise<void>
) {
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const item = items[nextIndex];
      nextIndex += 1;
      if (item !== undefined) await action(item);
    }
  });

  await Promise.all(workers);
}

function isPublicHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function toIsoDate(value: string | null | undefined) {
  if (!value?.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isFreshEnough(job: JoobleJob, maxDaysOld: number) {
  const updatedAt = toIsoDate(job.updated);
  if (!updatedAt) return true;
  return Date.now() - new Date(updatedAt).getTime() <= maxDaysOld * 86_400_000;
}

function isUsableJob(job: JoobleJob, maxDaysOld: number) {
  return Boolean(
    String(job.id).trim() &&
      job.title?.trim() &&
      job.company?.trim() &&
      isPublicHttpUrl(job.link) &&
      isFreshEnough(job, maxDaysOld)
  );
}

function slugifyCompanyName(companyName: string) {
  return (
    companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70) || "unknown-company"
  );
}

function getCompanyName(job: JoobleJob) {
  return job.company?.trim() || "Unknown employer";
}

function getCompanySlug(job: JoobleJob) {
  return `jooble-au-${slugifyCompanyName(getCompanyName(job))}`;
}

function getLocation(job: JoobleJob) {
  const location = formatJobLocation(job.location) ?? "Australia";
  return /\baustralia\b/i.test(location) ? location : `${location}, Australia`;
}

function buildDescription(job: JoobleJob) {
  return [
    job.snippet?.trim(),
    job.type?.trim() ? `Employment type: ${job.type.trim()}` : null,
    job.salary?.trim() ? `Salary: ${job.salary.trim()}` : null
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function fetchJoobleJobs(query: string, options: JoobleSyncOptions): Promise<JoobleFetchBatch> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(`https://jooble.org/api/${encodeURIComponent(env.joobleApiKey)}`, {
      body: JSON.stringify({
        keywords: query,
        location: "Australia",
        page: "1",
        ResultOnPage: getResultsPerQuery(options),
        SearchMode: "1"
      }),
      headers: {
        accept: "application/json",
        "content-type": "application/json"
      },
      method: "POST",
      next: { revalidate: 0 },
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`Jooble returned ${response.status}`);

    const payload = (await response.json()) as JoobleSearchResponse;
    const maxDaysOld = parsePositiveInt(options.maxDaysOld, 7, 30);

    return {
      jobs: (payload.jobs ?? []).filter((job) => isUsableJob(job, maxDaysOld)),
      query,
      sourceKey: getSourceKey(query)
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function ensureCompanies(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  jobs: JoobleJob[]
) {
  const rowsBySlug = new Map<string, Database["public"]["Tables"]["companies"]["Insert"]>();

  for (const job of jobs) {
    const slug = getCompanySlug(job);
    if (!rowsBySlug.has(slug)) {
      rowsBySlug.set(slug, {
        greenhouse_slug: slug,
        industry: "Jooble Australia",
        is_active: true,
        name: getCompanyName(job),
        website: null
      });
    }
  }

  const rows = Array.from(rowsBySlug.values());
  if (rows.length === 0) return new Map<string, Pick<Company, "greenhouse_slug" | "id">>();

  const { error } = await supabase.from("companies").upsert(rows, { onConflict: "greenhouse_slug" });
  if (error) throw error;

  const { data, error: selectError } = await supabase
    .from("companies")
    .select("id, greenhouse_slug")
    .in("greenhouse_slug", Array.from(rowsBySlug.keys()));

  if (selectError) throw selectError;
  return new Map((data ?? []).map((company) => [company.greenhouse_slug, company]));
}

function normalizeJob(job: JoobleJob, companyId: string) {
  const applyUrl = isPublicHttpUrl(job.link) ? job.link : null;
  const location = getLocation(job);
  const title = job.title?.trim() || "Untitled role";
  const updatedAt = toIsoDate(job.updated);

  return {
    apply_url: applyUrl,
    company_id: companyId,
    description: buildDescription(job) || null,
    external_id: `jooble:au:${job.id}`,
    freshness_score: calculateFreshnessScore({
      applyUrl,
      location,
      sourceUrl: applyUrl,
      title,
      updatedAt
    }),
    last_seen_at: new Date().toISOString(),
    location,
    posted_at: updatedAt,
    raw_data: { ...job, country: "AU", salary_text: job.salary ?? null } as unknown as Json,
    remote_type: inferRemoteType(title, location),
    source: "jooble",
    source_url: applyUrl,
    status: "active",
    title,
    updated_at: updatedAt
  } satisfies Database["public"]["Tables"]["jobs"]["Insert"];
}

export async function syncJoobleAustraliaJobs(options: JoobleSyncOptions = {}): Promise<JobSyncResult> {
  const sourceResult: JobSyncSourceResult = {
    configured: hasJoobleConfig(),
    skippedReason: hasJoobleConfig()
      ? undefined
      : "Add JOOBLE_API_KEY to enable the optional Jooble Australia discovery feed.",
    source: "jooble-au",
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

  if (!hasJoobleConfig()) return result;

  const supabase = createSupabaseAdminClient();
  if (!supabase) throw new Error("Supabase service role environment variables are not configured.");

  const batches: JoobleFetchBatch[] = [];
  await mapWithConcurrency(getQueries(options), 3, async (query) => {
    const identity = {
      displayName: `Jooble Australia: ${query}`,
      source: "jooble",
      sourceKey: getSourceKey(query)
    };
    const health = await getSourceHealthStatus(supabase, identity);

    if (health.shouldSkip) {
      sourceResult.totalSkipped = (sourceResult.totalSkipped ?? 0) + 1;
      return;
    }

    sourceResult.totalRequests += 1;
    try {
      const batch = await fetchJoobleJobs(query, options);
      sourceResult.totalJobsFetched += batch.jobs.length;
      batches.push(batch);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Jooble sync error";
      await recordSourceFailure(supabase, identity, message);
      result.errors.push({ source: "jooble-au", query, message });
    }
  });

  const jobs = batches.flatMap((batch) => batch.jobs);
  const companies = await ensureCompanies(supabase, jobs);
  const normalized = jobs
    .map((job) => {
      const company = companies.get(getCompanySlug(job));
      return company ? normalizeJob(job, company.id) : null;
    })
    .filter(Boolean) as Database["public"]["Tables"]["jobs"]["Insert"][];
  const uniqueJobs = Array.from(
    new Map(normalized.map((job) => [`${job.company_id}:${job.external_id}`, job])).values()
  );
  const insertedIds = new Set<string>();

  if (uniqueJobs.length > 0) {
    const companyIds = Array.from(new Set(uniqueJobs.map((job) => job.company_id).filter(Boolean))) as string[];
    const externalIds = uniqueJobs.map((job) => job.external_id);
    const { data: existing, error: existingError } = await supabase
      .from("jobs")
      .select("company_id, external_id")
      .in("company_id", companyIds)
      .in("external_id", externalIds);

    if (existingError) throw existingError;
    const existingKeys = new Set((existing ?? []).map((job) => `${job.company_id}:${job.external_id}`));
    const { error: upsertError } = await supabase
      .from("jobs")
      .upsert(uniqueJobs, { onConflict: "company_id,external_id" });

    if (upsertError) throw upsertError;

    for (const job of uniqueJobs) {
      if (existingKeys.has(`${job.company_id}:${job.external_id}`)) {
        result.totalJobsUpdated += 1;
        sourceResult.totalJobsUpdated += 1;
      } else {
        result.totalJobsInserted += 1;
        sourceResult.totalJobsInserted += 1;
        insertedIds.add(job.external_id);
      }
    }
  }

  for (const batch of batches) {
    await recordSourceSuccess(
      supabase,
      {
        displayName: `Jooble Australia: ${batch.query}`,
        source: "jooble",
        sourceKey: batch.sourceKey
      },
      {
        jobsFetched: batch.jobs.length,
        jobsInserted: batch.jobs.filter((job) => insertedIds.has(`jooble:au:${job.id}`)).length
      }
    );
  }

  if ((sourceResult.totalSkipped ?? 0) > 0) {
    sourceResult.skippedReason = `${sourceResult.totalSkipped} Jooble searches were skipped because they are cooling down.`;
  }

  result.totalCompaniesChecked = companies.size;
  return result;
}
