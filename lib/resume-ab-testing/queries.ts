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
  share: number;
  variant: "A" | "B";
};

export type JobTitleStats = {
  applications: number;
  interviews: number;
  rate: number;
  title: string;
};

export type FunnelStats = {
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
};

export type FollowUpItem = {
  appliedAt: string;
  company: string | null;
  daysSinceApplied: number;
  id: string;
  jobTitle: string;
  nextFollowUpAt: string | null;
  resumeVariant: "A" | "B";
  sourceUrl: string | null;
};

export type ResumeAbTestSummary = {
  applications: number;
  createdAt: string;
  id: string;
  interviewRate: number;
  interviews: number;
  name: string;
  offers: number;
  recommendation: string;
  sampleQuality: "Needs data" | "Keep balanced" | "Ready to decide";
  variantStats: ResumeVariantStats[];
};

export type ResumeAbDashboard = {
  applications: ResumeAbApplication[];
  bestJobTitle: JobTitleStats | null;
  bestResume: ResumeVariantStats | null;
  configured: boolean;
  followUpQueue: FollowUpItem[];
  funnelStats: FunnelStats;
  insightCards: string[];
  interviewRate: number;
  interviews: number;
  jobTitleStats: JobTitleStats[];
  setupMessage: string | null;
  testSummaries: ResumeAbTestSummary[];
  tests: ResumeAbTestWithApplications[];
  totalApplications: number;
  variantStats: ResumeVariantStats[];
};

const defaultFunnelStats: FunnelStats = {
  applied: 0,
  interview: 0,
  offer: 0,
  rejected: 0
};

function isInterview(application: ResumeAbApplication) {
  return application.status === "interview" || application.status === "offer";
}

function percentage(part: number, total: number) {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

function dayDifference(from: string, to = new Date()) {
  const fromTime = new Date(`${from}T00:00:00`).getTime();
  if (Number.isNaN(fromTime)) return 0;
  return Math.max(0, Math.floor((to.getTime() - fromTime) / 86_400_000));
}

function isPastOrToday(value: string | null | undefined, todayIso: string) {
  if (!value) return false;
  return value <= todayIso;
}

function buildVariantStats(
  applications: ResumeAbApplication[],
  test?: Pick<ResumeAbTest, "resume_a_name" | "resume_b_name">
): ResumeVariantStats[] {
  const totalApplications = applications.length;

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
          ? test?.resume_a_name ?? "Resume A"
          : test?.resume_b_name ?? "Resume B",
      share: percentage(variantApplications.length, totalApplications),
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

function buildFunnelStats(applications: ResumeAbApplication[]): FunnelStats {
  return applications.reduce<FunnelStats>(
    (stats, application) => {
      stats[application.status] += 1;
      return stats;
    },
    { ...defaultFunnelStats }
  );
}

function buildFollowUpQueue(applications: ResumeAbApplication[]): FollowUpItem[] {
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);

  return applications
    .filter((application) => {
      if (application.status !== "applied") return false;
      const nextFollowUpAt = application.next_follow_up_at;
      return isPastOrToday(nextFollowUpAt, todayIso) || (!nextFollowUpAt && dayDifference(application.applied_at, today) >= 7);
    })
    .map((application) => ({
      appliedAt: application.applied_at,
      company: application.company,
      daysSinceApplied: dayDifference(application.applied_at, today),
      id: application.id,
      jobTitle: application.job_title,
      nextFollowUpAt: application.next_follow_up_at,
      resumeVariant: application.resume_variant,
      sourceUrl: application.source_url
    }))
    .sort((a, b) => b.daysSinceApplied - a.daysSinceApplied)
    .slice(0, 6);
}

function getSampleQuality(stats: ResumeVariantStats[]) {
  const total = stats.reduce((sum, stat) => sum + stat.applications, 0);
  const smallestSample = Math.min(...stats.map((stat) => stat.applications));
  const largestSample = Math.max(...stats.map((stat) => stat.applications));

  if (total < 10 || smallestSample < 3) return "Needs data";
  if (largestSample - smallestSample > Math.ceil(total * 0.35)) return "Keep balanced";
  return "Ready to decide";
}

function buildRecommendation(stats: ResumeVariantStats[]) {
  const quality = getSampleQuality(stats);
  const [leader, challenger] = [...stats].sort((a, b) => {
    if (b.rate !== a.rate) return b.rate - a.rate;
    return b.interviews - a.interviews;
  });

  if (!leader || !challenger || leader.applications === 0) {
    return "Create the first two resume versions, then log each application against A or B.";
  }

  if (quality === "Needs data") {
    return "Keep testing until both versions have at least 3 applications and 10 total applications.";
  }

  if (quality === "Keep balanced") {
    return "Balance the sample before deciding. One version has received too much traffic.";
  }

  if (leader.rate === challenger.rate) {
    return "Both versions are tied. Keep testing or change one resume angle more aggressively.";
  }

  return `Resume ${leader.variant} is leading by ${leader.rate - challenger.rate} points. Use it for similar roles while you keep testing.`;
}

function buildTestSummaries(tests: ResumeAbTestWithApplications[]): ResumeAbTestSummary[] {
  return tests.map((test) => {
    const variantStats = buildVariantStats(test.applications, test);
    const interviews = test.applications.filter(isInterview).length;
    const offers = test.applications.filter((application) => application.status === "offer").length;

    return {
      applications: test.applications.length,
      createdAt: test.created_at,
      id: test.id,
      interviewRate: percentage(interviews, test.applications.length),
      interviews,
      name: test.name,
      offers,
      recommendation: buildRecommendation(variantStats),
      sampleQuality: getSampleQuality(variantStats),
      variantStats
    };
  });
}

function buildInsightCards({
  bestJobTitle,
  bestResume,
  followUpQueue,
  jobTitleStats,
  totalApplications
}: {
  bestJobTitle: JobTitleStats | null;
  bestResume: ResumeVariantStats | null;
  followUpQueue: FollowUpItem[];
  jobTitleStats: JobTitleStats[];
  totalApplications: number;
}) {
  const insights: string[] = [];

  if (bestResume) {
    insights.push(`Resume ${bestResume.variant} is your strongest version at ${bestResume.rate}% interview rate.`);
  } else {
    insights.push("Start with two sharply different resume angles so the test can produce a clear signal.");
  }

  if (bestJobTitle) {
    insights.push(`${bestJobTitle.title} is converting best at ${bestJobTitle.rate}%. Prioritize similar titles.`);
  } else {
    insights.push("Log job titles consistently to reveal which roles convert fastest.");
  }

  if (followUpQueue.length) {
    insights.push(`${followUpQueue.length} application${followUpQueue.length === 1 ? "" : "s"} should get a follow-up now.`);
  }

  if (totalApplications > 0 && jobTitleStats.length < 2) {
    insights.push("Test at least two target job-title clusters before narrowing your search strategy.");
  }

  return insights.slice(0, 4);
}

function isMissingResumeTestingSchema(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    message.includes("schema cache") ||
    message.includes("does not exist") ||
    message.includes("could not find the table")
  );
}

