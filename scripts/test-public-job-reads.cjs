/* Regression tests for actual TypeScript modules, with local-only data/cache mocks. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");
const root = path.resolve(__dirname, "..");

function loadTs(file, mocks, options = {}) {
  const filename = path.join(root, file);
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(output, {
    module: loaded,
    exports: loaded.exports,
    require(specifier) {
      assert(Object.hasOwn(mocks, specifier), `Unexpected import ${specifier} from ${file}`);
      return mocks[specifier];
    },
    process: { env: { VERCEL_ENV: options.environment ?? "production" } },
    console: { error: (...args) => options.logs?.push(args) }
    // No network, real database client or environment secrets are exposed.
  }, { filename });
  return loaded.exports;
}

const seo = loadTs("lib/jobs/seo.ts", {
  "@/lib/jobs/compensation": {}, "@/lib/jobs/countries": {},
  "@/lib/jobs/sources": {}, "@/lib/jobs/student-part-time": {},
  "@/lib/seo": { siteName: "Hirevate", absoluteUrl: (url) => `https://www.hirevate.com${url}` }
});
const validators = loadTs("lib/validators/jobs.ts", { zod: require("zod") });
const country = { slug: "spain", name: "Spain", path: "/jobs/country/spain" };
const jobId = (index) => `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`;
const makeJob = (index, overrides = {}) => ({
  id: jobId(index), title: "Software Engineer", location: "Madrid, Spain",
  companies: { name: "Example Company" }, status: "active",
  updated_at: "2026-08-01T12:00:00.000Z", discovered_at: "2026-07-01T12:00:00.000Z",
  last_seen_at: "2026-08-30T12:00:00.000Z", apply_url: "https://example.test/apply",
  ...overrides
});

function createCache() {
  const definitions = [];
  const values = new Map();
  return {
    definitions, values,
    unstable_cache(callback, keys, options) {
      definitions.push({ keys: Array.from(keys), options });
      return async (...args) => {
        const key = JSON.stringify([keys, args]);
        if (values.has(key)) return values.get(key);
        const value = await callback(...args);
        values.set(key, value); // Rejections are deliberately never cached.
        return value;
      };
    }
  };
}

function queryHarness(responder = () => ({ data: [], error: null, count: 0 }), options = {}) {
  const calls = [];
  const logs = [];
  const cache = options.cache ?? createCache();
  const client = {
    from(table) {
      const request = { table, steps: [] };
      const query = {};
      for (const method of ["select", "eq", "ilike", "in", "or", "not", "gte", "order", "range", "limit", "maybeSingle"]) {
        query[method] = (...args) => { request.steps.push([method, ...args]); return query; };
      }
      query.then = (resolve, reject) => Promise.resolve().then(() => {
        calls.push(request);
        return responder(request);
      }).then(resolve, reject);
      return query;
    }
  };
  const queries = loadTs("lib/jobs/queries.ts", {
    "next/cache": cache,
    "@/lib/validators/jobs": validators,
    "@supabase/supabase-js": { createClient: () => client },
    "@/lib/supabase/admin": { createSupabaseAdminClient: () => options.unconfigured ? null : client },
    "@/lib/supabase/server": { createSupabaseServerClient: async () => client },
    "@/lib/env": { env: { supabaseUrl: options.project ?? "https://first.supabase.test", supabaseAnonKey: "test-only" }, hasSupabaseBrowserConfig: () => !options.unconfigured },
    "@/lib/jobs/compensation": { getJobCompensationLabel: () => null },
    "@/lib/jobs/dedupe": { dedupeJobs: (jobs) => jobs },
    "@/lib/jobs/countries": { getJobCountryBySlug: (slug) => slug === "all" ? null : { ...country, slug }, getCountryLocationFilter: () => "location.ilike.%Spain%" },
    "@/lib/jobs/seo": seo,
    "@/lib/jobs/student-part-time": { studentCandidateTerms: { student: ["student"], "part-time": ["part time"] }, matchesStudentJobAudience: () => true }
  }, { environment: options.environment, logs });
  return { queries, calls, logs, cache };
}

function step(request, name) { return request.steps.find(([method]) => method === name); }

const errorReads = [
  ["search", (q) => q.getJobs({})],
  ["company filtering", (q) => q.getJobs({ company: "Example" })],
  ["detail", (q) => q.getJobById(jobId(1))],
  ["slug index", (q) => q.getJobBySlugOrId(seo.getJobSlug(makeJob(1)))],
  ["featured", (q) => q.getFeaturedJobs()],
  ["active count", (q) => q.getActiveJobsCount()],
  ["salary", (q) => q.getSalaryFeaturedJobs()],
  ["sitemap", (q) => q.getSitemapJobs()],
  ["remote", (q) => q.getRemoteJobs()],
  ["location", (q) => q.getLocationJobs("Madrid")],
  ["country", (q) => q.getCountryJobs(country)],
  ["engineering", (q) => q.getEngineeringJobs()],
  ["keyword", (q) => q.getKeywordJobs(["software"])],
  ["student", (q) => q.getStudentPartTimeJobs("student", "us")]
];

for (const [name, read] of errorReads) {
  test(`${name}: a database failure rejects instead of becoming cached empty/404 data`, async () => {
    const harness = queryHarness(() => ({ data: null, count: null, error: { code: "PGRST205", message: "private backend context" } }));
    await assert.rejects(read(harness.queries), /temporarily unavailable/);
    await assert.rejects(read(harness.queries), /temporarily unavailable/);
    assert.equal(harness.calls.length, 2);
    assert.equal(harness.cache.values.size, 0);
    assert(!JSON.stringify(harness.logs).includes("private backend context"));
  });
}

test("a successful no-row result still returns null for a genuine missing job", async () => {
  const harness = queryHarness(() => ({ data: null, error: null }));
  assert.equal(await harness.queries.getJobById(jobId(1)), null);
  assert.equal(await harness.queries.getJobById(jobId(1)), null);
  assert.equal(harness.calls.length, 1);
});

test("genuine empty search/country data remains a successful empty result", async () => {
  const harness = queryHarness();
  const search = await harness.queries.getJobs({});
  assert.equal(search.jobs.length, 0);
  assert.equal(search.totalCount, 0);
  assert.equal(search.configured, true);
  assert.equal((await harness.queries.getCountryJobs(country)).jobs.length, 0);
});

test("a recovered database can succeed immediately after a rejected read", async () => {
  let fail = true;
  const row = makeJob(1);
  const harness = queryHarness(() => fail ? { data: null, error: { code: "503" } } : { data: row, error: null });
  await assert.rejects(harness.queries.getJobById(row.id), /temporarily unavailable/);
  fail = false;
  assert.equal((await harness.queries.getJobById(row.id)).id, row.id);
});

test("a failed second sitemap batch rejects rather than publishing the first 1000 rows", async () => {
  const harness = queryHarness((request) => step(request, "range")[1] === 0
    ? { data: Array.from({ length: 1000 }, (_, index) => makeJob(index)), error: null }
    : { data: null, error: { code: "503" } });
  await assert.rejects(harness.queries.getSitemapJobs(), /temporarily unavailable/);
  assert.equal(harness.calls.length, 2);
  assert.equal(harness.cache.values.size, 0);
});

test("legacy title and accented URLs resolve IDs beyond the first 1000 rows", async () => {
  const target = makeJob(1001, { title: "Diseñador sénior de producto", location: "Málaga, España" });
  const ids = Array.from({ length: 1002 }, (_, index) => ({ id: jobId(index) }));
  const harness = queryHarness((request) => {
    if (step(request, "select")[1] === "id") {
      const [, start, end] = step(request, "range");
      return { data: ids.slice(start, end + 1), error: null };
    }
    return { data: target, error: null };
  });
  const oldSlug = seo.getJobSlug({ ...target, title: "Senior Software Engineer" });
  assert.equal((await harness.queries.getJobBySlugOrId(oldSlug)).id, target.id);
  assert.equal((await harness.queries.getJobBySlugOrId(`dise%C3%B1ador-s%C3%A9nior-${seo.getJobIdToken(target.id)}`)).id, target.id);
  assert.equal(harness.calls.filter((request) => step(request, "select")[1] === "id").length, 2);
  assert.equal(harness.calls.filter((request) => step(request, "maybeSingle")).length, 1);
  assert(harness.calls.every((request) => !step(request, "ilike")));
});

test("failed second ID-index batch is not accepted as proof that a legacy URL is missing", async () => {
  const harness = queryHarness((request) => step(request, "range")[1] === 0
    ? { data: Array.from({ length: 1000 }, (_, index) => ({ id: jobId(index) })), error: null }
    : { data: null, error: { code: "503" } });
  await assert.rejects(harness.queries.getJobBySlugOrId(seo.getJobSlug(makeJob(1001))), /temporarily unavailable/);
  assert.equal(harness.cache.values.size, 0);
});

test("malformed URI and malformed slug safely return null without querying", async () => {
  const harness = queryHarness();
  for (const value of ["%E0%A4%A", "%", "not-a-slug"]) {
    assert.equal(await harness.queries.getJobBySlugOrId(value), null);
  }
  assert.equal(harness.calls.length, 0);
});

test("legacy UUID URLs bypass the full ID index and normalize uppercase", async () => {
  const row = makeJob(1001);
  const harness = queryHarness(() => ({ data: row, error: null }));
  assert.equal((await harness.queries.getJobBySlugOrId(row.id.toUpperCase())).id, row.id);
  assert.equal(harness.calls.length, 1);
  assert(step(harness.calls[0], "maybeSingle"));
  assert(harness.calls[0].steps.some(([name, column, value]) => name === "eq" && column === "id" && value === row.id));
});

test("real token collisions require the exact canonical slug, never an arbitrary match", async () => {
  const tokens = new Map();
  let collision;
  for (let index = 0; index < 250_000; index += 1) {
    const id = jobId(index);
    const token = seo.getJobIdToken(id);
    if (tokens.has(token)) { collision = [tokens.get(token), id]; break; }
    tokens.set(token, id);
  }
  assert(collision, "Fixture search must find a collision in the unchanged six-character token algorithm");
  const rows = collision.map((id, index) => makeJob(index, { id, title: `Distinct title ${index}` }));
  const harness = queryHarness((request) => {
    if (step(request, "select")[1] === "id") return { data: rows.map(({ id }) => ({ id })), error: null };
    const filter = request.steps.find(([name, column]) => name === "eq" && column === "id");
    return { data: rows.find(({ id }) => id === filter[2]), error: null };
  });
  assert.equal((await harness.queries.getJobBySlugOrId(seo.getJobSlug(rows[1]))).id, rows[1].id);
  assert.equal(await harness.queries.getJobBySlugOrId(`obsolete-title-${seo.getJobIdToken(rows[0].id)}`), null);
});

test("every cache key is namespaced by project so migration cannot reuse old project data", async () => {
  const cache = createCache();
  const oldProject = queryHarness(() => ({ data: makeJob(1, { title: "Old project" }), error: null }), { cache, project: "https://old.supabase.test" });
  const newProject = queryHarness(() => ({ data: makeJob(1, { title: "New project" }), error: null }), { cache, project: "https://new.supabase.test" });
  assert.equal((await oldProject.queries.getJobById(jobId(1))).title, "Old project");
  assert.equal((await newProject.queries.getJobById(jobId(1))).title, "New project");
  assert(cache.definitions.every(({ keys }) => keys[0] === "healthy-public-jobs-v3" && /^https:\/\/(old|new)\.supabase\.test$/.test(keys[1])));
});

test("missing production config rejects, while unconfigured local previews stay explicit", async () => {
  const production = queryHarness(undefined, { unconfigured: true });
  await assert.rejects(production.queries.getJobById(jobId(1)), /temporarily unavailable/);
  const local = queryHarness(undefined, { unconfigured: true, environment: "development" });
  assert.equal((await local.queries.getJobs({})).configured, false);
  assert.equal(production.calls.length + local.calls.length, 0);
});

function sitemapHarness({ spainJobs = [], failure = false } = {}) {
  const job = makeJob(1);
  return loadTs("app/sitemap.ts", {
    "@/lib/content/comparisons": { comparisons: [] },
    "@/lib/content/guides": { guides: [] },
    "@/lib/jobs/queries": {
      getSitemapJobs: async () => [job],
      getCountryJobs: async () => { if (failure) throw new Error("inventory unavailable"); return { configured: true, jobs: spainJobs }; }
    },
    "@/lib/jobs/countries": { getJobCountryBySlug: () => country },
    "@/lib/jobs/seo": seo,
    "@/lib/legal": { legalDocuments: [], legalEffectiveDate: "2026-08-01" },
    "@/lib/seo": { absoluteUrl: (url) => `https://www.hirevate.com${url}`, publicSeoRoutes: [{ path: "/" }, { path: "/jobs" }, { path: "/jobs/country/spain" }] }
  });
}

test("sitemap omits empty Spain hub and uses actual job modification, not last-seen time", async () => {
  const entries = await sitemapHarness().default();
  assert(!entries.some(({ url }) => url.endsWith("/jobs/country/spain")));
  assert.equal(entries.find(({ url }) => url.endsWith("/jobs")).lastModified, undefined);
  const detail = entries.find(({ url }) => url.includes("/jobs/software-engineer"));
  assert.equal(detail.lastModified.toISOString(), "2026-08-01T12:00:00.000Z");
});

test("sitemap includes Spain when populated and rejects inventory failures", async () => {
  const entries = await sitemapHarness({ spainJobs: [makeJob(1)] }).default();
  assert(entries.some(({ url }) => url.endsWith("/jobs/country/spain")));
  await assert.rejects(sitemapHarness({ failure: true }).default(), /inventory unavailable/);
});
