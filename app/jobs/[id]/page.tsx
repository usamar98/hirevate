import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ArrowUpRight, BadgeDollarSign, Building2, CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FreshnessBadge } from "@/components/jobs/freshness-badge";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { JsonLd } from "@/components/seo/json-ld";
import { getCurrentUser } from "@/lib/auth/session";
import { getJobActionErrorMessage } from "@/lib/jobs/action-feedback";
import { getJobCompensationLabel } from "@/lib/jobs/compensation";
import { getJobLocationLabel, getWorkModeLabel, getWorkModeTone } from "@/lib/jobs/display";
import { getJobBySlugOrId, getSavedJobIds } from "@/lib/jobs/queries";
import {
  buildJobBreadcrumbJsonLd,
  buildJobPostingJsonLd,
  getJobCompanyName,
  getJobMetaDescription,
  getJobMetaTitle,
  getJobPath,
  getJobSlug
} from "@/lib/jobs/seo";
import { getJobSourceTrust } from "@/lib/jobs/sources";
import { canViewJob, recordJobView } from "@/lib/jobs/view-limits";
import { sanitizeJobDescription } from "@/lib/jobs/sanitize";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobBySlugOrId(id);

  if (!job) {
    return {
      title: "Job not found",
      description: "This Hirevate job listing is no longer available.",
      robots: {
        index: false,
        follow: true
      }
    };
  }

  const title = getJobMetaTitle(job);
  const description = getJobMetaDescription(job);
  const canonicalPath = getJobPath(job);

  return {
    title: {
      absolute: title
    },
    description,
    alternates: {
      canonical: canonicalPath
    },
    openGraph: {
      title,
      description,
      url: canonicalPath
    },
    twitter: {
      title,
      description
    },
    robots: {
      index: true,
      follow: true
    }
  };
}

export default async function JobDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const [job, user] = await Promise.all([getJobBySlugOrId(id), getCurrentUser()]);

  if (!job) notFound();

  const canonicalSlug = getJobSlug(job);
  const canonicalPath = getJobPath(job);

  if (id.toLowerCase() !== canonicalSlug) {
    redirect(canonicalPath);
  }

  const [access, savedJobIds] = await Promise.all([
    user ? canViewJob(user.id, job.id) : Promise.resolve({ allowed: true, remaining: 0, reason: null }),
    user ? getSavedJobIds(user.id) : Promise.resolve(new Set<string>())
  ]);

  if (user && access.allowed) {
    await recordJobView(user.id, job.id);
  }

  const cleanDescription = sanitizeJobDescription(job.description);
  const companyName = getJobCompanyName(job);
  const compensationLabel = getJobCompensationLabel(job);
  const locationLabel = getJobLocationLabel(job);
  const sourceTrust = getJobSourceTrust(job);
  const saveJobError = getJobActionErrorMessage(resolvedSearchParams?.jobActionError);
  const trackerParams = new URLSearchParams({
    jobId: job.id,
    jobTitle: job.title,
    company: companyName
  });

  if (job.location) trackerParams.set("location", job.location);
  if (job.apply_url ?? job.source_url) trackerParams.set("jobUrl", job.apply_url ?? job.source_url ?? "");
  if (compensationLabel) trackerParams.set("salaryRange", compensationLabel);

  return (
    <>
      <JsonLd data={[buildJobPostingJsonLd(job), buildJobBreadcrumbJsonLd(job)]} />
      <section className="bg-gray-50 py-10">
        <div className="container-shell grid gap-6 lg:grid-cols-[1fr_320px]">
          <article className="min-w-0 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
            <div className="flex flex-wrap gap-2">
              <Badge tone={getWorkModeTone(job.remote_type)}>{getWorkModeLabel(job.remote_type)}</Badge>
              <FreshnessBadge score={job.freshness_score} />
              <Badge tone={sourceTrust.isEmployerOrAtsApply ? "green" : "blue"}>
                {sourceTrust.label}
              </Badge>
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight text-ink-900">{job.title}</h1>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                {companyName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {locationLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Discovered {formatDate(job.discovered_at)}
              </span>
              {compensationLabel ? (
                <span className="inline-flex items-center gap-1.5">
                  <BadgeDollarSign className="h-4 w-4" aria-hidden="true" />
                  {compensationLabel}
                </span>
              ) : null}
            </div>
            <div
              className="mt-8 max-w-none space-y-4 text-base leading-7 text-ink-700 [&_a]:font-semibold [&_a]:text-brand-600 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:leading-7 [&_ul]:space-y-2"
              dangerouslySetInnerHTML={{
                __html: cleanDescription || "<p>No description was provided by this hiring source.</p>"
              }}
            />
          </article>
          <aside className="space-y-4">
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-ink-900">Apply to this role</h2>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                {sourceTrust.applyDescription}
              </p>
              {saveJobError ? (
                <div className="mt-4 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {saveJobError}
                </div>
              ) : null}
              <div className="mt-5 space-y-2">
                {job.apply_url ? (
                  <Button asChild href={job.apply_url} target="_blank" rel="noopener noreferrer" className="w-full">
                    {sourceTrust.applyCta}
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                ) : null}
                <SaveJobButton
                  isSaved={savedJobIds.has(job.id)}
                  jobId={job.id}
                  redirectPath={canonicalPath}
                />
                <Button asChild href={`/dashboard/job-tracker?${trackerParams.toString()}`} variant="outline" className="w-full">
                  Track job
                </Button>
              </div>
            </Card>
            {!access.allowed ? (
              <Card className="border-amber-200 bg-amber-50 p-5">
                <h2 className="text-lg font-semibold text-amber-950">Free view limit reached</h2>
                <p className="mt-2 text-sm leading-6 text-amber-800">
                  You can still read public job pages. Upgrade when you want unlimited saved jobs
                  and search workflow tracking.
                </p>
                <Button asChild href="/pricing" className="mt-5 w-full" variant="outline">
                  View plans
                </Button>
              </Card>
            ) : null}
            {!user ? (
              <Card className="p-5">
                <h2 className="text-lg font-semibold text-ink-900">Track this role</h2>
                <p className="mt-2 text-sm leading-6 text-ink-500">
                  Create a free account to save this job and compare resume versions against
                  interview outcomes.
                </p>
                <Button asChild href={`/signup?redirect=${encodeURIComponent(canonicalPath)}`} className="mt-5 w-full" variant="outline">
                  Start free
                </Button>
              </Card>
            ) : null}
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-ink-900">Listing details</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-semibold text-ink-700">Apply source</dt>
                  <dd className="mt-1 text-ink-500">{sourceTrust.label}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink-700">Updated</dt>
                  <dd className="mt-1 text-ink-500">{formatDate(job.updated_at)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink-700">Freshness score</dt>
                  <dd className="mt-1 text-ink-500">{job.freshness_score}/100</dd>
                </div>
              </dl>
            </Card>
          </aside>
        </div>
      </section>
    </>
  );
}
