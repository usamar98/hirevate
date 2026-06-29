import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Clock3,
  Filter,
  Link2,
  Search
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/seo/json-ld";
import { getFeaturedJobs } from "@/lib/jobs/queries";
import { getJobPath } from "@/lib/jobs/seo";
import { publicPricingPlans } from "@/lib/pricing";
import { absoluteUrl, defaultDescription, siteName } from "@/lib/seo";
import type { JobWithCompany } from "@/types/database";

const landingDescription =
  "Hirevate helps job seekers find fresh direct-apply jobs from official hiring sources, build targeted resumes, and measure which applications convert.";

export const metadata: Metadata = {
  description: landingDescription,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: siteName,
    description: landingDescription,
    url: "/"
  },
  twitter: {
    title: siteName,
    description: landingDescription
  }
};

const features = [
  {
    title: "Fresh jobs",
    description: "Scan active company career pages and surface recently updated professional roles.",
    icon: Clock3
  },
  {
    title: "Direct apply links",
    description: "Open the official company job page instead of another crowded aggregator.",
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
  }
];

const fallbackPreviewJobs = [
  {
    title: "Senior Frontend Engineer",
    company: "Figma",
    location: "Remote",
    score: 96,
    href: "/jobs"
  },
  {
    title: "AI Product Engineer",
    company: "Notion",
    location: "San Francisco",
    score: 91,
    href: "/jobs"
  },
  {
    title: "Data Platform Engineer",
    company: "Ramp",
    location: "New York",
    score: 84,
    href: "/jobs"
  }
];

const homeFaqItems = [
  {
    question: "What is Hirevate?",
    answer:
      "Hirevate is a web SaaS for finding fresh direct-apply jobs from official hiring sources, then using resume, cover letter, saved job, and tracker tools around those roles."
  },
  {
    question: "Who is Hirevate for?",
    answer:
      "Hirevate is for job seekers who want professional roles from cleaner hiring sources, including remote, engineering, product, data, customer success, sales, marketing, operations, and business roles."
  },
  {
    question: "What sources does Hirevate use?",
    answer:
      "Hirevate uses company career pages, public ATS job boards, and trusted job APIs such as Greenhouse, Lever, Adzuna, and Google Jobs via SerpApi."
  },
  {
    question: "Does Hirevate scrape LinkedIn or Indeed?",
    answer:
      "No. Hirevate uses official and public hiring sources, then sends you to the original apply page."
  },
  {
    question: "Can Hirevate auto-apply for me?",
    answer: "No. Hirevate helps you find direct-apply roles and sends you to the official apply page."
  },
  {
    question: "What does freshness score mean?",
    answer:
      "It combines recent updates, location completeness, apply URL availability, and role relevance."
  }
];

const discoveryLinks = [
  {
    href: "/jobs/latest",
    label: "Latest jobs",
    description: "Recently indexed direct-apply roles from the public job database."
  },
  {
    href: "/jobs/remote",
    label: "Remote jobs",
    description: "Remote roles from official hiring sources and public ATS boards."
  },
  {
    href: "/jobs/software-engineer",
    label: "Software engineer jobs",
    description: "Fresh engineering and software roles with direct apply links."
  },
  {
    href: "/jobs/product-manager",
    label: "Product manager jobs",
    description: "Product roles collected from company hiring pages and job APIs."
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
    description: "Build a role-targeted resume with ATS checks and export."
  },
  {
    href: "/cover-letter",
    label: "Cover letter builder",
    description: "Create a targeted cover letter for a specific company and role."
  },
  {
    href: "/pricing",
    label: "Pricing",
    description: "Compare Silver, Gold, and Platinum weekly and monthly options."
  },
  {
    href: "/about",
    label: "About Hirevate",
    description: "Read product facts, source policy, pricing facts, and AI context."
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

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const featuredJobs = await getFeaturedJobs(3);

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
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
              itemListElement: [
                {
                  "@type": "Offer",
                  name: "Free job search preview",
                  price: "0",
                  priceCurrency: "USD",
                  url: absoluteUrl("/signup")
                },
                ...homeOfferItems
              ]
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
              Find hidden career opportunities before they get crowded
            </h1>
            <p className="mt-6 max-w-[358px] break-words text-base leading-8 text-ink-500 sm:text-lg md:max-w-2xl">
              Hirevate scans company career pages and finds fresh direct-apply roles from official
              hiring sources.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild href="/jobs" size="lg">
                Browse Hidden Jobs
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button asChild href="/signup" size="lg" variant="outline">
                Start Free
              </Button>
            </div>
          </div>
          <HeroProductPreview jobs={featuredJobs} />
        </div>
      </section>

      <section className="below-fold-section bg-gray-50 py-16">
        <div className="container-shell grid gap-8 lg:grid-cols-2">
          <Card className="p-7">
            <h2 className="text-2xl font-semibold text-ink-900">
              LinkedIn and Indeed jobs are crowded
            </h2>
            <p className="mt-4 text-base leading-7 text-ink-500">
              Public job boards are where everyone goes first. By the time a strong role is heavily
              promoted, it can already have hundreds of applicants.
            </p>
          </Card>
          <Card className="p-7">
            <h2 className="text-2xl font-semibold text-ink-900">
              Direct company career page jobs
            </h2>
            <p className="mt-4 text-base leading-7 text-ink-500">
              Hirevate focuses on clean hiring sources, normalized into searchable direct-apply job
              cards.
            </p>
          </Card>
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
          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
        <div className="container-shell grid items-center gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <h2 className="text-3xl font-semibold text-ink-900">Simple pricing for serious search</h2>
            <p className="mt-3 text-base leading-7 text-ink-500">
              Start free, then unlock unlimited views and saved jobs when the search gets active.
            </p>
            <Button asChild href="/pricing" className="mt-6" variant="secondary">
              View pricing
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {publicPricingPlans.map((plan) => (
              <Card className="p-5" key={plan.key}>
                <h3 className="font-semibold text-ink-900">{plan.name}</h3>
                <p className="mt-5 text-3xl font-semibold text-ink-900">{plan.homepagePrice}</p>
                <p className="mt-2 text-sm text-ink-500">{plan.homepageDetail}</p>
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
      : fallbackPreviewJobs;

  return (
    <div className="w-[calc(100vw-32px)] min-w-0 max-w-[358px] overflow-hidden rounded-lg border border-gray-200 bg-white p-3 shadow-soft sm:w-full sm:max-w-full">
      <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
        <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900">Hidden jobs feed</p>
            <p className="mt-1 text-xs text-ink-500">Official sources - sorted by freshness</p>
          </div>
          <Badge tone="green">Fresh Verified</Badge>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
          <div className="flex h-11 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm text-ink-500">
            <Search className="h-4 w-4" aria-hidden="true" />
            Backend engineer
          </div>
          <Button asChild href="/jobs" className="w-full sm:w-auto">
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
              <Badge tone="green">Score {job.score}</Badge>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-start gap-3 sm:justify-between">
              <Badge tone="blue">Direct apply</Badge>
              <Link href={job.href} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                Direct apply
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
