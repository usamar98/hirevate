import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getJobDuplicateKey, isPreferredDuplicateCandidate } from "@/lib/jobs/dedupe";
import type { JobSyncResult } from "@/lib/jobs/sync-types";
import type { JobWithCompany } from "@/types/database";

export const JOB_RETENTION_DAYS = 10;

function getStaleCutoff(days = JOB_RETENTION_DAYS) {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff.toISOString();
}

export async function deleteStaleJobs(days = JOB_RETENTION_DAYS): Promise<JobSyncResult> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return {
      errors: [
        {
          source: "maintenance",
          message: "Supabase service role environment variables are not configured."
        }
      ],
      sourceResults: [
        {
          configured: false,
          source: "maintenance",
          totalJobsFetched: 0,
          totalJobsInserted: 0,
          totalJobsUpdated: 0,
          totalRequests: 0
        }
      ],
      totalCompaniesChecked: 0,
      totalJobsExpired: 0,
      totalJobsInserted: 0,
      totalJobsUpdated: 0
    };
  }

  const cutoff = getStaleCutoff(days);
  const staleFilter = [
    `last_seen_at.lt.${cutoff}`,
    `and(last_seen_at.is.null,updated_at.lt.${cutoff})`,
    `and(last_seen_at.is.null,updated_at.is.null,discovered_at.lt.${cutoff})`
  ].join(",");
  const { count, error: countError } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .or(staleFilter);

  if (countError) {
    return {
      errors: [
        {
          source: "maintenance",
          message: countError.message
        }
      ],
      sourceResults: [
        {
          configured: true,
          source: "maintenance",
          totalJobsFetched: 0,
          totalJobsInserted: 0,
          totalJobsUpdated: 0,
          totalRequests: 1
        }
      ],
      totalCompaniesChecked: 0,
      totalJobsExpired: 0,
      totalJobsInserted: 0,
      totalJobsUpdated: 0
    };
  }

  const totalJobsDeleted = count ?? 0;

  if (totalJobsDeleted > 0) {
    const { error: deleteError } = await supabase
      .from("jobs")
      .delete()
      .or(staleFilter);

    if (deleteError) {
      return {
        errors: [
          {
            source: "maintenance",
            message: deleteError.message
          }
        ],
        sourceResults: [
          {
            configured: true,
            source: "maintenance",
            totalJobsExpired: 0,
            totalJobsFetched: 0,
            totalJobsInserted: 0,
            totalJobsUpdated: 0,
            totalRequests: 1
          }
        ],
        totalCompaniesChecked: 0,
        totalJobsExpired: 0,
        totalJobsInserted: 0,
        totalJobsUpdated: 0
      };
    }
  }

  return {
    errors: [],
    sourceResults: [
      {
        configured: true,
        skippedReason:
          totalJobsDeleted > 0
            ? `${totalJobsDeleted} jobs not seen by any source for ${days} days were permanently deleted.`
            : undefined,
        source: "maintenance",
        totalJobsDeleted,
        totalJobsFetched: 0,
        totalJobsInserted: 0,
        totalJobsUpdated: 0,
        totalRequests: 1
      }
    ],
    totalCompaniesChecked: 0,
    totalJobsDeleted,
    totalJobsExpired: 0,
    totalJobsInserted: 0,
    totalJobsUpdated: 0
  };
}

export async function expireDuplicateJobs(): Promise<JobSyncResult> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return {
      errors: [
        {
          source: "maintenance",
          message: "Supabase service role environment variables are not configured."
        }
      ],
      sourceResults: [
        {
          configured: false,
          source: "maintenance",
          totalJobsFetched: 0,
          totalJobsInserted: 0,
          totalJobsUpdated: 0,
          totalRequests: 0
        }
      ],
      totalCompaniesChecked: 0,
      totalJobsExpired: 0,
      totalJobsInserted: 0,
      totalJobsUpdated: 0
    };
  }

  const { data, error } = await supabase
    .from("jobs")
    .select("id, company_id, title, location, apply_url, discovered_at, updated_at, last_seen_at, freshness_score, status, companies:company_id(id, name, greenhouse_slug, website)")
    .eq("status", "active")
    .not("apply_url", "is", null)
    .limit(10000);

  if (error) {
    return {
      errors: [{ source: "maintenance", message: error.message }],
      sourceResults: [
        {
          configured: true,
          source: "maintenance",
          totalJobsExpired: 0,
          totalJobsFetched: 0,
          totalJobsInserted: 0,
          totalJobsUpdated: 0,
          totalRequests: 1
        }
      ],
      totalCompaniesChecked: 0,
      totalJobsExpired: 0,
      totalJobsInserted: 0,
      totalJobsUpdated: 0
    };
  }

  const winners = new Map<string, JobWithCompany>();
  const duplicateIds = new Set<string>();

  for (const job of (data ?? []) as JobWithCompany[]) {
    const key = getJobDuplicateKey(job);
    const current = winners.get(key);

    if (!current) {
      winners.set(key, job);
      continue;
    }

    if (isPreferredDuplicateCandidate(job, current)) {
      duplicateIds.add(current.id);
      winners.set(key, job);
    } else {
      duplicateIds.add(job.id);
    }
  }

  const ids = Array.from(duplicateIds);

  if (ids.length > 0) {
    for (let index = 0; index < ids.length; index += 500) {
      const batch = ids.slice(index, index + 500);
      const { error: updateError } = await supabase
        .from("jobs")
        .update({ status: "expired" })
        .in("id", batch);

      if (updateError) {
        return {
          errors: [{ source: "maintenance", message: updateError.message }],
          sourceResults: [
            {
              configured: true,
              source: "maintenance",
              totalJobsExpired: 0,
              totalJobsFetched: data?.length ?? 0,
              totalJobsInserted: 0,
              totalJobsUpdated: 0,
              totalRequests: 1
            }
          ],
          totalCompaniesChecked: 0,
          totalJobsExpired: 0,
          totalJobsInserted: 0,
          totalJobsUpdated: 0
        };
      }
    }
  }

  return {
    errors: [],
    sourceResults: [
      {
        configured: true,
        skippedReason:
          ids.length > 0
            ? `${ids.length} duplicate jobs were expired by title, company, location, and apply URL.`
            : undefined,
        source: "maintenance",
        totalJobsExpired: ids.length,
        totalJobsFetched: data?.length ?? 0,
        totalJobsInserted: 0,
        totalJobsUpdated: 0,
        totalRequests: 1
      }
    ],
    totalCompaniesChecked: 0,
    totalJobsExpired: ids.length,
    totalJobsInserted: 0,
    totalJobsUpdated: 0
  };
}
