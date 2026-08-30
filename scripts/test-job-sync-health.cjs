const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");
const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../lib/jobs/sync-health.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const moduleExports = {};
new Function("exports", compiled)(moduleExports);
const { getJobSyncHealth } = moduleExports;
const provider = (overrides = {}) => ({ source: "ashby", configured: true, totalRequests: 1,
  totalJobsFetched: 0, totalJobsInserted: 0, totalJobsUpdated: 0, ...overrides });
const result = (sourceResults, errors = []) => ({ sourceResults, errors, totalCompaniesChecked: 0,
  totalJobsInserted: 0, totalJobsUpdated: 0 });
test("a successful empty source is healthy", () => {
  assert.equal(getJobSyncHealth(result([provider()])).status, "healthy");
});
test("planner estimates and maintenance never mask a discovery failure", () => {
  const sources = ["freshness-planner", "maintenance", "link-validation"].map((source) => provider({ source, totalJobsUpdated: 100 }));
  sources.push(provider({ configured: false, totalRequests: 0 }));
  assert.deepEqual(getJobSyncHealth(result(sources)), { status: "failed", refreshed: false });
});
test("attempts with provider errors are failed even when rows were fetched", () => {
  assert.equal(getJobSyncHealth(result([provider({ source: "adzuna-es", totalJobsFetched: 100 })],
    [{ source: "adzuna", message: "database unavailable" }])).status, "failed");
});
test("partial updates are explicit and skipped providers prevent all-healthy", () => {
  assert.equal(getJobSyncHealth(result([provider({ totalJobsUpdated: 2 })],
    [{ source: "ashby", message: "one source failed" }])).status, "partial");
  assert.equal(getJobSyncHealth(result([provider(), provider({ source: "lever", totalRequests: 0, skippedReason: "budget" })])).status, "partial");
});
