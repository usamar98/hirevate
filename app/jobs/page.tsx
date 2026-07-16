import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight, LockKeyhole } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/jobs/job-card";
import { JobFilters } from "@/components/jobs/job-filters";
import { JsonLd } from "@/components/seo/json-ld";
import { getCurrentUser, getProfile, isPaidSubscription } from "@/lib/auth/session";
import { getJobActionErrorMessage } from "@/lib/jobs/action-feedback";
import { getJobs, getSavedJobIds, parseJobSearchParams } from "@/lib/jobs/queries";
import { getJobCompanyName, getJobPath } from "@/lib/jobs/seo";
import { absoluteUrl, defaultOgImagePath } from "@/lib/seo";
import type { JobSearchInput } from "@/lib/validators/jobs";

const jobsDescription =
  "Search fresh jobs from company career pages, public ATS boards, and trusted hiring sources, with filters for title, location, remote work, and freshness.";

const popularJobPages = [
  { href: "/jobs/latest", label: "Latest jobs" },
  { href: "/jobs/remote", label: "Remote jobs" },
  { href: "/jobs/london", label: "London jobs" },
  { href: "/jobs/engineering", label: "Engineering jobs" },
  { href: "/jobs/software-engineer", label: "Software engineer jobs" },
  { href: "/jobs/product-manager", label: "Product manager jobs" },
  { href: "/jobs/data-analyst", label: "Data analyst jobs" },
  { href: "/jobs/customer-success", label: "Customer success jobs" }
];

const jobWorkflowPages = [
  { href: "/resume-builder", label: "Resume builder" },
  { href: "/cover-letter", label: "Cover letter builder" },
  { href: "/pricing", label: "Plans" }
];

const jobsFaqItems = [
  {
    question: "What counts as a hidden job on Hirevate?",
    answer:
      "A hidden job on Hirevate is a role found from an official or public hiring source before it becomes crowded on generic job boards."
  },
  {
    question: "Where does Hirevate get jobs from?",
    answer:
      "Hirevate imports jobs from company career pages, public ATS job boards, public job discovery sources, and trusted hiring partners."
  },
  {
    question: "What is Hirevate's freshness score?",
    answer:
      "Freshness score ranks jobs with signals such as recent updates, apply URL availability, location quality, and role relevance."
  },
  {
    question: "Can I apply directly from Hirevate?",
    answer:
      "Hirevate shows whether a job links to an employer, public ATS, or partner source. It does not call partner listings direct company apply unless the apply URL is an employer or ATS URL."
  }
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

function hasFacetedSearch(filters: JobSearchInput) {
  return Boolean(
    filters.keyword ||
      filters.company ||
      filters.location ||
      filters.workMode !== "any" ||
      filters.postedWithin !== "all" ||
      filters.freshness !== "all" ||
      filters.sort !== "newest" ||
      filters.page > 1
  );
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
    filters.keyword || filters.location || filters.company || filters.workMode !== "any"
      ? `Search fresh ${title.toLowerCase()} from company career pages, public ATS boards, and trusted hiring sources. Clear source and freshness signals, without a noisy social feed.`
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
      url: "/jobs",
      images: [defaultOgImagePath]
    },
    twitter: {
      title,
      description,
      card: "summary_large_image",
      images: [defaultOgImagePath]
    },
    robots: hasFacetedSearch(filters)
      ? {
          index: false,
          follow: true
        }
      : {
          index: true,
          follow: true
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

  if (!isPaid && page > 1) {
    redirect(buildJobsPageHref(filters, 1));
  }

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
  const visibleJobItemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: activeFilterChips.length > 0 ? "Filtered hidden job results on Hirevate" : "Hidden job results on Hirevate",
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: visibleJobs.length,
    itemListElement: visibleJobs.slice(0, 20).map((job, index) => ({
      "@type": "ListItem",
      position: Math.max(pageStart, 1) + index,
      url: absoluteUrl(getJobPath(job)),
      name: `${job.title} at ${getJobCompanyName(job)}`
    }))
  };

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
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: jobsFaqItems.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer
              }
            }))
          },
          visibleJobItemListJsonLd
        ]}
      />
      <section className="bg-gray-50 py-10">
        <div className="container-shell">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-4xl font-semibold text-ink-900">Hidden jobs</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-ink-500">
                Search company career pages, public ATS boards, and trusted hiring sources by keyword,
                location, remote preference, and freshness.
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

          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-ink-700">Career tools:</span>
            {jobWorkflowPages.map((page) => (
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
                Public preview: showing 10 jobs from {totalCount.toLocaleString()} matching roles.
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

          <div id="results" className="mt-8 scroll-mt-24 space-y-4">
            {visibleJobs.map((job) => (
              <JobCard
                canApply={isPaid}
                hasAccount={Boolean(user)}
                isSaved={savedJobIds.has(job.id)}
                job={job}
                key={job.id}
              />
            ))}
          </div>

          {isPaid && configured && totalPages > 1 ? (
            <nav
              aria-label="Jobs pagination"
              className="mt-8 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 md:flex-row md:items-center md:justify-between"
            >
              <p className="text-sm font-medium text-ink-500">
                Browse all {totalCount.toLocaleString()} active roles from public hiring sources.
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

          <section className="mt-12 grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-ink-900">What hidden jobs means</h2>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Hirevate looks for roles from company career pages, public ATS boards, and trusted
                hiring sources before they become crowded elsewhere.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-ink-900">How sources stay fresh</h2>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Job syncs normalize public hiring sources into one searchable index and expire old
                listings so the feed does not rely on stale static data.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-ink-900">Apply workflow</h2>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Hirevate helps users find, save, prepare, and track roles, then sends them to the
                available employer, ATS, or verified hiring source. It does not auto-apply.
              </p>
            </div>
          </section>

          <section className="mt-8 rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-xl font-semibold text-ink-900">Jobs FAQ</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {jobsFaqItems.map((item) => (
                <div key={item.question}>
                  <h3 className="font-semibold text-ink-900">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-500">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </>
  );
}
