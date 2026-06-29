import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/seo/json-ld";
import { getSitemapJobs } from "@/lib/jobs/queries";
import { getJobCompanyName, getJobPath } from "@/lib/jobs/seo";
import { absoluteUrl } from "@/lib/seo";
import { formatRelativeDate } from "@/lib/utils";

const latestJobsDescription =
  "Browse the latest public direct-apply job detail pages indexed by Hirevate from official hiring sources.";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Latest Direct-Apply Jobs",
  description: latestJobsDescription,
  alternates: {
    canonical: "/jobs/latest"
  },
  openGraph: {
    title: "Latest Direct-Apply Jobs",
    description: latestJobsDescription,
    url: "/jobs/latest"
  },
  twitter: {
    title: "Latest Direct-Apply Jobs",
    description: latestJobsDescription
  }
};

export default async function LatestJobsPage() {
  const jobs = await getSitemapJobs(100);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Latest direct-apply jobs",
            url: absoluteUrl("/jobs/latest"),
            description: latestJobsDescription
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Latest public job pages on Hirevate",
            itemListOrder: "https://schema.org/ItemListOrderDescending",
            numberOfItems: jobs.length,
            itemListElement: jobs.map((job, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: absoluteUrl(getJobPath(job)),
              name: `${job.title} at ${getJobCompanyName(job)}`
            }))
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: absoluteUrl("/")
              },
              {
                "@type": "ListItem",
                position: 2,
                name: "Jobs",
                item: absoluteUrl("/jobs")
              },
              {
                "@type": "ListItem",
                position: 3,
                name: "Latest jobs",
                item: absoluteUrl("/jobs/latest")
              }
            ]
          }
        ]}
      />
      <section className="bg-gray-50 py-10">
        <div className="container-shell">
          <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-brand-600">
                Public job index
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-ink-900">
                Latest direct-apply jobs
              </h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-ink-500">
                A crawlable list of recent public job pages from the normalized Hirevate job index.
              </p>
            </div>
            <Button asChild href="/jobs" variant="outline">
              Search jobs
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="mt-8 grid gap-3">
            {jobs.map((job) => (
              <Card className="p-5" key={job.id}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={job.remote_type === "remote" ? "green" : "blue"}>
                        {job.remote_type ?? "onsite"}
                      </Badge>
                      <Badge tone="gray">Score {job.freshness_score}</Badge>
                    </div>
                    <Link href={getJobPath(job)} className="mt-3 block text-lg font-semibold text-ink-900 hover:text-brand-600">
                      {job.title}
                    </Link>
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-4 w-4" aria-hidden="true" />
                        {getJobCompanyName(job)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" aria-hidden="true" />
                        {job.location ?? "Location not listed"}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-4 w-4" aria-hidden="true" />
                        Updated {formatRelativeDate(job.updated_at ?? job.discovered_at)}
                      </span>
                    </div>
                  </div>
                  <Button asChild href={getJobPath(job)} variant="outline">
                    View role
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {jobs.length === 0 ? (
            <Card className="mt-8 p-6">
              <h2 className="text-lg font-semibold text-ink-900">No public jobs available yet</h2>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Run the job sync from the admin page to populate this public latest jobs index.
              </p>
            </Card>
          ) : null}
        </div>
      </section>
    </>
  );
}
