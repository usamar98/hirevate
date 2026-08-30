import { unstable_cache as nextCache } from "next/cache";
import { jobSearchSchema, type JobSearchInput } from "@/lib/validators/jobs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env, hasSupabaseBrowserConfig } from "@/lib/env";
import { getJobCompensationLabel } from "@/lib/jobs/compensation";
import { dedupeJobs } from "@/lib/jobs/dedupe";
import {
  getCountryLocationFilter,
  getJobCountryBySlug,
  type JobCountry
} from "@/lib/jobs/countries";
import { getJobIdToken, getJobSlug, getJobSlugToken, isUuidLike } from "@/lib/jobs/seo";
import {
  matchesStudentJobAudience,
  studentCandidateTerms,
  type StudentJobAudience,
  type StudentJobCountry
} from "@/lib/jobs/student-part-time";
import type { JobWithCompany, SavedJobWithJob } from "@/types/database";
import type { Database } from "@/types/database";

type RawSearchParams = Record<string, string | string[] | undefined> | undefined;
type PublicJobsReadClient = SupabaseClient<Database>;

const jobListWithCompanySelect =
  "id, company_id, external_id, title, location, remote_type, source, source_url, apply_url, posted_at, discovered_at, updated_at, last_seen_at, freshness_score, status, companies:company_id!inner(id, name, greenhouse_slug, prominence_rank, website)";
const featuredJobWithCompanySelect =
  "id, company_id, external_id, title, description, location, remote_type, source, source_url, apply_url, posted_at, discovered_at, updated_at, last_seen_at, freshness_score, status, raw_data, companies:company_id!inner(id, name, greenhouse_slug, prominence_rank, website)";
const jobDetailWithCompanySelect = "*, companies:company_id!inner(id, name, greenhouse_slug, prominence_rank, website)";
export const PUBLIC_JOBS_PAGE_SIZE = 10;
export const PAID_JOBS_PAGE_SIZE = 50;
const CATEGORY_JOB_FETCH_LIMIT = 11;
const JOB_ID_BATCH_SIZE = 1000;
const PUBLIC_JOBS_CACHE_REVALIDATE_SECONDS = 30 * 60;
const SITEMAP_FRESH_DAYS = 30;
// Leave room for static, legal, guide, comparison and future sitemap entries so
// the generated file never crosses the protocol's 50,000-URL ceiling.
const SITEMAP_JOBS_LIMIT = 48_000;
const SITEMAP_JOBS_BATCH_SIZE = 1_000;
const STUDENT_JOB_CANDIDATE_LIMIT = 240;

// A migrated database must not reuse successful (or formerly poisoned) results
// from the previous project. Failures must reject, never become cached emptiness.
const unstable_cache: typeof nextCache = (callback, keyParts, options) =>
  nextCache(callback, ["healthy-public-jobs-v3", env.supabaseUrl, ...(keyParts ?? [])], options);

function publicJobsReadFailed(operation: string, error: { code?: string }): never {
  console.error("Public jobs read failed", { operation, code: error.code ?? "unknown" });
  throw new Error("Job data is temporarily unavailable. Please try again shortly.");
}

