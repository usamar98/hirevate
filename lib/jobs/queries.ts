import { jobSearchSchema, type JobSearchInput } from "@/lib/validators/jobs";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JobWithCompany, SavedJobWithJob } from "@/types/database";

type RawSearchParams = Record<string, string | string[] | undefined> | undefined;

function readParam(searchParams: RawSearchParams, key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export function parseJobSearchParams(searchParams: RawSearchParams): JobSearchInput {
  return jobSearchSchema.parse({
    keyword: readParam(searchParams, "keyword") ?? "",
    location: readParam(searchParams, "location") ?? "",
    remote: readParam(searchParams, "remote"),
    freshness: readParam(searchParams, "freshness") ?? "all",
    sort: readParam(searchParams, "sort") ?? "newest"
  });
}

async function createPublicJobsReadClient() {
  const admin = createSupabaseAdminClient();

  if (admin) {
    return admin;
  }

  return createSupabaseServerClient();
}

export async function getJobs(searchParams: RawSearchParams) {
  const filters = parseJobSearchParams(searchParams);
  const supabase = await createPublicJobsReadClient();

  if (!supabase) {
    return { jobs: [] as JobWithCompany[], filters, configured: false };
  }

  let query = supabase
    .from("jobs")
    .select(
      "*, companies:company_id(id, name, greenhouse_slug, website)"
    )
    .eq("status", "active")
    .limit(80);

  if (filters.keyword) {
    query = query.ilike("title", `%${filters.keyword}%`);
  }

  if (filters.location) {
    query = query.ilike("location", `%${filters.location}%`);
  }

  if (filters.remote) {
    query = query.eq("remote_type", "remote");
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
  } else {
    query = query.order("discovered_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to load jobs", error);
    return { jobs: [] as JobWithCompany[], filters, configured: true };
  }

  return { jobs: (data ?? []) as JobWithCompany[], filters, configured: true };
}

export async function getJobById(id: string) {
  const supabase = await createPublicJobsReadClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("jobs")
    .select("*, companies:company_id(id, name, greenhouse_slug, website)")
    .eq("id", id)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("Failed to load job detail", error);
    return null;
  }

  return data as JobWithCompany | null;
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
