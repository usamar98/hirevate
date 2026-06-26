import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, LockKeyhole } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/jobs/job-card";
import { JobFilters } from "@/components/jobs/job-filters";
import { JsonLd } from "@/components/seo/json-ld";
import { getCurrentUser, getProfile, isPaidSubscription } from "@/lib/auth/session";
import { getJobActionErrorMessage } from "@/lib/jobs/action-feedback";
import { getJobs, getSavedJobIds, parseJobSearchParams } from "@/lib/jobs/queries";
import { absoluteUrl } from "@/lib/seo";
import type { JobSearchInput } from "@/lib/validators/jobs";

const jobsDescription =
  "Search fresh direct-apply jobs from official company career pages and hiring sources, with filters for title, location, remote work, and freshness.";

const popularJobPages = [
  { href: "/jobs/remote", label: "Remote jobs" },
  { href: "/jobs/london", label: "London jobs" },
  { href: "/jobs/engineering", label: "Engineering jobs" }
];

export const dynamic = "force-dynamic";

const workModeLabels: Record<Exclude<JobSearchInput["workMode"], "any">, string> = {
  hybrid: "Hybrid",
  onsite: "On-site",
  remote: "Remote"
};

const postedWithinLabels: Record<Exclude<JobSearchInput["postedWithin"], "all">, string> = {
  "24h": "Past 24 hours",
  "7d": "Past 7 days",
  "14d": "Past 14 days",
  "30d": "Past 30 days"
};

const freshnessLabels: Record<Exclude<JobSearchInput["freshness"], "all">, string> = {
  fresh: "90+ fresh",
  good: "70+ good"
};

