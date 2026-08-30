const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const ts = require("typescript");

const root = path.resolve(__dirname, "..");

// Compile the actual pure TypeScript modules in memory. External services are
// explicitly mocked so these checks never read credentials or touch a database.
function loadTypeScript(relativePath, mocks = {}) {
  const filename = path.join(root, relativePath);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      jsx: ts.JsxEmit.ReactJSX,
      esModuleInterop: true
    },
    fileName: filename
  }).outputText;
  const exports = {};
  const localRequire = (name) => {
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name === "react/jsx-runtime") return require(name);
    throw new Error(`Unexpected dependency in isolated test: ${name}`);
  };
  new Function("exports", "require", compiled)(exports, localRequire);
  return exports;
}

const countries = loadTypeScript("lib/jobs/countries.ts");
const markets = loadTypeScript("lib/jobs/adzuna-markets.ts");

test("Spain is selectable and has a canonical country page", () => {
  const spain = countries.getJobCountryBySlug("spain");
  assert.equal(spain.code, "ES");
  assert.equal(spain.path, "/jobs/country/spain");
  assert.equal(countries.getJobCountryByCode("es"), spain);
  assert.equal(countries.jobCountries.filter((country) => country.code === "ES").length, 1);
  assert.equal(countries.getJobCountryBySlug("unsupported"), null);
});

test("Spain matches native country names and city spellings without substring matches", () => {
  for (const location of ["Spain", "España", "Espana", "Madrid", "Barcelona", "Valencia", "Seville", "Sevilla", "Málaga", "Malaga", "Bilbao", "Zaragoza", "Alicante"]) {
    const matches = countries.getJobLocationCountries(location);
    assert.equal(matches.filter((country) => country.code === "ES").length, 1, location);
  }
  for (const location of ["Spanish-speaking", "London", "Mexico", "Madridista"]) {
    assert.equal(countries.getJobLocationCountries(location).some((country) => country.code === "ES"), false, location);
  }
  const filter = countries.getCountryLocationFilter(countries.getJobCountryBySlug("spain"));
  assert.match(filter, /location\.ilike\.%España%/);
  assert.match(filter, /location\.ilike\.%Sevilla%/);
  assert.doesNotMatch(filter, /location\.ilike\.%ES%/);
});

test("Spain structured locations preserve accented and native city names", () => {
  const [country] = countries.getJobLocationCountries("Málaga, España");
  assert.equal(country.code, "ES");
  assert.deepEqual(countries.getJobLocationLocalities("Malaga, España", country, 1), ["Málaga"]);
  assert.deepEqual(countries.getJobLocationLocalities("Sevilla, España", country, 1), ["Sevilla"]);
});

function countryPreference({ search, saved, headers = {} }) {
  const preference = loadTypeScript("lib/jobs/country-preference.ts", {
    "server-only": {},
    "@/lib/jobs/countries": countries,
    "next/headers": {
      cookies: async () => ({ get: () => saved ? { value: saved } : undefined }),
      headers: async () => ({ get: (name) => headers[name] ?? null })
    }
  });
  return preference.resolveJobCountryPreference(search);
}

test("manual, saved and ES-geolocated job preferences resolve to Spain", async () => {
  const manual = await countryPreference({ search: { country: "spain" }, saved: "canada" });
  assert.equal(manual.slug, "spain");
  assert.equal(manual.source, "manual");
  const saved = await countryPreference({ saved: "spain", headers: { "x-vercel-ip-country": "US" } });
  assert.equal(saved.slug, "spain");
  assert.equal(saved.source, "saved");
  for (const header of ["x-vercel-ip-country", "cf-ipcountry", "x-country-code"]) {
    const detected = await countryPreference({ headers: { [header]: "ES" } });
    assert.equal(detected.slug, "spain");
    assert.equal(detected.source, "detected");
  }
});

test("all-countries choice and crawler-neutral defaults are preserved", async () => {
  const manual = await countryPreference({ search: { country: "all" }, saved: "spain" });
  assert.equal(manual.slug, "all");
  const saved = await countryPreference({ saved: "all", headers: { "x-vercel-ip-country": "ES" } });
  assert.equal(saved.slug, "all");
  const crawler = await countryPreference({ headers: { "x-vercel-ip-country": "ES", "user-agent": "Googlebot" } });
  assert.equal(crawler.slug, "all");
  assert.equal(crawler.source, "default");
});

test("Adzuna defaults include Spain while explicit market allowlists are respected", () => {
  assert.deepEqual(markets.resolveAdzunaCountries("", "us"), ["au", "es", "us"]);
  assert.deepEqual(markets.resolveAdzunaCountries("us,au", "us"), ["au", "us"]);
  assert.deepEqual(markets.resolveAdzunaCountries("us,au,ES,es,invalid", "us"), ["au", "es", "us"]);
  assert.equal(markets.normalizeAdzunaCountry(" ES "), "es");
});

test("Spain discovery uses bilingual role searches without extra requests", () => {
  const queries = ["software engineer", "data analyst", "customer success", "designer", "custom query"];
  const spanish = markets.getAdzunaMarketQueries(queries, "es");
  assert.deepEqual(spanish, ["desarrollador software", "data analyst", "atención al cliente", "designer", "custom query"]);
  assert.equal(spanish.length, queries.length);
  assert.deepEqual(markets.getAdzunaMarketQueries(queries, "us"), queries);
});

test("Adzuna source country is retained for Spain-only city and remote listings", () => {
  assert.equal(markets.qualifyAdzunaLocation("Madrid", "es"), "Madrid, Spain");
  assert.equal(markets.qualifyAdzunaLocation("Remote", "es"), "Remote, Spain");
  assert.equal(markets.qualifyAdzunaLocation(null, "es"), "Spain");
  assert.equal(markets.qualifyAdzunaLocation("Madrid, España", "es"), "Madrid, España");
  assert.equal(markets.qualifyAdzunaLocation("Sydney", "au"), "Sydney, Australia");
  assert.equal(markets.qualifyAdzunaLocation("New York", "us"), "New York");
});

test("the Spain country page has a stable route, canonical and honest metadata", async () => {
  let jobs = [];
  const page = loadTypeScript("app/jobs/country/[country]/page.tsx", {
    "next/link": () => null,
    "next/navigation": { notFound: () => { throw new Error("not found"); } },
    "lucide-react": {},
    "@/components/jobs/job-card": {},
    "@/components/seo/json-ld": {},
    "@/components/ui/button": {},
    "@/components/ui/empty-state": {},
    "@/lib/jobs/countries": countries,
    "@/lib/jobs/queries": { getCountryJobs: async () => ({ configured: true, jobs }) },
    "@/lib/jobs/seo": {},
    "@/lib/seo": { defaultOgImagePath: "/og.png", absoluteUrl: (pathname) => `https://www.hirevate.com${pathname}` }
  });
  assert.ok(page.generateStaticParams().some((params) => params.country === "spain"));
  const metadata = await page.generateMetadata({ params: Promise.resolve({ country: "spain" }) });
  assert.equal(metadata.alternates.canonical, "/jobs/country/spain");
  assert.match(metadata.title.absolute, /Jobs in Spain/);
  assert.doesNotMatch(metadata.title.absolute, /daily/i);
  assert.doesNotMatch(metadata.description, /daily/i);
  assert.deepEqual(metadata.robots, { index: false, follow: true });
  jobs = [{ id: "actual-source-listing" }];
  const populatedMetadata = await page.generateMetadata({ params: Promise.resolve({ country: "spain" }) });
  assert.deepEqual(populatedMetadata.robots, { index: true, follow: true });
});
