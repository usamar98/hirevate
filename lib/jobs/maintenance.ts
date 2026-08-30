import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getJobDuplicateKey, isPreferredDuplicateCandidate } from "@/lib/jobs/dedupe";
import type { JobSyncResult } from "@/lib/jobs/sync-types";
import type { JobWithCompany } from "@/types/database";

// Retention applies only after a listing is explicitly expired, never because
// a provider failed or a rotating source batch did not refresh an active job.
export const JOB_RETENTION_DAYS = 30;

function getExpiredCutoff(days = JOB_RETENTION_DAYS) {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff.toISOString();
}

// Keep the existing export for manual-sync callers. "Stale" now means an
// already-expired record beyond its recovery window, not an unrefreshed job.
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

  const retentionDays = Number.isFinite(days)
    ? Math.max(JOB_RETENTION_DAYS, Math.floor(days))
    : JOB_RETENTION_DAYS;
  const cutoff = getExpiredCutoff(retentionDays);
  // Filter the DELETE itself to protect jobs reactivated between requests.
  // SQL comparisons exclude NULL expiration timestamps without guessing them.
  const { count, error: deleteError } = await supabase
    .from("jobs")
    .delete({ count: "exact" })
    .eq("status", "expired")
    .lt("updated_at", cutoff);

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

  return {
    errors: [],
    sourceResults: [
      {
        configured: true,
        skippedReason:
          totalJobsDeleted > 0
            ? `${totalJobsDeleted} expired jobs beyond the ${retentionDays}-day recovery window were permanently deleted. Active jobs were retained.`
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
        .update({ status: "expired", updated_at: new Date().toISOString() })
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
