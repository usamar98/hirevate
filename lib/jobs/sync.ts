import { syncAdzunaJobs } from "@/lib/jobs/adzuna";
import { syncGreenhouseJobs } from "@/lib/jobs/greenhouse";
import { syncSerpApiJobs } from "@/lib/jobs/serpapi";
import type { JobSyncResult } from "@/lib/jobs/sync-types";

function emptyResult(): JobSyncResult {
  return {
    errors: [],
    sourceResults: [],
    totalCompaniesChecked: 0,
    totalJobsInserted: 0,
    totalJobsUpdated: 0
  };
}

function mergeResult(target: JobSyncResult, source: JobSyncResult) {
  target.errors.push(...source.errors);
  target.sourceResults.push(...source.sourceResults);
  target.totalCompaniesChecked += source.totalCompaniesChecked;
  target.totalJobsInserted += source.totalJobsInserted;
  target.totalJobsUpdated += source.totalJobsUpdated;
}

export async function syncAllJobs(): Promise<JobSyncResult> {
  const result = emptyResult();

  try {
    const greenhouse = await syncGreenhouseJobs();
    mergeResult(result, {
      errors: greenhouse.errors,
      sourceResults: [greenhouse.sourceResult],
      totalCompaniesChecked: greenhouse.totalCompaniesChecked,
      totalJobsInserted: greenhouse.totalJobsInserted,
      totalJobsUpdated: greenhouse.totalJobsUpdated
    });
  } catch (error) {
    result.errors.push({
      source: "greenhouse",
      message: error instanceof Error ? error.message : "Greenhouse sync failed."
    });
  }

  try {
    mergeResult(result, await syncAdzunaJobs());
  } catch (error) {
    result.errors.push({
      source: "adzuna",
      message: error instanceof Error ? error.message : "Adzuna sync failed."
    });
  }

  try {
    mergeResult(result, await syncSerpApiJobs());
  } catch (error) {
    result.errors.push({
      source: "serpapi",
      message: error instanceof Error ? error.message : "SerpApi sync failed."
    });
  }

  return result;
}

export type { JobSyncResult } from "@/lib/jobs/sync-types";
