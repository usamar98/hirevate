import { NextResponse } from "next/server";
import {
  getCurrentUser,
  getProfile,
  hasActiveFreeTrial,
  hasPremiumAccess
} from "@/lib/auth/session";
import { getJobBySlugOrId } from "@/lib/jobs/queries";
import { getJobPath } from "@/lib/jobs/seo";
import { reserveTrialFeature } from "@/lib/trial/usage";

export const dynamic = "force-dynamic";

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

function getSafeApplyUrl(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url : null;
  } catch {
    return null;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [job, user] = await Promise.all([getJobBySlugOrId(id), getCurrentUser()]);

  if (!job) return redirectTo(request, "/jobs");

  const jobPath = getJobPath(job);
  const applyUrl = getSafeApplyUrl(job.apply_url);
  if (!applyUrl) return redirectTo(request, jobPath);

  if (!user) {
    return redirectTo(request, `/signup?redirect=${encodeURIComponent(jobPath)}`);
  }

  const profile = await getProfile(user.id);
  if (hasPremiumAccess(profile)) {
    return NextResponse.redirect(applyUrl, 303);
  }

  if (!hasActiveFreeTrial(profile)) {
    return redirectTo(request, "/pricing?trial=expired#plans");
  }

  const reservation = await reserveTrialFeature("job_apply");
  if (!reservation.allowed) {
    return redirectTo(
      request,
      reservation.denialReason === "trial_expired"
        ? "/pricing?trial=expired#plans"
        : "/pricing?limit=trial-access#plans"
    );
  }

  return NextResponse.redirect(applyUrl, 303);
}
