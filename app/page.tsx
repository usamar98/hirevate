import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Filter,
  Link2,
  ListChecks,
  Search,
  Sparkles,
  XCircle
} from "lucide-react";
import { CompanyLogo } from "@/components/company-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/seo/json-ld";
import { getFeaturedJobs } from "@/lib/jobs/queries";
import { getJobPath } from "@/lib/jobs/seo";
import { publicPricingPlans } from "@/lib/pricing";
import { absoluteUrl, defaultDescription, siteName, defaultOgImagePath } from "@/lib/seo";
import type { JobWithCompany } from "@/types/database";

const landingDescription =
  "Find fresh hidden jobs, build job-specific resumes and cover letters with secure AI assistance, and manage every application from interest to decision.";

export const metadata: Metadata = {
  description: landingDescription,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: siteName,
    description: landingDescription,
    url: "/",
    images: [defaultOgImagePath]
  },
  twitter: {
    title: siteName,
    description: landingDescription,
    card: "summary_large_image",
    images: [defaultOgImagePath]
  }
};

const features = [
  {
    title: "Fresh jobs",
    description: "Scan company career pages, public ATS boards, and trusted hiring sources for recently updated professional roles.",
    icon: Clock3
  },
  {
    title: "Verified apply paths",
    description: "See whether a role opens through an employer page, public ATS board, or verified hiring source.",
    icon: Link2
  },
  {
    title: "Remote filters",
    description: "Filter for remote roles and locations without losing the direct source context.",
    icon: Filter
  },
  {
    title: "Freshness score",
    description: "Rank roles by recency, location quality, apply URL presence, and role relevance.",
    icon: BadgeCheck
  },
  {
    title: "AI application writing",
    description: "Improve resume summaries, experience bullets, and job-specific cover letters using only facts you provide.",
    icon: Sparkles
  },
  {
    title: "Application command center",
    description: "Track stage, priority, next action, follow-ups, listing health, and outcomes in one pipeline.",
    icon: ListChecks
  }
];

const emptyPreviewJobs = [
  {
    title: "Fresh jobs are being indexed",
    company: "Hirevate public job index",
    location: "Browse the latest available roles",
    score: null,
    href: "/jobs/latest"
  }
];

const homeFaqItems = [
  {
    question: "What is Hirevate?",
    answer:
      "Hirevate is a career workflow SaaS for finding fresh roles from company career pages, public ATS boards, and trusted hiring sources, then building targeted resumes, cover letters, and an application plan around those roles."
  },
  {
    question: "Who is Hirevate for?",
    answer:
      "Hirevate is for job seekers who want professional roles from cleaner hiring sources, including remote, engineering, product, data, customer success, sales, marketing, operations, and business roles."
  },
  {
    question: "What sources does Hirevate use?",
    answer:
      "Hirevate uses company career pages, public ATS job boards, public job discovery sources, and trusted hiring partners."
  },
  {
    question: "Does Hirevate scrape LinkedIn or Indeed?",
    answer:
      "No. Hirevate uses company career pages, public ATS boards, and trusted hiring sources, then sends you to the available apply source."
  },
  {
    question: "Can Hirevate auto-apply for me?",
    answer: "No. Hirevate helps you find roles and sends you to the available employer, ATS, or partner apply source."
  },
  {
    question: "What does freshness score mean?",
    answer:
      "It combines recent updates, location completeness, apply URL availability, and role relevance."
  },
  {
    question: "How does Hirevate use AI for applications?",
    answer:
      "Paid users can ask Hirevate to improve resume summaries and experience bullets or draft a job-specific cover letter. The AI is instructed to use only user-provided facts, and every suggestion should be reviewed before applying."
  },
  {
    question: "What happens when a tracked job listing closes?",
    answer:
      "Hirevate marks linked listings as closed or unavailable while preserving the application stage, notes, next actions, and history until the user archives or deletes the record."
  }
];

