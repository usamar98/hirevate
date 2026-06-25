import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ResumeAbApplication, ResumeAbTest } from "@/types/database";

export type ResumeAbTestWithApplications = ResumeAbTest & {
  applications: ResumeAbApplication[];
};

export type ResumeVariantStats = {
  applications: number;
  interviews: number;
  offers: number;
  rate: number;
  resumeName: string;
  variant: "A" | "B";
};

export type JobTitleStats = {
  applications: number;
  interviews: number;
  rate: number;
  title: string;
};

export type ResumeAbDashboard = {
  applications: ResumeAbApplication[];
  bestJobTitle: JobTitleStats | null;
  bestResume: ResumeVariantStats | null;
  configured: boolean;
  interviewRate: number;
  interviews: number;
  jobTitleStats: JobTitleStats[];
  tests: ResumeAbTestWithApplications[];
  totalApplications: number;
  variantStats: ResumeVariantStats[];
};

function isInterview(application: ResumeAbApplication) {
  return application.status === "interview" || application.status === "offer";
}

function percentage(part: number, total: number) {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

function buildEmptyDashboard(configured = true): ResumeAbDashboard {
  return {
    applications: [],
    bestJobTitle: null,
    bestResume: null,
    configured,
    interviewRate: 0,
    interviews: 0,
    jobTitleStats: [],
    tests: [],
    totalApplications: 0,
    variantStats: []
  };
}

function buildVariantStats(
  applications: ResumeAbApplication[],
  tests: ResumeAbTest[]
): ResumeVariantStats[] {
  const latestTest = tests[0];

  return (["A", "B"] as const).map((variant) => {
    const variantApplications = applications.filter((application) => application.resume_variant === variant);
    const interviews = variantApplications.filter(isInterview).length;
    const offers = variantApplications.filter((application) => application.status === "offer").length;

    return {
      applications: variantApplications.length,
      interviews,
      offers,
      rate: percentage(interviews, variantApplications.length),
      resumeName:
        variant === "A"
          ? latestTest?.resume_a_name ?? "Resume A"
          : latestTest?.resume_b_name ?? "Resume B",
      variant
    };
  });
}

function buildJobTitleStats(applications: ResumeAbApplication[]) {
  const groups = new Map<string, JobTitleStats>();

  for (const application of applications) {
    const title = application.job_title.trim();
    const key = title.toLowerCase();
    const current = groups.get(key) ?? {
      applications: 0,
      interviews: 0,
      rate: 0,
      title
    };

    current.applications += 1;
    if (isInterview(application)) {
      current.interviews += 1;
    }
    current.rate = percentage(current.interviews, current.applications);
    groups.set(key, current);
  }

  return Array.from(groups.values()).sort((a, b) => {
    if (b.rate !== a.rate) return b.rate - a.rate;
    if (b.interviews !== a.interviews) return b.interviews - a.interviews;
    return b.applications - a.applications;
  });
}

export async function getResumeAbDashboard(userId: string): Promise<ResumeAbDashboard> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return buildEmptyDashboard(false);

  const [testsResponse, applicationsResponse] = await Promise.all([
    supabase
      .from("resume_ab_tests")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("resume_ab_applications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
  ]);

  if (testsResponse.error || applicationsResponse.error) {
    console.error("Failed to load resume A/B dashboard", testsResponse.error ?? applicationsResponse.error);
    return buildEmptyDashboard(true);
  }

  const tests = (testsResponse.data ?? []) as ResumeAbTest[];
  const applications = (applicationsResponse.data ?? []) as ResumeAbApplication[];
  const applicationsByTest = new Map<string, ResumeAbApplication[]>();

  for (const application of applications) {
    const group = applicationsByTest.get(application.ab_test_id) ?? [];
    group.push(application);
    applicationsByTest.set(application.ab_test_id, group);
  }

  const testsWithApplications = tests.map((test) => ({
    ...test,
    applications: applicationsByTest.get(test.id) ?? []
  }));
  const interviews = applications.filter(isInterview).length;
  const variantStats = buildVariantStats(applications, tests);
  const jobTitleStats = buildJobTitleStats(applications);
  const bestResume =
    variantStats
      .filter((stat) => stat.applications > 0)
      .sort((a, b) => {
        if (b.rate !== a.rate) return b.rate - a.rate;
        return b.interviews - a.interviews;
      })[0] ?? null;

  return {
    applications,
    bestJobTitle: jobTitleStats[0] ?? null,
    bestResume,
    configured: true,
    interviewRate: percentage(interviews, applications.length),
    interviews,
    jobTitleStats: jobTitleStats.slice(0, 8),
    tests: testsWithApplications,
    totalApplications: applications.length,
    variantStats
  };
}
