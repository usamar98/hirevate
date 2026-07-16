import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isOpenApplicationStatus } from "@/lib/job-tracker/status";
import type { JobApplication, JobApplicationEvent, JobApplicationStatus } from "@/types/database";

export type JobTrackerView = "active" | "archived";

function isMissingLifecycleError(error: { code?: string; message?: string } | null) {
  return (
    error?.code === "42P01" ||
    error?.code === "42703" ||
    /job_applications|job_application_events|archived_at|listing_status|priority/i.test(
      error?.message ?? ""
    )
  );
}

function isDue(value: string | null) {
  if (!value) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(value).getTime() <= today.getTime();
}

function emptyDashboard(configured: boolean, setupMessage: string | null) {
  return {
    configured,
    setupMessage,
    applications: [] as JobApplication[],
    total: 0,
    openCount: 0,
    interviews: 0,
    offers: 0,
    interviewRate: 0,
    followUpsDue: [] as JobApplication[],
    activeListings: 0,
    closedListings: 0,
    archivedCount: 0,
    recentActivity: [] as JobApplicationEvent[]
  };
}

export async function getJobTrackerDashboard(userId: string, view: JobTrackerView = "active") {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return emptyDashboard(false, "Supabase is not configured.");
  }

  let applicationsQuery = supabase
    .from("job_applications")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(250);

  applicationsQuery =
    view === "archived"
      ? applicationsQuery.not("archived_at", "is", null)
      : applicationsQuery.is("archived_at", null);

  const [applicationsResult, activityResult, archivedCountResult] = await Promise.all([
    applicationsQuery,
    supabase
      .from("job_application_events")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("job_applications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .not("archived_at", "is", null)
  ]);

  const error =
    applicationsResult.error ?? activityResult.error ?? archivedCountResult.error;

  if (error) {
    console.error("Failed to load job tracker", {
      code: error.code,
      message: error.message
    });
    return emptyDashboard(
      !isMissingLifecycleError(error),
      isMissingLifecycleError(error)
        ? "Run supabase/migrations/010_job_tracker_lifecycle.sql in Supabase SQL Editor to enable the professional tracker."
        : "We could not load the job tracker right now."
    );
  }

  const applications = (applicationsResult.data ?? []) as JobApplication[];
  const recentActivity = (activityResult.data ?? []) as JobApplicationEvent[];
  const appliedTotal = applications.filter((item) => item.status !== "interested").length;
  const interviewStatuses: JobApplicationStatus[] = [
    "interview",
    "assessment",
    "final_interview",
    "offer",
    "accepted"
  ];
  const interviews = applications.filter((item) => interviewStatuses.includes(item.status)).length;

  return {
    configured: true,
    setupMessage: null,
    applications,
    total: applications.length,
    openCount: applications.filter((item) => isOpenApplicationStatus(item.status)).length,
    interviews,
    offers: applications.filter((item) => item.status === "offer" || item.status === "accepted").length,
    interviewRate: appliedTotal > 0 ? Math.round((interviews / appliedTotal) * 100) : 0,
    followUpsDue: applications
      .filter((item) => isOpenApplicationStatus(item.status) && isDue(item.next_follow_up_at))
      .slice(0, 8),
    activeListings: applications.filter((item) => item.listing_status === "active").length,
    closedListings: applications.filter((item) =>
      item.listing_status === "closed" || item.listing_status === "unavailable"
    ).length,
    archivedCount: archivedCountResult.count ?? 0,
    recentActivity
  };
}
