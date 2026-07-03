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
  totalJobsInserted: number;
  totalJobsUpdated: number;
  errors: SyncError[];
};

function normalizeJob(company: Company, job: GreenhouseJob) {
  const location = job.location?.name ?? null;
  const applyUrl = job.absolute_url ?? null;
  const updatedAt = job.updated_at ?? null;

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
  const url = `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(
    slug
  )}/jobs?content=true`;
  const response = await fetch(url, {
    headers: {
      accept: "application/json"
    },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new GreenhouseHttpError(`Greenhouse returned ${response.status}`, response.status);
  }

  const payload = (await response.json()) as GreenhouseResponse;
  return payload.jobs ?? [];
}

function isRetiredGreenhouseBoard(error: unknown) {
  return error instanceof GreenhouseHttpError && (error.status === 404 || error.status === 410);
}

async function ensureDefaultCompanies(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>
) {
  const { count, error: countError } = await supabase
    .from("companies")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
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

export async function syncGreenhouseJobs(): Promise<SyncResult> {
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

  const result: SyncResult = {
    sourceResult: {
      configured: true,
      source: "greenhouse",
      totalJobsFetched: 0,
      totalJobsInserted: 0,
      totalJobsUpdated: 0,
      totalRequests: 0,
      totalSkipped: 0
    },
    totalCompaniesChecked: 0,
    totalJobsFetched: 0,
    totalJobsInserted: 0,
    totalJobsUpdated: 0,
    errors: []
  };

  for (const company of companies ?? []) {
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

  if ((result.sourceResult.totalSkipped ?? 0) > 0) {
    result.sourceResult.skippedReason = `${result.sourceResult.totalSkipped} Greenhouse boards were skipped because they are inactive, disabled, or cooling down.`;
  }

  return result;
}