function createAnonPublicJobsClient() {
  if (!hasSupabaseBrowserConfig()) return null;

  return createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

function readParam(searchParams: RawSearchParams, key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseJobSearchParams(searchParams: RawSearchParams): JobSearchInput {
  const remote = readParam(searchParams, "remote");

  return jobSearchSchema.parse({
    keyword: readParam(searchParams, "keyword") ?? "",
    company: readParam(searchParams, "company") ?? "",
    location: readParam(searchParams, "location") ?? "",
    country: readParam(searchParams, "country") ?? "all",
    workMode: readParam(searchParams, "workMode") ?? (remote ? "remote" : "any"),
    postedWithin: readParam(searchParams, "postedWithin") ?? "all",
    remote,
    freshness: readParam(searchParams, "freshness") ?? "all",
    sort: readParam(searchParams, "sort") ?? "newest",
    page: readParam(searchParams, "page")
  });
}

function normalizeSearchParams(searchParams: RawSearchParams) {
  const normalized: Record<string, string> = {};

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    const firstValue = Array.isArray(value) ? value[0] : value;
    if (firstValue) normalized[key] = firstValue;
  }

  return Object.fromEntries(Object.entries(normalized).sort(([left], [right]) => left.localeCompare(right)));
}

function serializeSearchParams(searchParams: RawSearchParams) {
  return JSON.stringify(normalizeSearchParams(searchParams));
}

function getPostedWithinStart(value: JobSearchInput["postedWithin"]) {
  const daysByValue: Record<Exclude<JobSearchInput["postedWithin"], "all">, number> = {
    "24h": 1,
    "7d": 7,
    "14d": 14,
    "30d": 30
  };
  const days = value === "all" ? null : daysByValue[value];

  if (!days) return null;

  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function createPublicJobsReadClient(): PublicJobsReadClient | null {
  const admin = createSupabaseAdminClient();

  if (admin) {
    return admin;
  }

  const anon = createAnonPublicJobsClient();
  if (!anon && process.env.VERCEL_ENV === "production") {
    publicJobsReadFailed("configuration", { code: "missing_supabase_config" });
  }
  return anon;
}

async function getJobsUncached(searchParams: RawSearchParams, pageSize = PUBLIC_JOBS_PAGE_SIZE) {
  const filters = parseJobSearchParams(searchParams);
  const supabase = createPublicJobsReadClient();
  const page = filters.page;
  const rangeStart = (page - 1) * pageSize;
  const rangeEnd = rangeStart + pageSize - 1;

  if (!supabase) {
    return {
      jobs: [] as JobWithCompany[],
      filters,
      configured: false,
      page,
      pageSize,
      totalCount: 0,
      totalPages: 0
    };
  }

  let matchingCompanyIds: string[] | null = null;

  if (filters.company) {
    const { data: companies, error: companiesError } = await supabase
      .from("companies")
      .select("id")
      .ilike("name", `%${filters.company}%`)
      .limit(1000);

    if (companiesError) {
      publicJobsReadFailed("company filter", companiesError);
    }

    matchingCompanyIds = (companies ?? []).map((company) => company.id);

    if (matchingCompanyIds.length === 0) {
      return {
        jobs: [] as JobWithCompany[],
        filters,
        configured: true,
        page,
        pageSize,
        totalCount: 0,
        totalPages: 0
      };
    }
  }

  let query = supabase
    .from("jobs")
    .select(jobListWithCompanySelect, { count: "exact" })
    .eq("status", "active")
    .range(rangeStart, rangeEnd);

  if (filters.keyword) {
    query = query.ilike("title", `%${filters.keyword}%`);
  }

  if (filters.location) {
    query = query.ilike("location", `%${filters.location}%`);
  }

  const selectedCountry = getJobCountryBySlug(filters.country);
  if (selectedCountry) {
    query = query.or(getCountryLocationFilter(selectedCountry));
  }

  if (matchingCompanyIds) {
    query = query.in("company_id", matchingCompanyIds);
  }

  if (filters.workMode !== "any") {
    query = query.eq("remote_type", filters.workMode);
  }

  const postedWithinStart = getPostedWithinStart(filters.postedWithin);

  if (postedWithinStart) {
    query = query.gte("last_seen_at", postedWithinStart);
  }

  if (filters.freshness === "fresh") {
    query = query.gte("freshness_score", 90);
  }

  if (filters.freshness === "good") {
    query = query.gte("freshness_score", 70);
  }

  if (filters.sort === "freshness") {
    query = query
      .order("freshness_score", { ascending: false })
      .order("last_seen_at", { ascending: false, nullsFirst: false })
      .order("discovered_at", { ascending: false });
  } else if (filters.sort === "updated") {
    query = query
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("last_seen_at", { ascending: false, nullsFirst: false })
      .order("discovered_at", { ascending: false });
  } else {
    if (selectedCountry) {
      query = query.order("companies(prominence_rank)", {
        ascending: true,
        nullsFirst: false
      });
    }
    query = query
      .order("last_seen_at", { ascending: false, nullsFirst: false })
      .order("discovered_at", { ascending: false });
  }

  const { count, data, error } = await query;
  if (error) {
    publicJobsReadFailed("job search", error);
  }

  const totalCount = count ?? 0;

  return {
    jobs: dedupeJobs((data ?? []) as JobWithCompany[]),
    filters,
    configured: true,
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize)
  };
}

const getCachedJobs = unstable_cache(
  async (serializedSearchParams: string, pageSize: number) =>
    getJobsUncached(JSON.parse(serializedSearchParams) as Record<string, string>, pageSize),
  ["public-jobs-search-v2"],
  {
    revalidate: PUBLIC_JOBS_CACHE_REVALIDATE_SECONDS,
    tags: ["public-jobs"]
  }
);

export async function getJobs(searchParams: RawSearchParams, options?: { pageSize?: number }) {
  return getCachedJobs(serializeSearchParams(searchParams), options?.pageSize ?? PUBLIC_JOBS_PAGE_SIZE);
}

async function getJobByIdUncached(id: string) {
  const supabase = createPublicJobsReadClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("jobs")
    .select(jobDetailWithCompanySelect)
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    publicJobsReadFailed("job detail", error);
  }

  return data as JobWithCompany | null;
}

