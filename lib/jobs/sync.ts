import { syncAdzunaJobs } from "@/lib/jobs/adzuna";
import { syncGreenhouseJobs } from "@/lib/jobs/greenhouse";
import { syncLeverJobs } from "@/lib/jobs/lever";
import { expireStaleJobs } from "@/lib/jobs/maintenance";
import { syncSerpApiJobs } from "@/lib/jobs/serpapi";
import type { JobSyncResult } from "@/lib/jobs/sync-types";

function emptyResult(): JobSyncResult {
  return {
    errors: [],
    sourceResults: [],
    totalCompaniesChecked: 0,
    totalJobsExpired: 0,
    totalJobsInserted: 0,
    totalJobsUpdated: 0
  };
}

function mergeResult(target: JobSyncResult, source: JobSyncResult) {
  target.errors.push(...source.errors);
  target.sourceResults.push(...source.sourceResults);
  target.totalCompaniesChecked += source.totalCompaniesChecked;
  target.totalJobsExpired = (target.totalJobsExpired ?? 0) + (source.totalJobsExpired ?? 0);
  target.totalJobsInserted += source.totalJobsInserted;
  target.totalJobsUpdated += source.totalJobsUpdated;
}

function getSyncErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;

  try {
    return JSON.stringify(error);
  } catch {
    return fallback;
  }
}

function failedSourceResult(source: string, message: string): JobSyncResult {
  return {
    errors: [{ source, message }],
    sourceResults: [
      {
        configured: true,
        skippedReason: message,
        source,
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
    mergeResult(result, failedSourceResult("greenhouse", getSyncErrorMessage(error, "Greenhouse sync failed.")));
  }

  try {
    mergeResult(result, await syncAdzunaJobs());
  } catch (error) {
    mergeResult(result, failedSourceResult("adzuna", getSyncErrorMessage(error, "Adzuna sync failed.")));
  }

  try {
    mergeResult(result, await syncLeverJobs());
  } catch (error) {
    mergeResult(result, failedSourceResult("lever", getSyncErrorMessage(error, "Lever sync failed.")));
  }

  try {
    mergeResult(result, await syncSerpApiJobs());
  } catch (error) {
    mergeResult(result, failedSourceResult("serpapi", getSyncErrorMessage(error, "SerpApi sync failed.")));
  }

  try {
    mergeResult(result, await expireStaleJobs());
  } catch (error) {
    mergeResult(result, failedSourceResult("maintenance", getSyncErrorMessage(error, "Job maintenance failed.")));
  }

  return result;
}

export type { JobSyncResult } from "@/lib/jobs/sync-types";
