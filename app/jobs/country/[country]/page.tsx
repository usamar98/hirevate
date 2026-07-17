import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Globe2, LockKeyhole } from "lucide-react";
import { JobCard } from "@/components/jobs/job-card";
import { JsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getJobCountryBySlug, jobCountries } from "@/lib/jobs/countries";
import { getCountryJobs } from "@/lib/jobs/queries";
import { getJobCompanyName, getJobPath } from "@/lib/jobs/seo";
import { absoluteUrl, defaultOgImagePath } from "@/lib/seo";

type CountryJobsPageProps = {
  params: Promise<{ country: string }>;
};

export const revalidate = 1800;

export function generateStaticParams() {
  return jobCountries
    .filter((country) => country.path === `/jobs/country/${country.slug}`)
    .map((country) => ({ country: country.slug }));
}

export async function generateMetadata({ params }: CountryJobsPageProps): Promise<Metadata> {
  const { country: slug } = await params;
  const country = getJobCountryBySlug(slug);
  if (!country || country.path !== `/jobs/country/${country.slug}`) return {};

  const title = `${country.name} Jobs From Public Hiring Sources`;
  const description = `Find fresh jobs in ${country.name} from company career pages, public ATS boards, and trusted hiring sources, with clear location, source, and freshness signals.`;

  return {
    title: { absolute: `${title} | Hirevate` },
    description,
    keywords: [`jobs in ${country.name}`, `${country.demonym} jobs`, `remote jobs in ${country.name}`],
    alternates: { canonical: country.path },
    openGraph: { title, description, url: country.path, images: [defaultOgImagePath] },
    twitter: { title, description, card: "summary_large_image", images: [defaultOgImagePath] }
  };
}

function getCountryFaqs(country: NonNullable<ReturnType<typeof getJobCountryBySlug>>) {
  return [
    {
      question: `Where does Hirevate find jobs in ${country.name}?`,
      answer: `Hirevate collects public roles associated with ${country.name} from company career pages, public ATS boards, public job discovery sources, and trusted hiring partners.`
    },
    {
      question: `Which locations are included for ${country.name}?`,
      answer: `The country filter matches explicit country names and common locations such as ${country.popularCities.join(", ")}. Location coverage depends on the text supplied by each hiring source.`
    },
    {
      question: `Are remote jobs in ${country.name} included?`,
      answer: `Yes, when the public source identifies the role as remote and associates it with ${country.name} or one of its locations.`
    },
    {
      question: "Does country detection hide jobs from other countries?",
      answer: "No. Visitors can switch to All countries at any time, and country pages are separate from the complete job index."
    },
    {
      question: `Does Hirevate auto-apply to ${country.demonym} jobs?`,
      answer: "No. Hirevate shows the available employer, ATS, or partner apply source and users submit applications themselves."
    }
  ];
}

export default async function CountryJobsPage({ params }: CountryJobsPageProps) {
  const { country: slug } = await params;
  const country = getJobCountryBySlug(slug);
  if (!country || country.path !== `/jobs/country/${country.slug}`) notFound();

  const { configured, jobs } = await getCountryJobs(country);
  const visibleJobs = jobs.slice(0, 10);
  const faqs = getCountryFaqs(country);
  const siblingCountries = jobCountries.filter((item) => item.slug !== country.slug);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `Jobs in ${country.name}`,
            url: absoluteUrl(country.path),
            description: `Fresh public-source jobs in ${country.name}.`,
            about: { "@type": "Country", name: country.name },
            audience: { "@type": "Audience", audienceType: `Job seekers in ${country.name}` }
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
              { "@type": "ListItem", position: 2, name: "Jobs", item: absoluteUrl("/jobs") },
              { "@type": "ListItem", position: 3, name: country.name, item: absoluteUrl(country.path) }
            ]
          },
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: `Fresh jobs in ${country.name}`,
            numberOfItems: visibleJobs.length,
            itemListElement: visibleJobs.map((job, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: absoluteUrl(getJobPath(job)),
              name: `${job.title} at ${getJobCompanyName(job)}`
            }))
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer }
            }))
          }
        ]}
      />
      <section className="bg-gray-50 py-10">
        <div className="container-shell">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase text-brand-600">
                <Globe2 className="h-4 w-4" aria-hidden="true" />
                {country.name} job search
              </p>
              <h1 className="mt-3 text-4xl font-semibold text-ink-900">Jobs in {country.name}</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-ink-500">
                Browse fresh roles connected to {country.name} from company career pages, public ATS
                boards, and trusted hiring sources. Location matching uses the information published
                by each source and can include {country.popularCities.join(", ")}.
              </p>
            </div>
            <Button asChild href={`/jobs?country=${country.slug}`}>
              Search {country.demonym} jobs
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-ink-700">Browse another country:</span>
            {siblingCountries.map((item) => (
              <Link
                className="rounded-md border border-gray-200 bg-white px-3 py-1.5 font-medium text-ink-700 transition hover:border-brand-200 hover:text-brand-700"
                href={item.path}
                key={item.slug}
              >
                {item.name}
              </Link>
            ))}
            <Link className="font-semibold text-brand-700" href="/jobs?country=all">
              All countries
            </Link>
          </div>

          {configured ? (
            <p className="mt-8 text-sm font-medium text-ink-500">
              Showing {visibleJobs.length} of {jobs.length} fresh roles matched to {country.name}.
            </p>
          ) : null}

          {jobs.length > visibleJobs.length ? (
            <div className="mt-5 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 md:flex-row md:items-center md:justify-between">
              <span className="inline-flex items-center gap-2 font-medium">
                <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                Public preview: open the job search for the complete country-filtered feed.
              </span>
              <Button asChild href={`/jobs?country=${country.slug}`} size="sm" variant="outline">
                View all matches
              </Button>
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            {visibleJobs.map((job) => (
              <JobCard canApply={false} hasAccount={false} job={job} key={job.id} showApplyAction={false} />
            ))}
          </div>

          {!configured ? (
            <div className="mt-8">
              <EmptyState
                title="Connect Supabase to load country jobs"
                description="Configure Supabase and run the job sync to populate this country page."
              />
            </div>
          ) : null}

          {configured && jobs.length === 0 ? (
            <div className="mt-8">
              <EmptyState
                title={`No ${country.demonym} jobs found yet`}
                description="Browse all countries while Hirevate refreshes more public hiring sources."
                action={<Button asChild href="/jobs?country=all" variant="outline">Browse all jobs</Button>}
              />
            </div>
          ) : null}

          <section className="mt-10 grid gap-4 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-ink-900">Country matching</h2>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Hirevate matches the country name and common cities in public job-location text. It
                does not claim that every remote role is available to every applicant.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-ink-900">Source quality</h2>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Results retain employer, ATS, or partner source labels so job seekers can verify the
                role and application path before applying.
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="text-lg font-semibold text-ink-900">Location control</h2>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                Approximate country detection is only a starting preference. Visitors can select
                another country or All countries from the main job search.
              </p>
            </div>
          </section>

          <section className="mt-8 rounded-lg border border-gray-200 bg-white p-5">
            <h2 className="text-xl font-semibold text-ink-900">{country.name} jobs FAQ</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {faqs.map((item) => (
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
