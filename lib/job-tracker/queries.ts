import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { JobApplication } from "@/types/database";

function isMissingTableError(error: { code?: string; message?: string } | null) {
  return error?.code === "42P01" || /job_applications/i.test(error?.message ?? "");
}

function isOpenStatus(status: JobApplication["status"]) {
  return status === "interested" || status === "applied" || status === "interview";
}

function isDue(value: string | null) {
  if (!value) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(value).getTime() <= today.getTime();
}

export async function getJobTrackerDashboard(userId: string) {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return {
      configured: false,
      setupMessage: "Supabase is not configured.",
      applications: [] as JobApplication[],
      total: 0,
      openCount: 0,
      interviews: 0,
      offers: 0,
      interviewRate: 0,
      followUpsDue: [] as JobApplication[]
    };
  }

  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load job tracker", error);
    return {
      configured: !isMissingTableError(error),
      setupMessage: isMissingTableError(error)
        ? "Run supabase/migrations/007_job_tracker.sql in Supabase SQL Editor to enable job tracking."
        : "We could not load the job tracker right now.",
      applications: [] as JobApplication[],
      total: 0,
      openCount: 0,
      interviews: 0,
      offers: 0,
      interviewRate: 0,
      followUpsDue: [] as JobApplication[]
    };
  }

  const applications = (data ?? []) as JobApplication[];
  const appliedTotal = applications.filter((item) => item.status !== "interested").length;
  const interviews = applications.filter((item) => item.status === "interview" || item.status === "offer").length;

  return {
    configured: true,
    setupMessage: null,
    applications,
    total: applications.length,
    openCount: applications.filter((item) => isOpenStatus(item.status)).length,
    interviews,
    offers: applications.filter((item) => item.status === "offer").length,
    interviewRate: appliedTotal > 0 ? Math.round((interviews / appliedTotal) * 100) : 0,
    followUpsDue: applications
      .filter((item) => isOpenStatus(item.status) && isDue(item.next_follow_up_at))
      .slice(0, 8)
  };
}