const discoveryLinks = [
  {
    href: "/jobs/latest",
    label: "Latest jobs",
    description: "Recently indexed roles from the public job database."
  },
  {
    href: "/jobs/remote",
    label: "Remote jobs",
    description: "Remote roles from company career pages, public ATS boards, and trusted hiring sources."
  },
  {
    href: "/jobs/software-engineer",
    label: "Software engineer jobs",
    description: "Fresh engineering and software roles with clear apply-source labels."
  },
  {
    href: "/jobs/product-manager",
    label: "Product manager jobs",
    description: "Product roles collected from company hiring pages and trusted hiring sources."
  },
  {
    href: "/jobs/data-analyst",
    label: "Data analyst jobs",
    description: "Analytics, BI, and data roles from public hiring sources."
  },
  {
    href: "/jobs/customer-success",
    label: "Customer success jobs",
    description: "Customer-facing roles from employer and ATS sources."
  }
];

const workflowLinks = [
  {
    href: "/resume-builder",
    label: "Resume builder",
    description: "Choose from six professional templates, target a role, improve content with AI, and export to PDF."
  },
  {
    href: "/cover-letter",
    label: "Cover letter builder",
    description: "Create a focused live draft or a paid AI-assisted cover letter for a specific role."
  },
  {
    href: "/pricing",
    label: "Pricing",
    description: "Compare Hirevate weekly, monthly, and annual paid plans."
  },
  {
    href: "/about",
    label: "About Hirevate",
    description: "Read product facts, source policy, pricing facts, and AI context."
  },
  {
    href: "/guides",
    label: "Job search guides",
    description: "Use practical guides for hidden jobs, freshness, resumes, and tracking."
  },
  {
    href: "/compare",
    label: "Compare Hirevate",
    description: "Read fact-checked comparisons with LinkedIn and Indeed."
  }
];



const homeOfferItems = publicPricingPlans.flatMap((plan) =>
  plan.options.map((option) => ({
    "@type": "Offer",
    name: option.schemaName,
    price: option.priceValue,
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: absoluteUrl("/pricing"),
    category: plan.name
  }))
);

export const revalidate = 3600;

