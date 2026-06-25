import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { JobSyncResult } from "@/lib/jobs/sync-types";

const defaultStaleDays = 45;

function getStaleCutoff(days = defaultStaleDays) {
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  return cutoff.toISOString();
}

export async function expireStaleJobs(days = defaultStaleDays): Promise<JobSyncResult> {
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
  const staleFilter = `updated_at.is.null,updated_at.lt.${cutoff}`;
  const { count, error: countError } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .lt("discovered_at", cutoff)
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

  const totalJobsExpired = count ?? 0;

  if (totalJobsExpired > 0) {
    const { error: updateError } = await supabase
      .from("jobs")
      .update({ status: "expired" })
      .eq("status", "active")
      .lt("discovered_at", cutoff)
      .or(staleFilter);

    if (updateError) {
      return {
        errors: [
          {
            source: "maintenance",
            message: updateError.message
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
          totalJobsExpired > 0
            ? `${totalJobsExpired} stale jobs older than ${days} days were expired.`
            : undefined,
        source: "maintenance",
        totalJobsExpired,
        totalJobsFetched: 0,
        totalJobsInserted: 0,
        totalJobsUpdated: 0,
        totalRequests: 1
      }
    ],
    totalCompaniesChecked: 0,
    totalJobsExpired,
    totalJobsInserted: 0,
    totalJobsUpdated: 0
  };
}
