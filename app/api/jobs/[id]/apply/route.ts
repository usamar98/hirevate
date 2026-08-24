import { NextResponse } from "next/server";
import { getJobBySlugOrId } from "@/lib/jobs/queries";
import { getJobPath } from "@/lib/jobs/seo";
import { getSafeJobApplyUrl } from "@/lib/jobs/sources";

export const dynamic = "force-dynamic";

function redirectTo(request: Request, path: string) {
  return NextResponse.redirect(new URL(path, request.url), 303);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = await getJobBySlugOrId(id);

  if (!job) return redirectTo(request, "/jobs");

  const jobPath = getJobPath(job);
  const applyUrl = getSafeJobApplyUrl(job.apply_url);
  if (!applyUrl) return redirectTo(request, jobPath);

  return NextResponse.redirect(applyUrl, 303);
}
