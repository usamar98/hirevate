import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowUpRight, Building2, CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FreshnessBadge } from "@/components/jobs/freshness-badge";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { getCurrentUser } from "@/lib/auth/session";
import { getJobById, getSavedJobIds } from "@/lib/jobs/queries";
import { canViewJob, recordJobView } from "@/lib/jobs/view-limits";
import { sanitizeJobDescription } from "@/lib/jobs/sanitize";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await getJobById(id);

  return {
    title: job ? `${job.title} at ${job.companies?.name ?? "Company"}` : "Job detail"
  };
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [job, user] = await Promise.all([getJobById(id), getCurrentUser()]);

  if (!job) notFound();
  if (!user) redirect(`/login?redirect=/jobs/${job.id}`);

  const access = await canViewJob(user.id, job.id);
  const savedJobIds = await getSavedJobIds(user.id);

  if (!access.allowed) {
    return (
      <section className="bg-gray-50 py-12">
        <div className="container-shell max-w-3xl">
          <Card className="p-7 text-center">
            <h1 className="text-3xl font-semibold text-ink-900">Daily free view limit reached</h1>
            <p className="mt-3 text-base leading-7 text-ink-500">
              Free users can view 10 job detail pages per day. Upgrade for unlimited direct-apply
              job discovery.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild href="/pricing">
                Upgrade
              </Button>
              <Button asChild href="/jobs" variant="outline">
                Back to jobs
              </Button>
            </div>
          </Card>
        </div>
      </section>
    );
  }

  await recordJobView(user.id, job.id);

  const cleanDescription = sanitizeJobDescription(job.description);
  const companyName = job.companies?.name ?? "Unknown company";

  return (
    <section className="bg-gray-50 py-10">
      <div className="container-shell grid gap-6 lg:grid-cols-[1fr_320px]">
        <article className="min-w-0 rounded-lg border border-gray-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">Greenhouse</Badge>
            <Badge>{job.remote_type ?? "onsite"}</Badge>
            <FreshnessBadge score={job.freshness_score} />
          </div>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-ink-900">{job.title}</h1>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-500">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-4 w-4" aria-hidden="true" />
              {companyName}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {job.location ?? "Location not listed"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Discovered {formatDate(job.discovered_at)}
            </span>
          </div>
          <div
            className="mt-8 max-w-none space-y-4 text-base leading-7 text-ink-700 [&_a]:font-semibold [&_a]:text-brand-600 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl [&_h3]:font-semibold [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_p]:leading-7 [&_ul]:space-y-2"
            dangerouslySetInnerHTML={{
              __html: cleanDescription || "<p>No description was provided by this Greenhouse board.</p>"
            }}
          />
        </article>
        <aside className="space-y-4">
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-ink-900">Apply directly</h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">
              Open the official company application page from the Greenhouse source.
            </p>
            <div className="mt-5 space-y-2">
              {job.apply_url ? (
                <Button asChild href={job.apply_url} target="_blank" rel="noopener noreferrer" className="w-full">
                  Direct apply
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : null}
              <SaveJobButton isSaved={savedJobIds.has(job.id)} jobId={job.id} />
            </div>
          </Card>
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-ink-900">Source details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="font-semibold text-ink-700">Source URL</dt>
                <dd className="mt-1 truncate text-ink-500">
                  {job.source_url ? (
                    <Link href={job.source_url} target="_blank" rel="noopener noreferrer" className="text-brand-600">
                      {job.source_url}
                    </Link>
                  ) : (
                    "Not available"
                  )}
                </dd>
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
  );
}