const getCachedJobById = unstable_cache(async (id: string) => getJobByIdUncached(id), ["public-job-by-id"], {
  revalidate: PUBLIC_JOBS_CACHE_REVALIDATE_SECONDS,
  tags: ["public-jobs"]
});

export async function getJobById(id: string) {
  return getCachedJobById(id);
}

// Resolve legacy URL tokens from a shared compact ID index, not a capped title
// search. This also preserves URLs when a source edits the title or its accents.
// Only IDs are transferred, once per cache window, instead of full job rows for
// every URL. Job details are still individually cached and checked as active.
const getCachedActiveJobIds = unstable_cache(async () => {
  const supabase = createPublicJobsReadClient();
  if (!supabase) return [] as { id: string }[];
  const ids: { id: string }[] = [];
  for (let offset = 0; ; offset += JOB_ID_BATCH_SIZE) {
    const { data, error } = await supabase.from("jobs").select("id")
      .eq("status", "active").order("id", { ascending: true })
      .range(offset, offset + JOB_ID_BATCH_SIZE - 1);
    if (error) publicJobsReadFailed("job URL index", error);
    const batch = data ?? [];
    ids.push(...batch);
    if (batch.length < JOB_ID_BATCH_SIZE) return ids;
  }
}, ["public-active-job-ids"], {
  revalidate: PUBLIC_JOBS_CACHE_REVALIDATE_SECONDS,
  tags: ["public-jobs"]
});

async function getJobBySlugOrIdUncached(slugOrId: string) {
  let decodedSlug: string;
  try {
    decodedSlug = decodeURIComponent(slugOrId).toLowerCase();
  } catch {
    return null;
  }

  if (isUuidLike(decodedSlug)) {
    return getJobById(decodedSlug);
  }

  const token = getJobSlugToken(decodedSlug);
  if (!token) return null;
  const matches = (await getCachedActiveJobIds()).filter((job) => getJobIdToken(job.id) === token);
  const jobs = (await Promise.all(matches.map((job) => getJobById(job.id))))
    .filter((job): job is JobWithCompany => Boolean(job));
  // Resolve rare token collisions by the full canonical slug, never arbitrarily.
  return jobs.find((job) => getJobSlug(job) === decodedSlug) ?? (jobs.length === 1 ? jobs[0] : null);
}

const getCachedJobBySlugOrId = unstable_cache(
  async (slugOrId: string) => getJobBySlugOrIdUncached(slugOrId),
  ["public-job-by-slug-or-id-v2"],
  {
    revalidate: PUBLIC_JOBS_CACHE_REVALIDATE_SECONDS,
    tags: ["public-jobs"]
  }
);

