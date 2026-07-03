import { env } from "@/lib/env";
import { syncAdzunaJobs } from "@/lib/jobs/adzuna";
import { syncGreenhouseJobs } from "@/lib/jobs/greenhouse";
import { syncLeverJobs } from "@/lib/jobs/lever";
import { expireDuplicateJobs, expireStaleJobs } from "@/lib/jobs/maintenance";
import type { JobSyncResult } from "@/lib/jobs/sync-types";

const defaultDailyFreshQueries = [
  "remote jobs",
  "software engineer",
  "data analyst",
  "product manager",
  "project manager",
  "business analyst",
  "marketing manager",
  "sales representative",
  "customer success",
  "operations manager",
  "designer",
  "finance analyst",
  "account executive",
  "human resources",
  "cybersecurity analyst",
  "devops engineer",
  "administrative assistant",
  "customer support",
  "healthcare jobs",
  "warehouse supervisor"
];

type DailyFreshJobPlan = {
  adzunaQueries: string[];
  freshWindowDays: number;
  runDate: string;
  staleAfterDays: number;
};

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

function parsePositiveInt(value: string, fallback: number, max: number) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), max);
}

function parseQueries(value: string) {
  const queries = value
    .split(/[,\n;]/)
    .map((query) => query.trim())
    .filter(Boolean);

  return Array.from(new Set(queries));
}

function getUtcDaySeed(date: Date) {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000);
}

function rotateQueries(queries: string[], count: number, seed: number) {
  if (queries.length === 0) return [];

  const selected: string[] = [];
  for (let index = 0; selected.length < Math.min(count, queries.length); index += 1) {
    const query = queries[(seed + index) % queries.length];
    if (query && !selected.includes(query)) selected.push(query);
  }

  return selected;
}

export function buildDailyFreshJobPlan(now = new Date()): DailyFreshJobPlan {
  const pool = parseQueries(env.dailyFreshJobQueries).length > 0
    ? parseQueries(env.dailyFreshJobQueries)
    : defaultDailyFreshQueries;
  const seed = getUtcDaySeed(now);
  const freshWindowDays = parsePositiveInt(env.dailyFreshMaxDaysOld, 3, 14);
  const staleAfterDays = parsePositiveInt(env.dailyFreshStaleDays, 45, 120);
  const adzunaQueryCount = parsePositiveInt(env.dailyFreshAdzunaQueryCount, 8, 20);

  return {
    adzunaQueries: rotateQueries(pool, adzunaQueryCount, seed),
    freshWindowDays,
    runDate: now.toISOString().slice(0, 10),
    staleAfterDays
  };
}

function addPlannerSummary(result: JobSyncResult, plan: DailyFreshJobPlan) {
  result.sourceResults.unshift({
    configured: true,
    skippedReason: `Daily fresh plan ${plan.runDate}: ${plan.adzunaQueries.length} Adzuna searches, ${plan.freshWindowDays}-day freshness window, stale jobs expire after ${plan.staleAfterDays} days.`,
    source: "freshness-planner",
    totalJobsFetched: 0,
    totalJobsInserted: 0,
    totalJobsUpdated: 0,
    totalRequests: plan.adzunaQueries.length
  });
}

export async function syncDailyFreshJobs(now = new Date()): Promise<JobSyncResult> {
  const plan = buildDailyFreshJobPlan(now);
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
    mergeResult(
      result,
      await syncAdzunaJobs({
        maxDaysOld: plan.freshWindowDays,
        queries: plan.adzunaQueries
      })
    );
  } catch (error) {
    mergeResult(result, failedSourceResult("adzuna", getSyncErrorMessage(error, "Adzuna sync failed.")));
  }

  try {
    mergeResult(result, await syncLeverJobs());
  } catch (error) {
    mergeResult(result, failedSourceResult("lever", getSyncErrorMessage(error, "Lever sync failed.")));
  }

  try {
    mergeResult(result, await expireStaleJobs(plan.staleAfterDays));
  } catch (error) {
    mergeResult(result, failedSourceResult("maintenance", getSyncErrorMessage(error, "Job maintenance failed.")));
  }

  try {
    mergeResult(result, await expireDuplicateJobs());
  } catch (error) {
    mergeResult(result, failedSourceResult("maintenance", getSyncErrorMessage(error, "Job dedupe failed.")));
  }

  addPlannerSummary(result, plan);
  return result;
}