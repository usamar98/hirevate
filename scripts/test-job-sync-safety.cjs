/* Local-only regression tests. All database/provider imports are mocked. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");
const fixedNow = Date.parse("2026-08-30T12:00:00.000Z");

function loadTs(file, mocks = {}, options = {}) {
  const filename = path.join(root, file);
  const source = fs.readFileSync(filename, "utf8") + (options.append ?? "");
  const output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS }
  }).outputText;
  const loadedModule = { exports: {} };
  vm.runInNewContext(output, {
    module: loadedModule,
    exports: loadedModule.exports,
    require(specifier) {
      if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
      if (options.allowUnusedImports) return {};
      throw new Error(`Unmocked import in ${file}: ${specifier}`);
    },
    Date: options.Date ?? Date,
    console,
    // No network, actual Supabase client, or environment secrets are exposed.
  }, { filename });
  return loadedModule.exports;
}

function fixedDate(clock = () => fixedNow) {
  return class extends Date {
    constructor(...args) {
      super(...(args.length ? args : [clock()]));
    }
    static now() { return clock(); }
  };
}

const rotation = loadTs("lib/jobs/source-rotation.ts");

for (const [size, batch] of [[140, 35], [143, 35], [97, 28], [5, 12]]) {
  test(`whole-batch rotation covers ${size} boards in ${Math.ceil(size / batch)} runs`, () => {
    const pool = Array.from({ length: size }, (_, index) => index);
    const seen = new Set();
    for (let run = 0; run < Math.ceil(size / batch); run += 1) {
      const selected = rotation.selectRotatingBatch(pool, batch, 20_000 + run);
      assert.equal(selected.length, Math.min(batch, size));
      assert.equal(new Set(selected).size, selected.length);
      selected.forEach((item) => seen.add(item));
    }
    assert.equal(seen.size, size);
    assert.deepEqual(pool, Array.from({ length: size }, (_, index) => index));
  });
}

test("rotation handles empty pools, zero slots and invalid seeds safely", () => {
  assert.equal(rotation.selectRotatingBatch([], 4).length, 0);
  assert.equal(rotation.selectRotatingBatch([1, 2], 0).length, 0);
  assert.deepEqual(Array.from(rotation.rotateItems([1, 2, 3], -1)), [3, 1, 2]);
  assert.deepEqual(Array.from(rotation.selectRotatingBatch([1, 2, 3], 2, NaN)), [1, 2]);
});

for (const [provider, selector] of [["greenhouse", "selectCompanyBatch"], ["lever", "selectSourceBatch"]]) {
  test(`${provider} selector uses whole-batch stride`, () => {
    const { testSelect } = loadTs(`lib/jobs/${provider}.ts`, {
      "@/lib/jobs/source-rotation": rotation
    }, { append: `\nexport { ${selector} as testSelect };`, allowUnusedImports: true });
    const pool = Array.from({ length: 140 }, (_, id) => ({ id }));
    const seen = new Set();
    for (let seed = 0; seed < 4; seed += 1) {
      testSelect(pool, { maxCompanies: 35, offsetSeed: seed }).forEach(({ id }) => seen.add(id));
    }
    assert.equal(seen.size, 140);
  });
}

test("Ashby reserves priority boards while rotating every remaining slot", () => {
  const { testSelect } = loadTs("lib/jobs/ashby.ts", {
    "@/lib/jobs/source-rotation": rotation
  }, { append: "\nexport { selectSourceBatch as testSelect };", allowUnusedImports: true });
  const priorities = ["airwallex", "halter", "lightspeedhq", "lyrebird-health", "maincode", "pluralis-research", "xero"];
  const pool = [...priorities, ...Array.from({ length: 97 }, (_, index) => `other-${index}`)]
    .map((slug) => ({ slug }));
  const seen = new Set();
  for (let seed = 0; seed < 4; seed += 1) {
    const selected = testSelect(pool, { maxCompanies: 35, offsetSeed: seed });
    assert.equal(selected.length, 35);
    priorities.forEach((slug) => assert(selected.some((row) => row.slug === slug)));
    selected.forEach(({ slug }) => seen.add(slug));
  }
  assert.equal(seen.size, pool.length);
});

test("first-priority ATS batches do not alias when eight providers share a tight budget", () => {
  const providers = ["ae", "us", "gb", "de", "au", "ashby", "lever", "greenhouse"];
  const pool = Array.from({ length: 140 }, (_, index) => index);
  const seen = new Set();
  for (let day = 0; day < providers.length * 4; day += 1) {
    const order = rotation.rotateItems(providers, day);
    if (order[0] !== "ashby") continue;
    const seed = rotation.getSourceBatchSeed(day, order, "ashby");
    rotation.selectRotatingBatch(pool, 35, seed).forEach((id) => seen.add(id));
  }
  assert.equal(seen.size, pool.length);
});

function maintenanceHarness(initialRows, options = {}) {
  const rows = structuredClone(initialRows);
  const calls = [];
  const client = {
    from(table) {
      assert.equal(table, "jobs");
      const filters = [];
      const query = {
        delete(value) { calls.push(["delete", value]); return query; },
        eq(column, value) { calls.push(["eq", column, value]); filters.push((row) => row[column] === value); return query; },
        async lt(column, cutoff) {
          calls.push(["lt", column, cutoff]);
          if (options.error) return { count: null, error: { message: options.error } };
          options.beforeDelete?.(rows);
          const eligible = rows.filter((row) => filters.every((filter) => filter(row)) &&
            row[column] !== null && Number.isFinite(Date.parse(row[column])) && Date.parse(row[column]) < Date.parse(cutoff));
          eligible.forEach((row) => rows.splice(rows.indexOf(row), 1));
          return { count: eligible.length, error: null };
        }
      };
      return query;
    }
  };
  const maintenance = loadTs("lib/jobs/maintenance.ts", {
    "@/lib/supabase/admin": { createSupabaseAdminClient: () => options.unconfigured ? null : client },
    "@/lib/jobs/dedupe": {}
  }, { Date: fixedDate() });
  return { ...maintenance, rows, calls };
}

test("retention deletes only expired jobs older than 30 days and never fabricates freshness", async () => {
  const fixtures = [
    { id: "active-old", status: "active", updated_at: "2020-01-01", last_seen_at: "2020-01-01" },
    { id: "expired-old", status: "expired", updated_at: "2026-07-01", last_seen_at: "2026-06-01" },
    { id: "expired-recent", status: "expired", updated_at: "2026-08-29", last_seen_at: "2020-01-01" },
    { id: "boundary", status: "expired", updated_at: "2026-07-31T12:00:00.000Z" },
    { id: "missing-date", status: "expired", updated_at: null },
    { id: "invalid-date", status: "expired", updated_at: "invalid" }
  ];
  const harness = maintenanceHarness(fixtures);
  const result = await harness.deleteStaleJobs();
  assert.equal(result.totalJobsDeleted, 1);
  assert.deepEqual(harness.rows, fixtures.filter((row) => row.id !== "expired-old"));
  assert.deepEqual(harness.calls.map(([name]) => name), ["delete", "eq", "lt"]);
  assert.deepEqual(harness.calls[1], ["eq", "status", "expired"]);
  assert.deepEqual(harness.calls[2], ["lt", "updated_at", "2026-07-31T12:00:00.000Z"]);
});

test("a smaller legacy retention argument cannot shorten the 30-day recovery window", async () => {
  const harness = maintenanceHarness([{ id: 1, status: "expired", updated_at: "2026-08-10" }]);
  const result = await harness.deleteStaleJobs(1);
  assert.equal(result.totalJobsDeleted, 0);
  assert.equal(harness.rows.length, 1);
});

test("an active job reactivated just before deletion remains protected by the DELETE predicate", async () => {
  const harness = maintenanceHarness([{ id: 1, status: "expired", updated_at: "2020-01-01" }], {
    beforeDelete(rows) { rows[0].status = "active"; }
  });
  assert.equal((await harness.deleteStaleJobs()).totalJobsDeleted, 0);
  assert.equal(harness.rows.length, 1);
});

test("database failure or missing config never reports a successful deletion", async () => {
  const harness = maintenanceHarness([{ id: 1, status: "expired", updated_at: "2020-01-01" }], { error: "offline" });
  const result = await harness.deleteStaleJobs();
  assert.equal(result.errors.length, 1);
  assert.equal(result.totalJobsDeleted ?? 0, 0);
  assert.equal(harness.rows.length, 1);
  const missing = maintenanceHarness([], { unconfigured: true });
  assert.equal((await missing.deleteStaleJobs()).errors.length, 1);
  assert.equal(missing.calls.length, 0);
});

test("duplicate expiration records its real transition time without refreshing the source", async () => {
  let update;
  const query = {
    select() { return query; }, eq() { return query; }, not() { return query; },
    async limit() { return { data: [{ id: 1 }, { id: 2 }], error: null }; },
    update(value) { update = value; return query; },
    async in() { return { error: null }; }
  };
  const maintenance = loadTs("lib/jobs/maintenance.ts", {
    "@/lib/supabase/admin": { createSupabaseAdminClient: () => ({ from: () => query }) },
    "@/lib/jobs/dedupe": { getJobDuplicateKey: () => "duplicate", isPreferredDuplicateCandidate: () => false }
  }, { Date: fixedDate() });
  assert.equal((await maintenance.expireDuplicateJobs()).totalJobsExpired, 1);
  assert.equal(update.status, "expired");
  assert.equal(update.updated_at, new Date(fixedNow).toISOString());
  assert.deepEqual(Object.keys(update).sort(), ["status", "updated_at"]);
});

function emptyResult(source) {
  return { errors: [], sourceResults: [{ source, totalJobsFetched: 0, totalJobsInserted: 0, totalJobsUpdated: 0, totalRequests: 1 }], totalCompaniesChecked: 0, totalJobsDeleted: 0, totalJobsExpired: 0, totalJobsInserted: 0, totalJobsUpdated: 0 };
}

function plannerHarness({ consumeBudget = false, failProvider = false } = {}) {
  let clock = fixedNow;
  const called = [];
  const complete = async (source) => {
    called.push(source);
    if (consumeBudget) clock += 60_000;
    if (failProvider) throw new Error("simulated provider outage");
    return emptyResult(source);
  };
  const mocks = {
    "@/lib/env": { env: new Proxy({}, { get: () => "" }) },
    "@/lib/jobs/source-rotation": rotation,
    "@/lib/jobs/adzuna": { getConfiguredAdzunaCountries: () => ["us", "gb", "es"], syncAdzunaJobs: ({ country }) => complete(`adzuna-${country}`) },
    "@/lib/jobs/jooble": { syncJoobleUaeJobs: () => complete("jooble-ae"), syncJoobleAustraliaJobs: () => complete("jooble-au") },
    "@/lib/jobs/ashby": { syncAshbyJobs: () => complete("ashby") },
    "@/lib/jobs/lever": { syncLeverJobs: () => complete("lever") },
    "@/lib/jobs/greenhouse": { syncGreenhouseJobs: async () => { const value = await complete("greenhouse"); return { ...value, sourceResult: value.sourceResults[0] }; } },
    "@/lib/jobs/existing-link-validation": { revalidateExistingJobLinks: async () => emptyResult("link-validation") },
    "@/lib/jobs/maintenance": { JOB_RETENTION_DAYS: 30, deleteStaleJobs: async (days) => { assert.equal(days, 30); return emptyResult("maintenance"); }, expireDuplicateJobs: async () => emptyResult("maintenance") }
  };
  return { ...loadTs("lib/jobs/daily-fresh-sync.ts", mocks, { Date: fixedDate(() => clock) }), called };
}

test("every provider including Spain gets first priority during a tight-budget rotation", async () => {
  const firstProviders = new Set();
  for (let day = 0; day < 8; day += 1) {
    const planner = plannerHarness({ consumeBudget: true });
    const now = new Date(fixedNow + day * 86_400_000);
    const plan = planner.buildDailyFreshJobPlan(now);
    const result = await planner.syncDailyFreshJobs(now);
    assert.deepEqual(planner.called, [plan.sourceOrder[0]]);
    assert.equal(result.errors.length, 0);
    assert.equal(result.sourceResults.filter((item) => item.totalSkipped === 1).length, 8);
    firstProviders.add(planner.called[0]);
  }
  assert.equal(firstProviders.size, 8);
  assert(firstProviders.has("adzuna-es"));
});

test("source errors remain visible while safe cleanup continues without fabricated job updates", async () => {
  const planner = plannerHarness({ failProvider: true });
  const result = await planner.syncDailyFreshJobs(new Date(fixedNow));
  assert.equal(planner.called.length, 8);
  assert.equal(result.errors.length, 8);
  assert.equal(result.totalJobsUpdated, 0);
  assert.equal(result.totalJobsDeleted, 0);
  assert(result.sourceResults[0].skippedReason.includes("only expired jobs"));
});
