import { calculateFreshnessScore, inferRemoteType } from "@/lib/jobs/freshness";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Company, Database, Json } from "@/types/database";

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

export type SyncError = {
  company: string;
  slug: string;
  message: string;
};

export type SyncResult = {
  totalCompaniesChecked: number;
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
    throw new Error(`Greenhouse returned ${response.status}`);
  }

  const payload = (await response.json()) as GreenhouseResponse;
  return payload.jobs ?? [];
}

export async function syncGreenhouseJobs(): Promise<SyncResult> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role environment variables are not configured.");
  }

  const { data: companies, error: companiesError } = await supabase
    .from("companies")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (companiesError) {
    throw companiesError;
  }

  const result: SyncResult = {
    totalCompaniesChecked: 0,
    totalJobsInserted: 0,
    totalJobsUpdated: 0,
    errors: []
  };

  for (const company of companies ?? []) {
    result.totalCompaniesChecked += 1;

    try {
      const greenhouseJobs = await fetchGreenhouseJobs(company.greenhouse_slug);
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
          } else {
            result.totalJobsInserted += 1;
          }
        }
      }

      await supabase
        .from("companies")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", company.id);
    } catch (error) {
      result.errors.push({
        company: company.name,
        slug: company.greenhouse_slug,
        message: error instanceof Error ? error.message : "Unknown sync error"
      });
    }
  }

  return result;
}
