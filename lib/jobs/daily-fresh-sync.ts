import { env } from "@/lib/env";
import { getConfiguredAdzunaCountries, syncAdzunaJobs } from "@/lib/jobs/adzuna";
import { syncAshbyJobs } from "@/lib/jobs/ashby";
import { syncGreenhouseJobs } from "@/lib/jobs/greenhouse";
import { syncJoobleAustraliaJobs, syncJoobleUaeJobs } from "@/lib/jobs/jooble";
import { syncLeverJobs } from "@/lib/jobs/lever";
import { revalidateExistingJobLinks } from "@/lib/jobs/existing-link-validation";
import { deleteStaleJobs, expireDuplicateJobs, JOB_RETENTION_DAYS } from "@/lib/jobs/maintenance";
import { getSourceBatchSeed, rotateItems } from "@/lib/jobs/source-rotation";
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
  adzunaCountries: string[];
  adzunaQueries: string[];
  ashbyCompanyCount: number;
  freshWindowDays: number;
  greenhouseCompanyCount: number;
  joobleQueries: string[];
  leverCompanyCount: number;
  runDate: string;
  sourceRotationSeed: number;
  sourceOrder: string[];
  retentionDays: number;
  syncBudgetMs: number;
};

function emptyResult(): JobSyncResult {
  return {
    errors: [],
    sourceResults: [],
    totalCompaniesChecked: 0,
    totalJobsDeleted: 0,
    totalJobsExpired: 0,
    totalJobsInserted: 0,
    totalJobsUpdated: 0
  };
}