export async function getJobBySlugOrId(slugOrId: string) {
  return getCachedJobBySlugOrId(slugOrId);
}

async function getFeaturedJobsUncached(limit = 3) {
  const supabase = createPublicJobsReadClient();
  if (!supabase) return [] as JobWithCompany[];

  const { data, error } = await supabase
    .from("jobs")
    .select(jobListWithCompanySelect)
    .eq("status", "active")
    .order("freshness_score", { ascending: false })
    .order("last_seen_at", { ascending: false, nullsFirst: false })
    .order("discovered_at", { ascending: false })
    .limit(limit);

  if (error) {
    publicJobsReadFailed("featured jobs", error);
  }

  return dedupeJobs((data ?? []) as JobWithCompany[]);
}

const getCachedFeaturedJobs = unstable_cache(
  async (limit: number) => getFeaturedJobsUncached(limit),
  ["public-featured-jobs"],
  {
    revalidate: PUBLIC_JOBS_CACHE_REVALIDATE_SECONDS,
    tags: ["public-jobs"]
  }
);

export async function getFeaturedJobs(limit = 3) {
  return getCachedFeaturedJobs(limit);
}

async function getActiveJobsCountUncached() {
  const supabase = createPublicJobsReadClient();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  if (error) {
    publicJobsReadFailed("active count", error);
  }

  return count ?? 0;
}

const getCachedActiveJobsCount = unstable_cache(
  async () => getActiveJobsCountUncached(),
  ["public-active-jobs-count"],
  {
    revalidate: PUBLIC_JOBS_CACHE_REVALIDATE_SECONDS,
    tags: ["public-jobs"]
  }
);

export async function getActiveJobsCount() {
  return getCachedActiveJobsCount();
}

async function getSalaryFeaturedJobsUncached(limit = 3) {
  const supabase = createPublicJobsReadClient();
  if (!supabase) return [] as JobWithCompany[];

  const candidateLimit = Math.min(Math.max(limit * 4, 24), 60);

  const { data, error } = await supabase
    .from("jobs")
    .select(featuredJobWithCompanySelect)
    .eq("status", "active")
    .order("freshness_score", { ascending: false })
    .order("last_seen_at", { ascending: false, nullsFirst: false })
    .order("discovered_at", { ascending: false })
    .limit(candidateLimit);

  if (error) {
    publicJobsReadFailed("salary jobs", error);
  }

  const jobs = dedupeJobs((data ?? []) as JobWithCompany[]);

  return jobs
    .filter((job) => Boolean(getJobCompensationLabel(job)))
    .slice(0, limit);
}

const getCachedSalaryFeaturedJobs = unstable_cache(
  async (limit: number) => getSalaryFeaturedJobsUncached(limit),
  ["public-salary-featured-jobs"],
  {
    revalidate: PUBLIC_JOBS_CACHE_REVALIDATE_SECONDS,
    tags: ["public-jobs"]
  }
);

export async function getSalaryFeaturedJobs(limit = 3) {
  return getCachedSalaryFeaturedJobs(limit);
}

