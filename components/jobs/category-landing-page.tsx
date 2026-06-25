import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/jobs/job-card";
import { JsonLd } from "@/components/seo/json-ld";
import { getCurrentUser } from "@/lib/auth/session";
import { jobCategoryList, type JobCategoryPage } from "@/lib/jobs/categories";
import {
  getEngineeringJobs,
  getLocationJobs,
  getRemoteJobs,
  getSavedJobIds
} from "@/lib/jobs/queries";
import { getJobCompanyName, getJobPath } from "@/lib/jobs/seo";
import { absoluteUrl } from "@/lib/seo";
import type { JobWithCompany } from "@/types/database";

async function getCategoryJobs(category: JobCategoryPage) {
  if (category.slug === "remote") return getRemoteJobs();
  if (category.slug === "london") return getLocationJobs("London");
  return getEngineeringJobs();
}

function buildCategoryJsonLd(category: JobCategoryPage, jobs: JobWithCompany[]) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: category.label,
      url: absoluteUrl(category.path),
      description: category.description
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
          name: category.label,
          item: absoluteUrl(category.path)
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${category.label} on Hirevate`,
      itemListElement: jobs.slice(0, 20).map((job, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(getJobPath(job)),
        name: `${job.title} at ${getJobCompanyName(job)}`
      }))
    }
  ];
}

export async function JobCategoryLandingPage({ category }: { category: JobCategoryPage }) {
  const [{ configured, jobs }, user] = await Promise.all([getCategoryJobs(category), getCurrentUser()]);
  const savedJobIds = user ? await getSavedJobIds(user.id) : new Set<string>();
  const siblingCategories = jobCategoryList.filter((item) => item.slug !== category.slug);

  return (
    <>
      <JsonLd data={buildCategoryJsonLd(category, jobs)} />
      <section className="bg-gray-50 py-10">
        <div className="container-shell">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-brand-600">
                {category.eyebrow}
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-ink-900">{category.heading}</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-ink-500">
                {category.description}
              </p>
            </div>
            <Button asChild href="/jobs" variant="outline">
              All jobs
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-ink-700">Related searches:</span>
            {siblingCategories.map((item) => (
              <Link
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 font-medium text-ink-700 transition hover:border-brand-200 hover:text-brand-700"
                href={item.path}
                key={item.slug}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {configured ? (
            <p className="mt-8 text-sm font-medium text-ink-500">
              Showing {jobs.length} fresh direct-apply roles.
            </p>
          ) : null}

          <div className="mt-5 space-y-4">
            {jobs.map((job) => (
              <JobCard
                isSaved={savedJobIds.has(job.id)}
                job={job}
                key={job.id}
                showSave={Boolean(user)}
              />
            ))}
          </div>

          {!configured ? (
            <div className="mt-8">
              <EmptyState
                title="Connect Supabase to load category jobs"
                description="Add your Supabase environment variables and run the job sync to populate this SEO page."
                action={
                  <Button asChild href="/admin/jobs-sync">
                    Open admin sync
                  </Button>
                }
              />
            </div>
          ) : null}

          {configured && jobs.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                title={category.emptyTitle}
                description={category.emptyDescription}
                action={
                  <Button asChild href="/jobs" variant="outline">
                    Browse all jobs
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
