import { after, NextResponse, type NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { env } from "@/lib/env";
import { notifyIndexNowAboutJobHubs } from "@/lib/indexnow";
import { syncDailyFreshJobs } from "@/lib/jobs/daily-fresh-sync";
import { getJobSyncHealth } from "@/lib/jobs/sync-health";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function hasValidCronSecret(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  return Boolean(env.cronSecret && authorization === `Bearer ${env.cronSecret}`);
}

export async function GET(request: NextRequest) {
  if (!env.cronSecret) {
    return NextResponse.json(
      {
        error: "CRON_SECRET must be configured in Vercel before daily job sync can run. JOB_SYNC_SECRET is only for manual sync calls."
      },
      { status: 503 }
    );
  }

  if (!hasValidCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  try {
    const result = await syncDailyFreshJobs();
    const health = getJobSyncHealth(result);

    if (result.totalJobsInserted + result.totalJobsUpdated + (result.totalJobsDeleted ?? 0) + (result.totalJobsExpired ?? 0) > 0) {
      revalidateTag("public-jobs");
      after(async () => {
        try {
          await notifyIndexNowAboutJobHubs();
        } catch (error) {
          console.error("IndexNow notification failed", error);
        }
      });
    }

    return NextResponse.json({
      ok: health.status === "healthy",
      status: health.status,
      route: "/api/cron/jobs-sync",
      schedule: request.headers.get("x-vercel-cron-schedule") ?? "manual",
      syncedAt: new Date().toISOString(),
      result
    }, { status: health.refreshed ? 200 : 503 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run daily job sync." },
      { status: 500 }
    );
  }
}
