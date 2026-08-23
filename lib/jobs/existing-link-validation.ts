import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { checkJobLinkReachability } from "@/lib/jobs/link-validation";
import type { JobSyncResult } from "@/lib/jobs/sync-types";

type ExistingJobLink = {
  apply_url: string | null;
  external_id: string;
  id: string;
  link_check_failures: number;
  source_url: string | null;
};

type LinkOutcome = Awaited<ReturnType<typeof checkJobLinkReachability>>;

const defaultBatchSize = 6;
const defaultConcurrency = 6;
const defaultTimeoutMs = 1_500;

function baseResult(): JobSyncResult {
  return {
    errors: [],
    sourceResults: [],
    totalCompaniesChecked: 0,
    totalJobsExpired: 0,
    totalJobsInserted: 0,
    totalJobsUpdated: 0
  };
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      const item = items[index];
      if (item !== undefined) results[index] = await mapper(item);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(Math.max(concurrency, 1), items.length) }, () => worker())
  );
  return results;
}

function getSetupError(message: string) {
  const result = baseResult();
  result.errors.push({ source: "link-validation", message });
  result.sourceResults.push({
    configured: false,
    skippedReason: message,
    source: "link-validation",
    totalJobsFetched: 0,
    totalJobsInserted: 0,
    totalJobsUpdated: 0,
    totalRequests: 0
  });
  return result;
}

export async function revalidateExistingJobLinks(
  batchSize = defaultBatchSize
): Promise<JobSyncResult> {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return getSetupError("Supabase service role environment variables are not configured.");
  }
  const admin = supabase;

  const safeBatchSize = Math.min(Math.max(batchSize, 1), 20);
  const { data, error } = await admin
    .from("jobs")
    .select("id, external_id, apply_url, source_url, link_check_failures")
    .eq("status", "active")
    .not("apply_url", "is", null)
    .order("link_check_failures", { ascending: false })
    .order("last_link_checked_at", { ascending: true, nullsFirst: true })
    .limit(safeBatchSize);

  if (error) return getSetupError(`Existing job link queue is unavailable: ${error.message}`);

  const jobs = (data ?? []) as ExistingJobLink[];
  const checks = await mapWithConcurrency(
    jobs,
    defaultConcurrency,
    async (job): Promise<{ job: ExistingJobLink; outcome: LinkOutcome }> => ({
      job,
      outcome: await checkJobLinkReachability(job.apply_url ?? job.source_url, defaultTimeoutMs)
    })
  );

  const reachableIds: string[] = [];
  const uncertainIds: string[] = [];
  const firstFailureIds: string[] = [];
  const expiredIds: string[] = [];

  for (const { job, outcome } of checks) {
    if (outcome.status === "reachable") reachableIds.push(job.id);
    else if (outcome.status === "uncertain") uncertainIds.push(job.id);
    else if (job.link_check_failures >= 1) expiredIds.push(job.id);
    else firstFailureIds.push(job.id);
  }

  const checkedAt = new Date().toISOString();
  const updateErrors: string[] = [];
  let totalRequests = 1;

  async function updateJobs(
    ids: string[],
    values: { last_link_checked_at: string; link_check_failures?: number; status?: string; updated_at?: string }
  ) {
    if (ids.length === 0) return;
    totalRequests += 1;
    const { error: updateError } = await admin.from("jobs").update(values).in("id", ids);
    if (updateError) updateErrors.push(updateError.message);
  }

  await Promise.all([
    updateJobs(reachableIds, { last_link_checked_at: checkedAt, link_check_failures: 0 }),
    updateJobs(uncertainIds, { last_link_checked_at: checkedAt }),
    updateJobs(firstFailureIds, { last_link_checked_at: checkedAt, link_check_failures: 1 }),
    updateJobs(expiredIds, {
      last_link_checked_at: checkedAt,
      link_check_failures: 2,
      status: "expired",
      updated_at: checkedAt
    })
  ]);

  const result = baseResult();
  result.totalJobsExpired = expiredIds.length;
  result.totalJobsUpdated = jobs.length;
  result.errors.push(
    ...Array.from(new Set(updateErrors)).map((message) => ({ source: "link-validation", message }))
  );
  result.sourceResults.push({
    configured: true,
    skippedReason:
      expiredIds.length > 0
        ? `${expiredIds.length} jobs were expired after two permanent link failures on separate daily runs.`
        : undefined,
    source: "link-validation",
    totalJobLinksChecked: jobs.length,
    totalJobLinksUncertain: uncertainIds.length,
    totalJobsExpired: expiredIds.length,
    totalJobsFetched: jobs.length,
    totalJobsInserted: 0,
    totalJobsUpdated: jobs.length,
    totalRequests
  });

  return result;
}
