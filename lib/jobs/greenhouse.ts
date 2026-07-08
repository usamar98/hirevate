import { calculateFreshnessScore, inferRemoteType } from "@/lib/jobs/freshness";
import { defaultGreenhouseCompanies } from "@/lib/jobs/default-companies";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getSourceHealthStatus, recordSourceFailure, recordSourceSuccess } from "@/lib/jobs/source-health";
import type { Company, Database, Json } from "@/types/database";
import type { JobSyncError, JobSyncSourceResult } from "@/lib/jobs/sync-types";

type GreenhouseLocation = {
  name?: string | null;
};

type GreenhouseJob = {
  id: number | string;
  title: string;
  content?: string | null;
  location?: GreenhouseLocation | null;
  absolute_url?: string | null;
  updated_at?: string | null;
  departments?: unknown[];
  offices?: unknown[];
};

type GreenhouseResponse = {
  jobs?: GreenhouseJob[];
};

type SourceBatchOptions = {
  maxCompanies?: number;
  offsetSeed?: number;
};

class GreenhouseHttpError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "GreenhouseHttpError";
  }
}

export type SyncError = JobSyncError;

export type SyncResult = {
  sourceResult: JobSyncSourceResult;
  totalCompaniesChecked: number;
  totalJobsFetched: number;
  totalJobsExpired?: number;
  totalJobsInserted: number;
  totalJobsUpdated: number;
  errors: SyncError[];
};

const requestTimeoutMs = 10_000;

function normalizeBatchSize(value: number | undefined, total: number) {
  if (!value || !Number.isFinite(value)) return total;
  return Math.min(Math.max(Math.floor(value), 1), total);
}

function rotateItems<T>(items: T[], seed = 0) {
  if (items.length <= 1) return items;

  const offset = ((Math.abs(seed) % items.length) + items.length) % items.length;
  return [...items.slice(offset), ...items.slice(0, offset)];
}

function selectCompanyBatch(companies: Company[], options: SourceBatchOptions) {
  const batchSize = normalizeBatchSize(options.maxCompanies, companies.length);
  return rotateItems(companies, options.offsetSeed).slice(0, batchSize);
}

function normalizeJob(company: Company, job: GreenhouseJob) {
  const location = job.location?.name ?? null;
  const applyUrl = job.absolute_url ?? null;
  const updatedAt = job.updated_at ?? null;
  const lastSeenAt = new Date().toISOString();

  return {
    company_id: company.id,
    external_id: String(job.id),
    title: job.title,
    description: job.content ?? null,
    location,
    remote_type: inferRemoteType(job.title, location),
    source: "greenhouse",
    source_url: applyUrl,
    apply_url: applyUrl,
    posted_at: updatedAt,
    updated_at: updatedAt,
    last_seen_at: lastSeenAt,
    freshness_score: calculateFreshnessScore({
      applyUrl,
      location,
      sourceUrl: applyUrl,
      title: job.title,
      updatedAt
    }),
    status: "active",
    raw_data: job as unknown as Json
  } satisfies Database["public"]["Tables"]["jobs"]["Insert"];
}

