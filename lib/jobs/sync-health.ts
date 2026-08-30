import type { JobSyncResult } from "@/lib/jobs/sync-types";

const nonDiscoverySources = new Set(["freshness-planner", "maintenance", "link-validation"]);

export function getJobSyncHealth(result: JobSyncResult) {
  const providers = result.sourceResults.filter((source) => !nonDiscoverySources.has(source.source));
  const healthyProviders = providers.filter((source) => {
    if (!source.configured || source.setupRequired || source.totalRequests === 0) return false;
    // A partially successful provider still refreshed real listings.
    if (source.totalJobsInserted + source.totalJobsUpdated > 0) return true;
    const failed = result.errors.some((error) =>
      error.source === source.source || source.source.startsWith(`${error.source}-`)
    );
    // A successful empty source is valid; errors and skips are not success.
    return !failed && !source.skippedReason;
  });
  const refreshed = healthyProviders.length > 0;
  const partial = refreshed && (result.errors.length > 0 || healthyProviders.length < providers.length);
  return { status: refreshed ? (partial ? "partial" : "healthy") : "failed", refreshed } as const;
}