export default async function LandingPage() {
  const featuredJobs = await getFeaturedJobs(12);
  const trackedCompanyItems = getTrackedCompanyItems(featuredJobs);
  const companySliderItems = [...trackedCompanyItems, ...trackedCompanyItems];

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: siteName,
            url: absoluteUrl("/"),
            applicationCategory: "BusinessApplication",
            applicationSubCategory: "Job search and career management",
            operatingSystem: "Web",
            description: defaultDescription,
            featureList: features.map((feature) => `${feature.title}: ${feature.description}`),
            audience: {
              "@type": "Audience",
              audienceType: "Job seekers"
            },
            offers: {
              "@type": "OfferCatalog",
              name: "Hirevate plans",
              itemListElement: homeOfferItems
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: homeFaqItems.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer
              }
            }))
          }
        ]}
      />
      <section className="border-b border-gray-100 bg-white">
        <div className="container-shell grid min-h-[calc(100svh-64px)] items-center gap-12 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:py-20">
          <div className="w-[calc(100vw-32px)] min-w-0 max-w-[358px] sm:w-full sm:max-w-none">
            <h1 className="max-w-[358px] text-4xl font-semibold leading-[1.04] tracking-normal text-ink-900 sm:max-w-4xl sm:text-5xl md:text-6xl">
              Find hidden jobs and turn them into stronger applications
            </h1>
            <p className="mt-6 max-w-[358px] break-words text-base leading-8 text-ink-500 sm:text-lg md:max-w-2xl">
              Discover fresh roles from company career pages, public ATS boards, and trusted hiring sources. Then tailor your resume, write a focused cover letter, and manage every next step.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild href="/jobs#results" size="lg">
                Find fresh jobs
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button asChild href="/resume-builder" size="lg" variant="outline">
                Build my resume
              </Button>
            </div>
          </div>
          <HeroProductPreview jobs={featuredJobs.slice(0, 3)} />
        </div>
      </section>

      <section className="border-b border-gray-100 bg-white py-8">
        <div className="container-shell">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold text-ink-900">Companies in current listings</p>
                <p className="mt-1 text-sm leading-6 text-ink-500">
                  Company logos are drawn from jobs currently returned by the Hirevate index.
                </p>
              </div>
              <p className="text-xs font-semibold uppercase tracking-normal text-brand-600">
                Live company jobs
              </p>
            </div>
            {companySliderItems.length > 0 ? (
              <div className="source-slider-mask mt-5">
                <div className="source-slider-track flex gap-3">
                  {companySliderItems.map((company, index) => (
                    <div
                      className="flex h-16 min-w-[190px] items-center gap-3 rounded-md border border-gray-200 bg-white px-4 shadow-sm"
                      key={`${company.name}-${index}`}
                    >
                      <CompanyLogo companyName={company.name} website={company.website} />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-ink-900">
                          {company.name}
                        </span>
                        <span className="block truncate text-xs text-ink-500">
                          {company.description}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="mt-5 rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-ink-500">
                Current company listings will appear after the next successful job index refresh.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="below-fold-section bg-gray-50 py-16">
        <div className="container-shell grid gap-8 lg:grid-cols-2">
          <Card className="p-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-red-100 bg-red-50 text-red-600">
              <XCircle className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-ink-900">
              What crowded boards usually miss
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-ink-500">
              {[
                "Fresh roles before they become heavily promoted everywhere.",
                "Clear freshness signals instead of recycled listings.",
                "Cleaner apply paths without social-feed noise.",
                "Resume, cover letter, and application planning connected to the search."
              ].map((item) => (
                <li className="flex gap-3" key={item}>
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-emerald-100 bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-ink-900">
              What Hirevate gives you instead
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-ink-500">
              {[
                "Company career pages, public ATS boards, and trusted hiring sources.",
                "Search filters for role, company, location, work mode, and freshness.",
                "Neutral apply buttons that send users to the available hiring source.",
                "AI-assisted application writing and a lifecycle tracker with next actions."
              ].map((item) => (
                <li className="flex gap-3" key={item}>
                  <span className="mt-0.5 text-emerald-600">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      <section className="below-fold-section border-y border-gray-100 bg-white py-16">
        <div className="container-shell">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase text-brand-700">One connected workflow</p>
            <h2 className="mt-3 text-3xl font-semibold text-ink-900">From fresh job to final decision</h2>
            <p className="mt-3 text-base leading-7 text-ink-500">
              Hirevate connects discovery, application writing, and follow-up planning without auto-applying on your behalf.
            </p>
          </div>
          <div className="mt-9 grid border-y border-gray-200 md:grid-cols-3">
            <div className="py-7 md:pr-7">
              <span className="text-sm font-semibold text-brand-700">01</span>
              <h3 className="mt-3 text-xl font-semibold text-ink-900">Find a current role</h3>
              <p className="mt-2 text-sm leading-6 text-ink-500">Search latest, remote, and category pages with source and freshness context.</p>
              <Link className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700" href="/jobs/latest">Explore latest jobs <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
            <div className="border-t border-gray-200 py-7 md:border-l md:border-t-0 md:px-7">
              <span className="text-sm font-semibold text-brand-700">02</span>
              <h3 className="mt-3 text-xl font-semibold text-ink-900">Tailor the application</h3>
              <p className="mt-2 text-sm leading-6 text-ink-500">Use professional resume templates, role targeting, and reviewable AI writing.</p>
              <Link className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700" href="/resume-builder">Open resume builder <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
            <div className="border-t border-gray-200 py-7 md:border-l md:border-t-0 md:pl-7">
              <span className="text-sm font-semibold text-brand-700">03</span>
              <h3 className="mt-3 text-xl font-semibold text-ink-900">Run the follow-up plan</h3>
              <p className="mt-2 text-sm leading-6 text-ink-500">Track stages, priorities, next actions, listing health, interviews, and outcomes.</p>
              <Link className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700" href="/pricing">Compare full-access plans <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="below-fold-section bg-white py-16">
        <div className="container-shell">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold text-ink-900">Built for focused job discovery</h2>
            <p className="mt-3 text-base leading-7 text-ink-500">
              Search by title, location, remote preference, and freshness without adding noisy
              application tools.
            </p>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card className="p-5" key={feature.title}>
                <feature.icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
                <h3 className="mt-5 text-lg font-semibold text-ink-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="below-fold-section border-y border-gray-100 bg-gray-50 py-16">
        <div className="container-shell">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold text-ink-900">Explore fresh job paths</h2>
            <p className="mt-3 text-base leading-7 text-ink-500">
              Start with the public pages crawlers can understand: latest roles, remote roles, and
              focused category searches.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {discoveryLinks.map((item) => (
              <Link
                className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-brand-200 hover:shadow-soft"
                href={item.href}
                key={item.href}
              >
                <h3 className="font-semibold text-ink-900">{item.label}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">{item.description}</p>
              </Link>
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {workflowLinks.map((item) => (
              <Link
                className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-brand-200 hover:shadow-soft"
                href={item.href}
                key={item.href}
              >
                <h3 className="font-semibold text-ink-900">{item.label}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="below-fold-section bg-white py-16">
        <div className="container-shell grid items-center gap-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <h2 className="text-3xl font-semibold text-ink-900">Simple pricing for serious search</h2>
            <p className="mt-3 text-base leading-7 text-ink-500">
              Choose weekly, monthly, or annual access for the complete job feed and career workflow tools.
            </p>
            <Button asChild href="/pricing" className="mt-6" variant="secondary">
              View pricing
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {publicPricingPlans.map((plan) => (
              <Card
                className={
                  plan.highlighted
                    ? "border-black bg-black p-5 text-white"
                    : "border-gray-200 bg-white p-5 text-ink-900"
                }
                key={plan.key}
              >
                <h3 className="font-semibold">{plan.name}</h3>
                <p className="mt-5 text-3xl font-semibold">{plan.homepagePrice}</p>
                <p className={plan.highlighted ? "mt-2 text-sm text-gray-300" : "mt-2 text-sm text-ink-500"}>
                  {plan.homepageDetail}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="below-fold-section bg-white py-16">
        <div className="container-shell max-w-3xl">
          <h2 className="text-3xl font-semibold text-ink-900">FAQ</h2>
          <div className="mt-6 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
            {homeFaqItems.map((item) => (
              <div className="p-5" key={item.question}>
                <h3 className="font-semibold text-ink-900">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function getTrackedCompanyItems(jobs: JobWithCompany[]) {
  const items = new Map<string, { description: string; name: string; website: string | null }>();

  for (const job of jobs) {
    const name = job.companies?.name?.trim();
    if (!name || items.has(name.toLowerCase())) continue;

    items.set(name.toLowerCase(), {
      description: job.title,
      name,
      website: job.companies?.website ?? null
    });
  }

  return [...items.values()].slice(0, 10);
}

function HeroProductPreview({ jobs }: { jobs: JobWithCompany[] }) {
  const previewJobs =
    jobs.length > 0
      ? jobs.map((job) => ({
          title: job.title,
          company: job.companies?.name ?? "Company",
          location: job.location ?? "Location not listed",
          score: job.freshness_score,
          href: getJobPath(job)
        }))
      : emptyPreviewJobs;

  return (
    <div className="w-[calc(100vw-32px)] min-w-0 max-w-[358px] overflow-hidden rounded-lg border border-gray-200 bg-white p-3 shadow-soft sm:w-full sm:max-w-full">
      <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
        <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900">Hidden jobs feed</p>
            <p className="mt-1 text-xs text-ink-500">Public sources - sorted by freshness</p>
          </div>
          <Badge tone="green">Fresh Verified</Badge>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
          <div className="flex h-11 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm text-ink-500">
            <Search className="h-4 w-4" aria-hidden="true" />
            Backend engineer
          </div>
          <Button asChild href="/jobs#results" className="w-full sm:w-auto">
            Search
          </Button>
        </div>
      </div>
      <div className="mt-3 space-y-3">
        {previewJobs.map((job) => (
          <div
            className="rounded-md border border-gray-100 bg-white p-4 shadow-sm"
            key={`${job.company}-${job.title}`}
          >
            <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:justify-between">
              <div className="min-w-0">
                <Link href={job.href} className="font-semibold text-ink-900 hover:text-brand-600">
                  {job.title}
                </Link>
                <p className="mt-1 text-sm text-ink-500">
                  {job.company} - {job.location}
                </p>
              </div>
              {job.score === null ? null : <Badge tone="green">Score {job.score}</Badge>}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-start gap-3 sm:justify-between">
              <Badge tone="blue">Verified source</Badge>
              <Link href={job.href} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                Apply now
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