async function fetchGreenhouseJobs(slug: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(
    slug
  )}/jobs?content=true`;

  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json"
      },
      next: { revalidate: 0 },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new GreenhouseHttpError(`Greenhouse returned ${response.status}`, response.status);
    }

    const payload = (await response.json()) as GreenhouseResponse;
    return payload.jobs ?? [];
  } finally {
    clearTimeout(timeout);
  }
}

function isRetiredGreenhouseBoard(error: unknown) {
  return error instanceof GreenhouseHttpError && (error.status === 404 || error.status === 410);
}

async function expireMissingGreenhouseJobs(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  companyId: string,
  activeExternalIds: string[]
) {
  const activeExternalIdSet = new Set(activeExternalIds);
  const { data, error } = await supabase
    .from("jobs")
    .select("id, external_id")
    .eq("company_id", companyId)
    .eq("source", "greenhouse")
    .eq("status", "active");

  if (error) throw error;

  const expiredIds = (data ?? [])
    .filter((job) => !activeExternalIdSet.has(job.external_id))
    .map((job) => job.id);

  for (let index = 0; index < expiredIds.length; index += 150) {
    const batch = expiredIds.slice(index, index + 150);
    const { error: updateError } = await supabase
      .from("jobs")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .in("id", batch);

    if (updateError) throw updateError;
  }

  return expiredIds.length;
}

async function ensureDefaultCompanies(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>
) {
  const { count, error: countError } = await supabase
    .from("companies")
    .select("id", { count: "exact", head: true })
    .not("greenhouse_slug", "like", "adzuna-%")
    .not("greenhouse_slug", "like", "lever-%")
    .not("greenhouse_slug", "like", "ashby-%")
    .not("greenhouse_slug", "like", "serpapi-%");

  if (countError) {
    throw countError;
  }

  if ((count ?? 0) > 0) {
    return;
  }

  const { error } = await supabase.from("companies").upsert(defaultGreenhouseCompanies, {
    onConflict: "greenhouse_slug"
  });

  if (error) {
    throw error;
  }
}

export async function syncGreenhouseJobs(options: SourceBatchOptions = {}): Promise<SyncResult> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role environment variables are not configured.");
  }

  await ensureDefaultCompanies(supabase);

  const { data: companies, error: companiesError } = await supabase
    .from("companies")
    .select("*")
    .eq("is_active", true)
    .not("greenhouse_slug", "like", "adzuna-%")
    .not("greenhouse_slug", "like", "lever-%")
    .not("greenhouse_slug", "like", "ashby-%")
    .not("greenhouse_slug", "like", "serpapi-%")
    .order("name", { ascending: true });

  if (companiesError) {
    throw companiesError;
  }

  const allCompanies = (companies ?? []) as Company[];
  const selectedCompanies = selectCompanyBatch(allCompanies, options);
  const batchSkipped = Math.max(0, allCompanies.length - selectedCompanies.length);

  const result: SyncResult = {
    sourceResult: {
      configured: true,
      source: "greenhouse",
      totalJobsFetched: 0,
      totalJobsInserted: 0,
      totalJobsUpdated: 0,
      totalRequests: 0,
      totalSkipped: batchSkipped
    },
    totalCompaniesChecked: 0,
    totalJobsFetched: 0,
    totalJobsExpired: 0,
    totalJobsInserted: 0,
    totalJobsUpdated: 0,
    errors: []
  };

  for (const company of selectedCompanies) {
    const healthIdentity = {
      displayName: company.name,
      source: "greenhouse",
      sourceKey: company.greenhouse_slug
    };
    const healthStatus = await getSourceHealthStatus(supabase, healthIdentity);

    if (healthStatus.shouldSkip) {
      result.sourceResult.totalSkipped = (result.sourceResult.totalSkipped ?? 0) + 1;
      continue;
    }

    result.totalCompaniesChecked += 1;

    try {
      result.sourceResult.totalRequests += 1;
      const greenhouseJobs = await fetchGreenhouseJobs(company.greenhouse_slug);
      let companyJobsInserted = 0;
      result.totalJobsFetched += greenhouseJobs.length;
      result.sourceResult.totalJobsFetched += greenhouseJobs.length;
      const normalizedJobs = greenhouseJobs.map((job) => normalizeJob(company, job));

      if (normalizedJobs.length > 0) {
        const externalIds = normalizedJobs.map((job) => job.external_id);
        const { data: existingJobs } = await supabase
          .from("jobs")
          .select("external_id")
          .eq("company_id", company.id)
          .in("external_id", externalIds);

        const existingIds = new Set((existingJobs ?? []).map((job) => job.external_id));

        const { error: upsertError } = await supabase.from("jobs").upsert(normalizedJobs, {
          onConflict: "company_id,external_id"
        });

        if (upsertError) {
          throw upsertError;
        }

        for (const job of normalizedJobs) {
          if (existingIds.has(job.external_id)) {
            result.totalJobsUpdated += 1;
            result.sourceResult.totalJobsUpdated += 1;
          } else {
            result.totalJobsInserted += 1;
            result.sourceResult.totalJobsInserted += 1;
            companyJobsInserted += 1;
          }
        }
      }

      const expiredCount = await expireMissingGreenhouseJobs(
        supabase,
        company.id,
        normalizedJobs.map((job) => job.external_id)
      );
      result.sourceResult.totalJobsExpired = (result.sourceResult.totalJobsExpired ?? 0) + expiredCount;
      result.totalJobsExpired = (result.totalJobsExpired ?? 0) + expiredCount;

      await recordSourceSuccess(supabase, healthIdentity, {
        jobsFetched: greenhouseJobs.length,
        jobsInserted: companyJobsInserted
      });

      await supabase
        .from("companies")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", company.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown sync error";

      if (isRetiredGreenhouseBoard(error)) {
        result.sourceResult.totalSkipped = (result.sourceResult.totalSkipped ?? 0) + 1;
        await recordSourceFailure(supabase, healthIdentity, message, { permanent: true });
        await supabase
          .from("companies")
          .update({ is_active: false, last_synced_at: new Date().toISOString() })
          .eq("id", company.id);
        continue;
      }

      await recordSourceFailure(supabase, healthIdentity, message);
      result.errors.push({
        source: "greenhouse",
        company: company.name,
        slug: company.greenhouse_slug,
        message
      });
    }
  }

  const messages = [];
  if (batchSkipped > 0) {
    messages.push(
      `Daily batch checked ${selectedCompanies.length} of ${allCompanies.length} Greenhouse boards; remaining boards rotate into future syncs.`
    );
  }
  if ((result.sourceResult.totalSkipped ?? 0) > batchSkipped) {
    messages.push("Some Greenhouse boards were skipped because they are inactive, disabled, or cooling down.");
  }

  if (messages.length > 0) {
    result.sourceResult.skippedReason = messages.join(" ");
  }

  return result;
}