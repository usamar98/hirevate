import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/jobs/job-card";
import { JobFilters } from "@/components/jobs/job-filters";
import { JsonLd } from "@/components/seo/json-ld";
import { getCurrentUser, getProfile, isPaidSubscription } from "@/lib/auth/session";
import { getJobs, getSavedJobIds, parseJobSearchParams } from "@/lib/jobs/queries";
import { absoluteUrl } from "@/lib/seo";

const jobsDescription =
  "Search fresh direct-apply jobs from official company career pages and hiring sources, with filters for title, location, remote work, and freshness.";

const popularJobPages = [
  { href: "/jobs/remote", label: "Remote jobs" },
  { href: "/jobs/london", label: "London jobs" },
  { href: "/jobs/engineering", label: "Engineering jobs" }
];

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const filters = parseJobSearchParams(resolvedSearchParams);
  const titleParts = [
    filters.remote ? "Remote" : null,
    filters.keyword || "Hidden",
    "Jobs",
    filters.location ? `in ${filters.location}` : null
  ].filter(Boolean);
  const title = titleParts.join(" ");
  const description =
    filters.keyword || filters.location || filters.remote
      ? `Search fresh direct-apply ${title.toLowerCase()} from official hiring sources. No middlemen, no noisy boards.`
      : jobsDescription;

  return {
    title,
    description,
    alternates: {
      canonical: "/jobs"
    },
    openGraph: {
      title,
      description,
      url: "/jobs"
    },
    twitter: {
      title,
      description
    }
  };
}

export default async function JobsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const [{ configured, filters, jobs }, user] = await Promise.all([
    getJobs(resolvedSearchParams),
    getCurrentUser()
  ]);
  const [savedJobIds, profile] = await Promise.all([
    user ? getSavedJobIds(user.id) : Promise.resolve(new Set<string>()),
    user ? getProfile(user.id) : Promise.resolve(null)
  ]);
  const isPaid = isPaidSubscription(profile?.subscription_status);
  const visibleJobs = isPaid ? jobs : jobs.slice(0, 10);
  const isLimited = !isPaid && jobs.length > visibleJobs.length;

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Hidden jobs",
            url: absoluteUrl("/jobs"),
            description: jobsDescription
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
              }
            ]
          }
        ]}
      />
      <section className="bg-gray-50 py-10">
        <div className="container-shell">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-semibold text-ink-900">Hidden jobs</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-ink-500">
                Search official hiring sources by keyword, location, remote preference, and freshness.
              </p>
            </div>
            <Button asChild href="/pricing" variant="outline">
              View plans
            </Button>
          </div>

          <div className="mt-8">
            <JobFilters filters={filters} />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-ink-700">Popular searches:</span>
            {popularJobPages.map((page) => (
              <Link
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 font-medium text-ink-700 transition hover:border-brand-200 hover:text-brand-700"
                href={page.href}
                key={page.href}
              >
                {page.label}
              </Link>
            ))}
          </div>

          {!configured ? (
            <div className="mt-8">
              <EmptyState
                title="Connect Supabase to load jobs"
                description="Add your Supabase environment variables, run the SQL migration and seed file, then use the admin sync page to import jobs."
                action={
                  <Button asChild href="/admin/jobs-sync">
                    Open admin sync
                  </Button>
                }
              />
            </div>
          ) : null}

          {isLimited ? (
            <div className="mt-8 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 md:flex-row md:items-center md:justify-between">
              <span className="inline-flex items-center gap-2 font-medium">
                <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                Free plan preview: showing 10 jobs from this result set.
              </span>
              <Button asChild href="/pricing" size="sm" variant="outline">
                Upgrade
              </Button>
            </div>
          ) : null}

          <div className="mt-8 space-y-4">
            {visibleJobs.map((job) => (
              <JobCard isSaved={savedJobIds.has(job.id)} job={job} key={job.id} />
            ))}
          </div>

          {configured && visibleJobs.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                title="No jobs match these filters"
                description="Try a broader title or location, or run a fresh job source sync from the admin page."
                action={
                  <Button asChild href="/jobs" variant="outline">
                    Clear filters
                  </Button>
                }
              />
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}
