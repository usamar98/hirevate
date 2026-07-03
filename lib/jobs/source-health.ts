import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, JobSourceHealth } from "@/types/database";

type SourceHealthClient = SupabaseClient<Database>;

type SourceIdentity = {
  displayName: string;
  source: string;
  sourceKey: string;
};

type SourceHealthOutcome = {
  jobsFetched: number;
  jobsInserted: number;
};

type SourceHealthStatus = {
  reason?: string;
  setupRequired?: boolean;
  shouldSkip: boolean;
};

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function isMissingHealthSchema(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST202" ||
    error?.code === "PGRST205" ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("could not find")
  );
}

function sanitizeError(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 500);
}

function getCooldownUntil(consecutiveFailures: number) {
  if (consecutiveFailures < 2) return null;

  const hoursByFailures = [0, 0, 12, 24, 72, 168];
  const hours = hoursByFailures[Math.min(consecutiveFailures, hoursByFailures.length - 1)] ?? 168;
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

async function readHealth(supabase: SourceHealthClient, identity: SourceIdentity) {
  const { data, error } = await supabase
    .from("job_source_health")
    .select("*")
    .eq("source", identity.source)
    .eq("source_key", identity.sourceKey)
    .maybeSingle();

  if (error) {
    if (isMissingHealthSchema(error)) return { health: null, setupRequired: true };
    console.error("Failed to read job source health", error);
    return { health: null, setupRequired: false };
  }

  return { health: data as JobSourceHealth | null, setupRequired: false };
}

export async function getSourceHealthStatus(
  supabase: SourceHealthClient,
  identity: SourceIdentity
): Promise<SourceHealthStatus> {
  const { health, setupRequired } = await readHealth(supabase, identity);
  if (setupRequired || !health) return { setupRequired, shouldSkip: false };

  const disabledUntil = health.disabled_until ? new Date(health.disabled_until) : null;
  if (health.status === "disabled" && !disabledUntil) {
    return {
      reason: `${identity.displayName} is disabled after repeated source failures.`,
      shouldSkip: true
    };
  }

  if (disabledUntil && disabledUntil.getTime() > Date.now()) {
    return {
      reason: `${identity.displayName} is cooling down until ${disabledUntil.toISOString()}.`,
      shouldSkip: true
    };
  }

  return { shouldSkip: false };
}

export async function recordSourceSuccess(
  supabase: SourceHealthClient,
  identity: SourceIdentity,
  outcome: SourceHealthOutcome
) {
  const { health, setupRequired } = await readHealth(supabase, identity);
  if (setupRequired) return;

  const today = getTodayIsoDate();
  const previousSuccesses = health?.total_successes ?? 0;
  const previousAverage = Number(health?.average_jobs_fetched ?? 0);
  const totalSuccesses = previousSuccesses + 1;
  const averageJobsFetched =
    totalSuccesses > 0
      ? (previousAverage * previousSuccesses + outcome.jobsFetched) / totalSuccesses
      : outcome.jobsFetched;
  const insertedToday =
    health?.checked_today_at === today
      ? (health?.inserted_today ?? 0) + outcome.jobsInserted
      : outcome.jobsInserted;

  const { error } = await supabase.from("job_source_health").upsert(
    {
      average_jobs_fetched: Number(averageJobsFetched.toFixed(2)),
      checked_today_at: today,
      consecutive_failures: 0,
      disabled_until: null,
      display_name: identity.displayName,
      inserted_today: insertedToday,
      last_error: null,
      last_jobs_fetched: outcome.jobsFetched,
      last_jobs_inserted: outcome.jobsInserted,
      last_success_at: new Date().toISOString(),
      source: identity.source,
      source_key: identity.sourceKey,
      status: "active",
      total_failures: health?.total_failures ?? 0,
      total_successes: totalSuccesses,
      updated_at: new Date().toISOString()
    },
    { onConflict: "source,source_key" }
  );

  if (error && !isMissingHealthSchema(error)) {
    console.error("Failed to record job source success", error);
  }
}

export async function recordSourceFailure(
  supabase: SourceHealthClient,
  identity: SourceIdentity,
  errorMessage: string,
  options: { permanent?: boolean } = {}
) {
  const { health, setupRequired } = await readHealth(supabase, identity);
  if (setupRequired) return;

  const consecutiveFailures = (health?.consecutive_failures ?? 0) + 1;
  const disabledUntil = options.permanent ? null : getCooldownUntil(consecutiveFailures);
  const status = options.permanent ? "disabled" : disabledUntil ? "cooldown" : "active";

  const { error } = await supabase.from("job_source_health").upsert(
    {
      average_jobs_fetched: Number(health?.average_jobs_fetched ?? 0),
      checked_today_at: health?.checked_today_at ?? null,
      consecutive_failures: consecutiveFailures,
      disabled_until: disabledUntil,
      display_name: identity.displayName,
      inserted_today: health?.inserted_today ?? 0,
      last_error: sanitizeError(errorMessage),
      last_failure_at: new Date().toISOString(),
      last_jobs_fetched: health?.last_jobs_fetched ?? 0,
      last_jobs_inserted: health?.last_jobs_inserted ?? 0,
      last_success_at: health?.last_success_at ?? null,
      source: identity.source,
      source_key: identity.sourceKey,
      status,
      total_failures: (health?.total_failures ?? 0) + 1,
      total_successes: health?.total_successes ?? 0,
      updated_at: new Date().toISOString()
    },
    { onConflict: "source,source_key" }
  );

  if (error && !isMissingHealthSchema(error)) {
    console.error("Failed to record job source failure", error);
  }
}