function buildJobsPageHref(
  filters: JobSearchInput,
  page: number,
  overrides: Partial<JobSearchInput> = {}
) {
  const nextFilters = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (nextFilters.keyword) params.set("keyword", nextFilters.keyword);
  if (nextFilters.company) params.set("company", nextFilters.company);
  if (nextFilters.location) params.set("location", nextFilters.location);
  if (nextFilters.workMode !== "any") params.set("workMode", nextFilters.workMode);
  if (nextFilters.postedWithin !== "all") {
    params.set("postedWithin", nextFilters.postedWithin);
  }
  if (nextFilters.directOnly) params.set("directOnly", "on");
  if (nextFilters.freshness !== "all") params.set("freshness", nextFilters.freshness);
  if (nextFilters.sort !== "newest") params.set("sort", nextFilters.sort);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/jobs?${query}` : "/jobs";
}

function getActiveFilterChips(filters: JobSearchInput) {
  return [
    filters.keyword
      ? { label: `Role: ${filters.keyword}`, href: buildJobsPageHref(filters, 1, { keyword: "" }) }
      : null,
    filters.company
      ? { label: `Company: ${filters.company}`, href: buildJobsPageHref(filters, 1, { company: "" }) }
      : null,
    filters.location
      ? {
          label: `Location: ${filters.location}`,
          href: buildJobsPageHref(filters, 1, { location: "" })
        }
      : null,
    filters.workMode !== "any"
      ? {
          label: workModeLabels[filters.workMode],
          href: buildJobsPageHref(filters, 1, { workMode: "any" })
        }
      : null,
    filters.postedWithin !== "all"
      ? {
          label: postedWithinLabels[filters.postedWithin],
          href: buildJobsPageHref(filters, 1, { postedWithin: "all" })
        }
      : null,
    filters.directOnly
      ? {
          label: "Direct apply",
          href: buildJobsPageHref(filters, 1, { directOnly: undefined })
        }
      : null,
    filters.freshness !== "all"
      ? {
          label: freshnessLabels[filters.freshness],
          href: buildJobsPageHref(filters, 1, { freshness: "all" })
        }
      : null,
    filters.sort !== "newest"
      ? {
          label: filters.sort === "freshness" ? "Freshest first" : "Recently updated",
          href: buildJobsPageHref(filters, 1, { sort: "newest" })
        }
      : null
  ].filter(Boolean) as Array<{ label: string; href: string }>;
}

export async function generateMetadata({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const filters = parseJobSearchParams(resolvedSearchParams);
  const titleParts = [
    filters.workMode !== "any" ? workModeLabels[filters.workMode] : null,
    filters.keyword || "Hidden",
    "Jobs",
    filters.company ? `at ${filters.company}` : null,
    filters.location ? `in ${filters.location}` : null
  ].filter(Boolean);
  const title = titleParts.join(" ");
  const description =
    filters.keyword || filters.location || filters.company || filters.workMode !== "any" || filters.directOnly
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
  const [{ configured, filters, jobs, page, pageSize, totalCount, totalPages }, user] = await Promise.all([
    getJobs(resolvedSearchParams),
    getCurrentUser()
  ]);
  const [savedJobIds, profile] = await Promise.all([
    user ? getSavedJobIds(user.id) : Promise.resolve(new Set<string>()),
    user ? getProfile(user.id) : Promise.resolve(null)
  ]);
  const isPaid = isPaidSubscription(profile?.subscription_status);
  const visibleJobs = isPaid ? jobs : jobs.slice(0, 10);
  const hasVisibleJobs = visibleJobs.length > 0;
  const isLimited = !isPaid && hasVisibleJobs && totalCount > visibleJobs.length;
  const pageStart = hasVisibleJobs ? (page - 1) * pageSize + 1 : 0;
  const pageEnd = Math.min(page * pageSize, totalCount);
  const visibleEnd = hasVisibleJobs
    ? isPaid
      ? pageEnd
      : Math.min(pageStart + visibleJobs.length - 1, totalCount)
    : 0;
  const hasPreviousPage = page > 1;
  const hasNextPage = totalPages > page;
  const activeFilterChips = getActiveFilterChips(filters);
  const saveJobError = getJobActionErrorMessage(resolvedSearchParams?.jobActionError);

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

          {saveJobError ? (
            <div className="mt-5 rounded-lg border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-700">
              {saveJobError}
            </div>
          ) : null}

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

          {activeFilterChips.length > 0 ? (
            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold text-ink-700">Active filters:</span>
              {activeFilterChips.map((chip) => (
                <Link
                  className="rounded-md border border-brand-100 bg-brand-50 px-3 py-1.5 font-semibold text-brand-700 transition hover:border-brand-200 hover:bg-white"
                  href={chip.href}
                  key={chip.label}
                >
                  {chip.label}
                </Link>
              ))}
              <Link className="font-semibold text-ink-500 transition hover:text-brand-700" href="/jobs">
                Clear all
              </Link>
            </div>
          ) : null}

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
                Free plan preview: showing 10 jobs from {totalCount.toLocaleString()} matching roles.
              </span>
              <Button asChild href="/pricing" size="sm" variant="outline">
                Upgrade
              </Button>
            </div>
          ) : null}

          {configured ? (
            <div className="mt-8 flex flex-col gap-2 text-sm text-ink-500 md:flex-row md:items-center md:justify-between">
              <p>
                {hasVisibleJobs ? (
                  <>
                    Showing{" "}
                    <span className="font-semibold text-ink-800">
                      {pageStart.toLocaleString()}-{visibleEnd.toLocaleString()}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-ink-800">
                      {totalCount.toLocaleString()}
                    </span>{" "}
                    active jobs
                  </>
                ) : totalCount > 0 ? (
                  "This result page is empty. Use the previous page or clear filters."
                ) : (
                  "No active jobs match these filters yet."
                )}
              </p>
              {isPaid && totalPages > 1 ? (
                <p>
                  Page {page.toLocaleString()} of {totalPages.toLocaleString()}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 space-y-4">
            {visibleJobs.map((job) => (
              <JobCard isSaved={savedJobIds.has(job.id)} job={job} key={job.id} />
            ))}
          </div>

          {isPaid && configured && totalPages > 1 ? (
            <nav
              aria-label="Jobs pagination"
              className="mt-8 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
            >
              <p className="text-sm font-medium text-ink-500">
                Browse all {totalCount.toLocaleString()} active direct-apply roles.
              </p>
              <div className="flex gap-2">
                {hasPreviousPage ? (
                  <Button asChild href={buildJobsPageHref(filters, page - 1)} variant="outline">
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    Previous
                  </Button>
                ) : (
                  <span className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-gray-100 bg-gray-50 px-4 text-sm font-semibold text-ink-300">
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    Previous
                  </span>
                )}
                {hasNextPage ? (
                  <Button asChild href={buildJobsPageHref(filters, page + 1)} variant="outline">
                    Next
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                ) : (
                  <span className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-gray-100 bg-gray-50 px-4 text-sm font-semibold text-ink-300">
                    Next
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                )}
              </div>
            </nav>
          ) : null}

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
