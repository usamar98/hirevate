import { jobSearchSchema, type JobSearchInput } from "@/lib/validators/jobs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { env, hasSupabaseBrowserConfig } from "@/lib/env";
import { getJobSlug, getJobSlugToken, isUuidLike, jobMatchesSlug } from "@/lib/jobs/seo";
import type { JobWithCompany, SavedJobWithJob } from "@/types/database";
import type { Database } from "@/types/database";

type RawSearchParams = Record<string, string | string[] | undefined> | undefined;
type PublicJobsReadClient = SupabaseClient<Database>;

const jobWithCompanySelect = "*, companies:company_id(id, name, greenhouse_slug, website)";
const JOBS_PAGE_SIZE = 50;

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
    workMode: readParam(searchParams, "workMode") ?? (remote ? "remote" : "any"),
    postedWithin: readParam(searchParams, "postedWithin") ?? "all",
    remote,
    freshness: readParam(searchParams, "freshness") ?? "all",
    sort: readParam(searchParams, "sort") ?? "newest",
    page: readParam(searchParams, "page")
  });
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

  return createAnonPublicJobsClient();
}

export async function getJobs(searchParams: RawSearchParams) {
  const filters = parseJobSearchParams(searchParams);
  const supabase = createPublicJobsReadClient();
  const page = filters.page;
  const pageSize = JOBS_PAGE_SIZE;
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
      console.error("Failed to filter companies", companiesError);
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
    .select(jobWithCompanySelect, { count: "exact" })
    .eq("status", "active")
    .range(rangeStart, rangeEnd);

  if (filters.keyword) {
    query = query.ilike("title", `%${filters.keyword}%`);
  }

  if (filters.location) {
    query = query.ilike("location", `%${filters.location}%`);
  }

  if (matchingCompanyIds) {
    query = query.in("company_id", matchingCompanyIds);
  }

  if (filters.workMode !== "any") {
    query = query.eq("remote_type", filters.workMode);
  }

  const postedWithinStart = getPostedWithinStart(filters.postedWithin);

  if (postedWithinStart) {
    query = query.gte("discovered_at", postedWithinStart);
  }

  if (filters.freshness === "fresh") {
    query = query.gte("freshness_score", 90);
  }

  if (filters.freshness === "good") {
    query = query.gte("freshness_score", 70);
  }

  if (filters.sort === "freshness") {
    query = query.order("freshness_score", { ascending: false }).order("discovered_at", {
      ascending: false
    });
  } else if (filters.sort === "updated") {
    query = query
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("discovered_at", { ascending: false });
  } else {
    query = query.order("discovered_at", { ascending: false });
  }

  const { count, data, error } = await query;
  if (error) {
    console.error("Failed to load jobs", error);
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

  const totalCount = count ?? 0;

  return {
    jobs: (data ?? []) as JobWithCompany[],
    filters,
    configured: true,
    page,
    pageSize,
    totalCount,
    totalPages: Math.ceil(totalCount / pageSize)
  };
}

export async function getJobById(id: string) {
  const supabase = createPublicJobsReadClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("jobs")
    .select(jobWithCompanySelect)
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("Failed to load job detail", error);
    return null;
  }

  return data as JobWithCompany | null;
}

export async function getJobBySlugOrId(slugOrId: string) {
  const decodedSlug = decodeURIComponent(slugOrId).toLowerCase();

  if (isUuidLike(decodedSlug)) {
    return getJobById(decodedSlug);
  }

  const supabase = createPublicJobsReadClient();
  if (!supabase) return null;

  const token = getJobSlugToken(decodedSlug);
  const { data, error } = await supabase
    .from("jobs")
    .select(jobWithCompanySelect)
    .eq("status", "active")
    .order("freshness_score", { ascending: false })
    .order("discovered_at", { ascending: false })
    .limit(3000);

  if (error) {
    console.error("Failed to resolve job slug", error);
    return null;
  }

  const jobs = (data ?? []) as JobWithCompany[];

  return (
    jobs.find((job) => getJobSlug(job) === decodedSlug) ??
    jobs.find((job) => Boolean(token) && jobMatchesSlug(job, decodedSlug)) ??
    null
  );
}

export async function getFeaturedJobs(limit = 3) {
  const supabase = createPublicJobsReadClient();
  if (!supabase) return [] as JobWithCompany[];

  const { data, error } = await supabase
    .from("jobs")
    .select(jobWithCompanySelect)
    .eq("status", "active")
    .order("freshness_score", { ascending: false })
    .order("discovered_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load featured jobs", error);
    return [] as JobWithCompany[];
  }

  return (data ?? []) as JobWithCompany[];
}

export async function getSitemapJobs(limit = 5000) {
  const supabase = createPublicJobsReadClient();
  if (!supabase) return [] as JobWithCompany[];

  const { data, error } = await supabase
    .from("jobs")
    .select(jobWithCompanySelect)
    .eq("status", "active")
    .order("updated_at", { ascending: false, nullsFirst: false })
    .order("discovered_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load sitemap jobs", error);
    return [] as JobWithCompany[];
  }

  return (data ?? []) as JobWithCompany[];
}

export async function getRemoteJobs(limit = 40) {
  const supabase = createPublicJobsReadClient();
  if (!supabase) return { jobs: [] as JobWithCompany[], configured: false };

  const { data, error } = await supabase
    .from("jobs")
    .select(jobWithCompanySelect)
    .eq("status", "active")
    .eq("remote_type", "remote")
    .order("freshness_score", { ascending: false })
    .order("discovered_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load remote jobs", error);
    return { jobs: [] as JobWithCompany[], configured: true };
  }

  return { jobs: (data ?? []) as JobWithCompany[], configured: true };
}

export async function getLocationJobs(location: string, limit = 40) {
  const supabase = createPublicJobsReadClient();
  if (!supabase) return { jobs: [] as JobWithCompany[], configured: false };

  const { data, error } = await supabase
    .from("jobs")
    .select(jobWithCompanySelect)
    .eq("status", "active")
    .ilike("location", `%${location}%`)
    .order("freshness_score", { ascending: false })
    .order("discovered_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load location jobs", error);
    return { jobs: [] as JobWithCompany[], configured: true };
  }

  return { jobs: (data ?? []) as JobWithCompany[], configured: true };
}

export async function getEngineeringJobs(limit = 40) {
  const supabase = createPublicJobsReadClient();
  if (!supabase) return { jobs: [] as JobWithCompany[], configured: false };

  const { data, error } = await supabase
    .from("jobs")
    .select(jobWithCompanySelect)
    .eq("status", "active")
    .or(
      "title.ilike.%engineer%,title.ilike.%engineering%,title.ilike.%developer%,title.ilike.%software%"
    )
    .order("freshness_score", { ascending: false })
    .order("discovered_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to load engineering jobs", error);
    return { jobs: [] as JobWithCompany[], configured: true };
  }

  return { jobs: (data ?? []) as JobWithCompany[], configured: true };
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
      "*, jobs:job_id(*, companies:company_id(id, name, greenhouse_slug, website))"
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