async function getSitemapJobsUncached(limit = SITEMAP_JOBS_LIMIT) {
  const supabase = createPublicJobsReadClient();
  if (!supabase) return [] as JobWithCompany[];
  const safeLimit = Math.min(Math.max(limit, 1), SITEMAP_JOBS_LIMIT);
  const freshCutoff = new Date(
    Date.now() - SITEMAP_FRESH_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  const jobs: JobWithCompany[] = [];

  for (let offset = 0; offset < safeLimit; offset += SITEMAP_JOBS_BATCH_SIZE) {
    const batchSize = Math.min(SITEMAP_JOBS_BATCH_SIZE, safeLimit - offset);
    const { data, error } = await supabase
      .from("jobs")
      .select(jobListWithCompanySelect)
      .eq("status", "active")
      .gte("last_seen_at", freshCutoff)
      .not("apply_url", "is", null)
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("last_seen_at", { ascending: false, nullsFirst: false })
      .order("discovered_at", { ascending: false })
      .order("id", { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (error) {
      publicJobsReadFailed("sitemap jobs", error);
    }

    const batch = (data ?? []) as JobWithCompany[];
    jobs.push(...batch);

    if (batch.length < batchSize) break;
  }

  return dedupeJobs(jobs);
}

const getCachedSitemapJobs = unstable_cache(
  async (limit: number) => getSitemapJobsUncached(limit),
  ["public-sitemap-jobs"],
  {
    revalidate: PUBLIC_JOBS_CACHE_REVALIDATE_SECONDS,
    tags: ["public-jobs"]
  }
);

export async function getSitemapJobs(limit = SITEMAP_JOBS_LIMIT) {
  return getCachedSitemapJobs(limit);
}

async function getRemoteJobsUncached(limit = CATEGORY_JOB_FETCH_LIMIT) {
  const supabase = createPublicJobsReadClient();
  if (!supabase) return { jobs: [] as JobWithCompany[], configured: false };

  const { data, error } = await supabase
    .from("jobs")
    .select(jobListWithCompanySelect)
    .eq("status", "active")
    .eq("remote_type", "remote")
    .order("freshness_score", { ascending: false })
    .order("last_seen_at", { ascending: false, nullsFirst: false })
    .order("discovered_at", { ascending: false })
    .limit(limit);

  if (error) {
    publicJobsReadFailed("remote jobs", error);
  }

  return { jobs: dedupeJobs((data ?? []) as JobWithCompany[]), configured: true };
}

const getCachedRemoteJobs = unstable_cache(
  async (limit: number) => getRemoteJobsUncached(limit),
  ["public-remote-jobs"],
  {
    revalidate: PUBLIC_JOBS_CACHE_REVALIDATE_SECONDS,
    tags: ["public-jobs"]
  }
);

export async function getRemoteJobs(limit = CATEGORY_JOB_FETCH_LIMIT) {
  return getCachedRemoteJobs(limit);
}

async function getLocationJobsUncached(location: string, limit = CATEGORY_JOB_FETCH_LIMIT) {
  const supabase = createPublicJobsReadClient();
  if (!supabase) return { jobs: [] as JobWithCompany[], configured: false };

  const { data, error } = await supabase
    .from("jobs")
    .select(jobListWithCompanySelect)
    .eq("status", "active")
    .ilike("location", `%${location}%`)
    .order("freshness_score", { ascending: false })
    .order("last_seen_at", { ascending: false, nullsFirst: false })
    .order("discovered_at", { ascending: false })
    .limit(limit);

  if (error) {
    publicJobsReadFailed("location jobs", error);
  }

  return { jobs: dedupeJobs((data ?? []) as JobWithCompany[]), configured: true };
}

const getCachedLocationJobs = unstable_cache(
  async (location: string, limit: number) => getLocationJobsUncached(location, limit),
  ["public-location-jobs"],
  {
    revalidate: PUBLIC_JOBS_CACHE_REVALIDATE_SECONDS,
    tags: ["public-jobs"]
  }
);

export async function getLocationJobs(location: string, limit = CATEGORY_JOB_FETCH_LIMIT) {
  return getCachedLocationJobs(location, limit);
}

async function getCountryJobsUncached(country: JobCountry, limit = CATEGORY_JOB_FETCH_LIMIT) {
  const supabase = createPublicJobsReadClient();
  if (!supabase) return { jobs: [] as JobWithCompany[], configured: false };

  const { data, error } = await supabase
    .from("jobs")
    .select(jobListWithCompanySelect)
    .eq("status", "active")
    .or(getCountryLocationFilter(country))
    .order("companies(prominence_rank)", { ascending: true, nullsFirst: false })
    .order("freshness_score", { ascending: false })
    .order("last_seen_at", { ascending: false, nullsFirst: false })
    .order("discovered_at", { ascending: false })
    .limit(limit);

  if (error) {
    publicJobsReadFailed("country jobs", error);
  }

  return { jobs: dedupeJobs((data ?? []) as JobWithCompany[]), configured: true };
}

const getCachedCountryJobs = unstable_cache(
  async (countrySlug: string, limit: number) => {
    const country = getJobCountryBySlug(countrySlug);
    if (!country) return { jobs: [] as JobWithCompany[], configured: true };
    return getCountryJobsUncached(country, limit);
  },
  ["public-country-jobs-v2"],
  {
    revalidate: PUBLIC_JOBS_CACHE_REVALIDATE_SECONDS,
    tags: ["public-jobs"]
  }
);

export async function getCountryJobs(country: JobCountry, limit = CATEGORY_JOB_FETCH_LIMIT) {
  return getCachedCountryJobs(country.slug, limit);
}

export async function getUkJobs(limit = CATEGORY_JOB_FETCH_LIMIT) {
  const country = getJobCountryBySlug("united-kingdom");
  if (!country) return { jobs: [] as JobWithCompany[], configured: true };

  return getCountryJobs(country, limit);
}

async function getEngineeringJobsUncached(limit = CATEGORY_JOB_FETCH_LIMIT) {
  const supabase = createPublicJobsReadClient();
  if (!supabase) return { jobs: [] as JobWithCompany[], configured: false };

  const { data, error } = await supabase
    .from("jobs")
    .select(jobListWithCompanySelect)
    .eq("status", "active")
    .or(
      "title.ilike.%engineer%,title.ilike.%engineering%,title.ilike.%developer%,title.ilike.%software%"
    )
    .order("freshness_score", { ascending: false })
    .order("last_seen_at", { ascending: false, nullsFirst: false })
    .order("discovered_at", { ascending: false })
    .limit(limit);

  if (error) {
    publicJobsReadFailed("engineering jobs", error);
  }

  return { jobs: dedupeJobs((data ?? []) as JobWithCompany[]), configured: true };
}

const getCachedEngineeringJobs = unstable_cache(
  async (limit: number) => getEngineeringJobsUncached(limit),
  ["public-engineering-jobs"],
  {
    revalidate: PUBLIC_JOBS_CACHE_REVALIDATE_SECONDS,
    tags: ["public-jobs"]
  }
);

export async function getEngineeringJobs(limit = CATEGORY_JOB_FETCH_LIMIT) {
  return getCachedEngineeringJobs(limit);
}

async function getKeywordJobsUncached(keywords: string[], limit = CATEGORY_JOB_FETCH_LIMIT) {
  const supabase = createPublicJobsReadClient();
  if (!supabase) return { jobs: [] as JobWithCompany[], configured: false };

  const cleanKeywords = keywords
    .map((keyword) => keyword.trim())
    .filter(Boolean)
    .slice(0, 8);

  if (cleanKeywords.length === 0) return { jobs: [] as JobWithCompany[], configured: true };

  const { data, error } = await supabase
    .from("jobs")
    .select(jobListWithCompanySelect)
    .eq("status", "active")
    .or(cleanKeywords.map((keyword) => `title.ilike.%${keyword}%`).join(","))
    .order("freshness_score", { ascending: false })
    .order("last_seen_at", { ascending: false, nullsFirst: false })
    .order("discovered_at", { ascending: false })
    .limit(limit);

  if (error) {
    publicJobsReadFailed("keyword jobs", error);
  }

  return { jobs: dedupeJobs((data ?? []) as JobWithCompany[]), configured: true };
}

const getCachedKeywordJobs = unstable_cache(
  async (keywordKey: string, limit: number) => getKeywordJobsUncached(keywordKey.split("|"), limit),
  ["public-keyword-jobs"],
  {
    revalidate: PUBLIC_JOBS_CACHE_REVALIDATE_SECONDS,
    tags: ["public-jobs"]
  }
);

export async function getKeywordJobs(keywords: string[], limit = CATEGORY_JOB_FETCH_LIMIT) {
  const keywordKey = keywords.map((keyword) => keyword.trim()).filter(Boolean).join("|");
  return getCachedKeywordJobs(keywordKey, limit);
}

function getStudentJobCountry(country: StudentJobCountry | null): JobCountry | null {
  if (!country) return null;
  return getJobCountryBySlug(country === "us" ? "united-states" : "united-kingdom");
}

async function getStudentPartTimeJobsUncached(
  audience: StudentJobAudience,
  country: StudentJobCountry | null,
  limit = CATEGORY_JOB_FETCH_LIMIT
) {
  const supabase = createPublicJobsReadClient();
  if (!supabase) return { jobs: [] as JobWithCompany[], configured: false };

  const candidateFilter = studentCandidateTerms[audience]
    .flatMap((term) => [
      `title.ilike.%${term}%`,
      `description.ilike.%${term}%`,
      `raw_data->>commitment.ilike.%${term}%`,
      `raw_data->>contract_time.ilike.%${term}%`,
      `raw_data->>contract_type.ilike.%${term}%`,
      `raw_data->>employmentType.ilike.%${term}%`,
      `raw_data->>employment_type.ilike.%${term}%`,
      `raw_data->>jobType.ilike.%${term}%`
    ])
    .join(",");

  let query = supabase
    .from("jobs")
    .select(featuredJobWithCompanySelect)
    .eq("status", "active")
    .or(candidateFilter);

  const selectedCountry = getStudentJobCountry(country);
  if (selectedCountry) query = query.or(getCountryLocationFilter(selectedCountry));
  if (!selectedCountry) {
    const hubCountries = [getStudentJobCountry("us"), getStudentJobCountry("uk")].filter(
      (item): item is JobCountry => Boolean(item)
    );
    query = query.or(hubCountries.map(getCountryLocationFilter).join(","));
  }

  const { data, error } = await query
    .order("freshness_score", { ascending: false })
    .order("last_seen_at", { ascending: false, nullsFirst: false })
    .order("discovered_at", { ascending: false })
    .limit(STUDENT_JOB_CANDIDATE_LIMIT);

  if (error) {
    publicJobsReadFailed("student jobs", error);
  }

  const jobs = dedupeJobs((data ?? []) as JobWithCompany[])
    .filter((job) => matchesStudentJobAudience(job, audience))
    .slice(0, limit);

  return { jobs, configured: true };
}

const getCachedStudentPartTimeJobs = unstable_cache(
  async (audience: StudentJobAudience, country: StudentJobCountry | null, limit: number) =>
    getStudentPartTimeJobsUncached(audience, country, limit),
  ["public-student-part-time-jobs"],
  {
    revalidate: PUBLIC_JOBS_CACHE_REVALIDATE_SECONDS,
    tags: ["public-jobs"]
  }
);

export async function getStudentPartTimeJobs(
  audience: StudentJobAudience,
  country: StudentJobCountry | null = null,
  limit = CATEGORY_JOB_FETCH_LIMIT
) {
  return getCachedStudentPartTimeJobs(audience, country, limit);
}

export async function getSavedJobIds(userId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return new Set<string>();

  const { data, error } = await supabase
    .from("saved_jobs")
    .select("job_id")
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to load saved job ids", error);
    return new Set<string>();
  }

  return new Set((data ?? []).map((item) => item.job_id).filter(Boolean) as string[]);
}

export async function getSavedJobs(userId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [] as SavedJobWithJob[];

  const { data, error } = await supabase
    .from("saved_jobs")
    .select(
      "*, jobs:job_id(id, company_id, external_id, title, location, remote_type, source, source_url, apply_url, posted_at, discovered_at, updated_at, last_seen_at, freshness_score, status, companies:company_id(id, name, greenhouse_slug, prominence_rank, website))"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load saved jobs", error);
    return [] as SavedJobWithJob[];
  }

  return (data ?? []) as SavedJobWithJob[];
}

export async function countSavedJobs(userId: string) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("saved_jobs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to count saved jobs", error);
    return 0;
  }

  return count ?? 0;
}