function mergeResult(target: JobSyncResult, source: JobSyncResult) {
  target.errors.push(...source.errors);
  target.sourceResults.push(...source.sourceResults);
  target.totalCompaniesChecked += source.totalCompaniesChecked;
  target.totalJobsDeleted = (target.totalJobsDeleted ?? 0) + (source.totalJobsDeleted ?? 0);
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
        totalJobsExpired: 0,
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

function skippedSourceResult(source: string, message: string): JobSyncResult {
  return {
    errors: [],
    sourceResults: [
      {
        configured: true,
        skippedReason: message,
        source,
        totalJobsExpired: 0,
        totalJobsFetched: 0,
        totalJobsInserted: 0,
        totalJobsUpdated: 0,
        totalRequests: 0,
        totalSkipped: 1
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

function hasTimeBudget(startedAt: number, budgetMs: number) {
  const elapsedMs = Date.now() - startedAt;
  return elapsedMs < Math.max(1_000, budgetMs - 5_000);
}

function budgetSkipMessage(source: string, budgetMs: number) {
  return `${source} skipped because the daily sync reached its ${Math.round(budgetMs / 1000)}s time budget. Provider priority rotates daily; active listings are retained when refreshes are skipped.`;
}

export function buildDailyFreshJobPlan(now = new Date()): DailyFreshJobPlan {
  const configuredPool = parseQueries(env.dailyFreshJobQueries);
  const pool = configuredPool.length > 0 ? configuredPool : defaultDailyFreshQueries;
  const seed = getUtcDaySeed(now);
  const freshWindowDays = parsePositiveInt(env.dailyFreshMaxDaysOld, 3, 14);
  const adzunaQueryCount = parsePositiveInt(env.dailyFreshAdzunaQueryCount, 8, 20);
  const joobleQueryCount = parsePositiveInt(env.dailyFreshJoobleQueryCount, 4, 12);
  const adzunaCountries = getConfiguredAdzunaCountries();

  return {
    adzunaCountries,
    adzunaQueries: rotateQueries(pool, adzunaQueryCount, seed),
    ashbyCompanyCount: parsePositiveInt(env.dailyFreshAshbyCompanyCount, 35, 200),
    freshWindowDays,
    greenhouseCompanyCount: parsePositiveInt(env.dailyFreshGreenhouseCompanyCount, 40, 200),
    joobleQueries: rotateQueries(pool, joobleQueryCount, seed + adzunaQueryCount),
    leverCompanyCount: parsePositiveInt(env.dailyFreshLeverCompanyCount, 35, 200),
    runDate: now.toISOString().slice(0, 10),
    sourceRotationSeed: seed,
    sourceOrder: rotateItems([
      "jooble-ae",
      ...adzunaCountries.map((country) => `adzuna-${country}`),
      "jooble-au",
      "ashby",
      "lever",
      "greenhouse"
    ], seed),
    retentionDays: JOB_RETENTION_DAYS,
    // Preserve the existing conservative budget and five-second response buffer.
    syncBudgetMs: parsePositiveInt(env.dailyFreshSyncBudgetMs, 55_000, 55_000)
  };
}

function addPlannerSummary(result: JobSyncResult, plan: DailyFreshJobPlan) {
  result.sourceResults.unshift({
    configured: true,
    skippedReason: `Daily fresh plan ${plan.runDate}: rotating provider order ${plan.sourceOrder.join(" -> ")}. Adzuna ${plan.adzunaQueries.length} searches per market; Jooble ${plan.joobleQueries.length} searches per market; ATS batches: Ashby ${plan.ashbyCompanyCount}, Lever ${plan.leverCompanyCount}, Greenhouse ${plan.greenhouseCompanyCount}. Discovery window ${plan.freshWindowDays} days; only expired jobs beyond the ${plan.retentionDays}-day recovery window may be deleted. Active jobs are never deleted for a missed refresh. Time budget ${Math.round(plan.syncBudgetMs / 1000)}s.`,
    source: "freshness-planner",
    totalJobsExpired: 0,
    totalJobsFetched: 0,
    totalJobsInserted: 0,
    totalJobsUpdated: 0,
    totalRequests:
      plan.adzunaQueries.length * plan.adzunaCountries.length +
      plan.joobleQueries.length * 2 +
      plan.ashbyCompanyCount +
      plan.leverCompanyCount +
      plan.greenhouseCompanyCount
  });
}

async function runPlannedSource(
  target: JobSyncResult,
  source: string,
  startedAt: number,
  budgetMs: number,
  action: () => Promise<JobSyncResult>,
  fallback: string
) {
  if (!hasTimeBudget(startedAt, budgetMs)) {
    mergeResult(target, skippedSourceResult(source, budgetSkipMessage(source, budgetMs)));
    return;
  }

  try {
    mergeResult(target, await action());
  } catch (error) {
    mergeResult(target, failedSourceResult(source, getSyncErrorMessage(error, fallback)));
  }
}

export async function syncDailyFreshJobs(now = new Date()): Promise<JobSyncResult> {
  const plan = buildDailyFreshJobPlan(now);
  const result = emptyResult();
  const startedAt = Date.now();

  const sources: Array<{
    source: string;
    action: () => Promise<JobSyncResult>;
    fallback: string;
  }> = [
    {
      source: "jooble-ae",
      action: () => syncJoobleUaeJobs({
        maxDaysOld: plan.freshWindowDays,
        queries: plan.joobleQueries
      }),
      fallback: "Jooble UAE sync failed."
    },
    ...plan.adzunaCountries.map((country) => ({
      source: `adzuna-${country}`,
      action: () => syncAdzunaJobs({
        country,
        maxDaysOld: plan.freshWindowDays,
        queries: plan.adzunaQueries
      }),
      fallback: `Adzuna ${country.toUpperCase()} sync failed.`
    })),
    {
      source: "jooble-au",
      action: () => syncJoobleAustraliaJobs({
        maxDaysOld: plan.freshWindowDays,
        queries: plan.joobleQueries
      }),
      fallback: "Jooble Australia sync failed."
    },
    {
      source: "ashby",
      action: () => syncAshbyJobs({
        maxCompanies: plan.ashbyCompanyCount,
        offsetSeed: getSourceBatchSeed(plan.sourceRotationSeed, plan.sourceOrder, "ashby")
      }),
      fallback: "Ashby sync failed."
    },
    {
      source: "lever",
      action: () => syncLeverJobs({
        maxCompanies: plan.leverCompanyCount,
        offsetSeed: getSourceBatchSeed(plan.sourceRotationSeed, plan.sourceOrder, "lever")
      }),
      fallback: "Lever sync failed."
    },
    {
      source: "greenhouse",
      action: async () => {
        const greenhouse = await syncGreenhouseJobs({
          maxCompanies: plan.greenhouseCompanyCount,
          offsetSeed: getSourceBatchSeed(plan.sourceRotationSeed, plan.sourceOrder, "greenhouse")
        });

        return {
          errors: greenhouse.errors,
          sourceResults: [greenhouse.sourceResult],
          totalCompaniesChecked: greenhouse.totalCompaniesChecked,
          totalJobsExpired: greenhouse.totalJobsExpired ?? 0,
          totalJobsInserted: greenhouse.totalJobsInserted,
          totalJobsUpdated: greenhouse.totalJobsUpdated
        };
      },
      fallback: "Greenhouse sync failed."
    }
  ];

  // Await each provider: no timed-out background sync may keep mutating jobs.
  // Rotating priority stops the same late providers being skipped every day.
  for (const source of rotateItems(sources, plan.sourceRotationSeed)) {
    await runPlannedSource(
      result,
      source.source,
      startedAt,
      plan.syncBudgetMs,
      source.action,
      source.fallback
    );
  }

  // Recheck a bounded rotating queue after source upserts so a dead link cannot
  // be reactivated later in this run. Only a second permanent failure expires it.
  try {
    mergeResult(result, await revalidateExistingJobLinks());
  } catch (error) {
    mergeResult(
      result,
      failedSourceResult(
        "link-validation",
        getSyncErrorMessage(error, "Existing job link validation failed.")
      )
    );
  }

  // Cleanup is safe after failed/skipped refreshes: only already-expired jobs
  // beyond their recovery window are eligible, never active unseen listings.
  try {
    mergeResult(result, await deleteStaleJobs(plan.retentionDays));
  } catch (error) {
    mergeResult(result, failedSourceResult("maintenance", getSyncErrorMessage(error, "Job retention cleanup failed.")));
  }

  await runPlannedSource(
    result,
    "maintenance",
    startedAt,
    plan.syncBudgetMs,
    () => expireDuplicateJobs(),
    "Job dedupe failed."
  );

  addPlannerSummary(result, plan);
  return result;
}