function buildEmptyDashboard(configured = true, setupMessage: string | null = null): ResumeAbDashboard {
  return {
    applications: [],
    bestJobTitle: null,
    bestResume: null,
    configured,
    followUpQueue: [],
    funnelStats: { ...defaultFunnelStats },
    insightCards: [
      configured
        ? "Create your first A/B test with two different resume angles."
        : "Run the resume A/B testing Supabase migration to enable this dashboard."
    ],
    interviewRate: 0,
    interviews: 0,
    jobTitleStats: [],
    setupMessage,
    testSummaries: [],
    tests: [],
    totalApplications: 0,
    variantStats: buildVariantStats([])
  };
}

export async function getResumeAbDashboard(userId: string): Promise<ResumeAbDashboard> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return buildEmptyDashboard(false, "Supabase browser environment variables are missing.");
  }

  try {
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
      const error = testsResponse.error ?? applicationsResponse.error;
      console.error("Failed to load resume A/B dashboard", error);

      if (isMissingResumeTestingSchema(error)) {
        return buildEmptyDashboard(
          false,
          "The resume A/B testing tables are not available yet. Run migrations 004 and 005 in Supabase SQL Editor."
        );
      }

      return buildEmptyDashboard(true, "We could not load resume testing data. Try again in a moment.");
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
    const latestTest = tests[0];
    const interviews = applications.filter(isInterview).length;
    const variantStats = buildVariantStats(applications, latestTest);
    const jobTitleStats = buildJobTitleStats(applications);
    const followUpQueue = buildFollowUpQueue(applications);
    const bestResume =
      variantStats
        .filter((stat) => stat.applications > 0)
        .sort((a, b) => {
          if (b.rate !== a.rate) return b.rate - a.rate;
          return b.interviews - a.interviews;
        })[0] ?? null;
    const bestJobTitle = jobTitleStats[0] ?? null;

    return {
      applications,
      bestJobTitle,
      bestResume,
      configured: true,
      followUpQueue,
      funnelStats: buildFunnelStats(applications),
      insightCards: buildInsightCards({
        bestJobTitle,
        bestResume,
        followUpQueue,
        jobTitleStats,
        totalApplications: applications.length
      }),
      interviewRate: percentage(interviews, applications.length),
      interviews,
      jobTitleStats: jobTitleStats.slice(0, 8),
      setupMessage: null,
      testSummaries: buildTestSummaries(testsWithApplications),
      tests: testsWithApplications,
      totalApplications: applications.length,
      variantStats
    };
  } catch (error) {
    console.error("Resume A/B dashboard crashed", error);
    return buildEmptyDashboard(false, "Resume testing could not reach Supabase. Check the project environment variables.");
  }
}
