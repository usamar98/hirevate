// Read-only, low-egress production diagnostic. Never prints keys or job/user rows.
// Run: npx vercel env run -e production -- node scripts/check-job-data-health.mjs
import { createClient } from "@supabase/supabase-js";

if (process.argv[2] === "--env-file" && process.argv[3]) process.loadEnvFile(process.argv[3]);
const read = (name) => (process.env[name] ?? "").trim().replace(/^(["'])(.*)\1$/, "$2");
const url = read("NEXT_PUBLIC_SUPABASE_URL");
const key = read("SUPABASE_SERVICE_ROLE_KEY") || read("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const report = {
  checkedAt: new Date().toISOString(),
  projectHost: url ? new URL(url).host : null,
  config: Object.fromEntries([
    "NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY",
    "CRON_SECRET", "ADZUNA_APP_ID", "ADZUNA_APP_KEY"
  ].map((name) => [name, Boolean(read(name))])),
  adzunaCountry: read("ADZUNA_COUNTRY"),
  adzunaAllowedCountries: read("ADZUNA_COUNTRIES") || "default",
  syncBudgetMs: read("DAILY_FRESH_SYNC_BUDGET_MS") || "default",
  checks: {}
};
if (url && key) {
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(20000) }) }
  });
  const check = async (name, query, summarize = (data, count) => ({ count })) => {
    try {
      const { data, error, count, status } = await query;
      report.checks[name] = error
        ? { ok: false, status, code: error.code || "unknown" }
        : { ok: true, status, ...summarize(data, count) };
    } catch {
      report.checks[name] = { ok: false, code: "network_or_timeout" };
    }
  };
  await check("activeJobs", client.from("jobs").select("id", { count: "exact", head: true }).eq("status", "active"));
  await check("expiredJobs", client.from("jobs").select("id", { count: "exact", head: true }).eq("status", "expired"));
  for (const days of [1, 5, 10, 30]) {
    await check(`activeSeenWithin${days}Days`, client.from("jobs").select("id", { count: "exact", head: true })
      .eq("status", "active").gte("last_seen_at", new Date(Date.now() - days * 86400000).toISOString()));
  }
  await check("publicJoinSchema", client.from("jobs")
    .select("id,companies:company_id!inner(id,prominence_rank)").eq("status", "active").limit(1),
    (data) => ({ readable: true, hasSample: Boolean(data?.length) }));
  await check("latestJobRefresh", client.from("jobs").select("last_seen_at,updated_at")
    .eq("status", "active").order("last_seen_at", { ascending: false, nullsFirst: false }).limit(1),
    (data) => ({ latest: data?.[0] ?? null }));
  await check("spainJobs", client.from("jobs").select("id", { count: "exact", head: true }).eq("status", "active")
    .or("location.ilike.%Spain%,location.ilike.%España%,location.ilike.%Madrid%,location.ilike.%Barcelona%"));
  await check("sourceHealth", client.from("job_source_health")
    .select("source,status,last_success_at,last_failure_at,consecutive_failures").limit(1000),
    (data) => ({ sampledSources: data?.length ?? 0, statusCounts: (data ?? []).reduce((counts, row) => {
      counts[row.status] = (counts[row.status] ?? 0) + 1;
      return counts;
    }, {}), latestSuccess: (data ?? []).map((row) => row.last_success_at).filter(Boolean).sort().at(-1) ?? null }));
} else {
  report.checks.configuration = { ok: false, code: "missing_supabase_config" };
}
console.log(JSON.stringify(report, null, 2));
if (Object.values(report.checks).some((check) => !check.ok)) process.exitCode = 1;
