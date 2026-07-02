import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Filter,
  Globe2,
  Link2,
  Search,
  ShieldCheck,
  XCircle
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
  "Hirevate helps job seekers find fresh jobs from company career pages, public ATS boards, and trusted hiring sources, then build targeted resumes and track applications.";

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
      "Hirevate is a web SaaS for finding fresh roles from company career pages, public ATS boards, and trusted hiring sources, then using resume, cover letter, saved job, and tracker tools around those roles."
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

const trackedSourceLogos = [
  {
    name: "Google Jobs",
    description: "Public job discovery",
    iconFrameClass: "border-blue-100 bg-blue-50",
    logo: <GoogleSourceIcon />
  },
  {
    name: "Greenhouse",
    description: "Employer ATS boards",
    iconFrameClass: "border-emerald-100 bg-emerald-50",
    logo: <GreenhouseSourceIcon />
  },
  {
    name: "Lever",
    description: "Employer ATS boards",
    iconFrameClass: "border-sky-100 bg-sky-50",
    logo: <LeverSourceIcon />
  },
  {
    name: "Hiring partners",
    description: "Hiring partner",
    iconFrameClass: "border-gray-200 bg-gray-50",
    logo: <PartnerSourceIcon />
  },
  {
    name: "Career pages",
    description: "Company websites",
    iconFrameClass: "border-indigo-100 bg-indigo-50 text-indigo-700",
    logo: <Globe2 className="h-5 w-5" aria-hidden="true" />
  },
  {
    name: "Public ATS",
    description: "Open hiring boards",
    iconFrameClass: "border-amber-100 bg-amber-50 text-amber-700",
    logo: <ShieldCheck className="h-5 w-5" aria-hidden="true" />
  }
];

const sourceSliderItems = [...trackedSourceLogos, ...trackedSourceLogos];

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
              Hirevate scans company career pages, public ATS boards, and trusted hiring sources for
              fresh roles.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild href="/jobs#results" size="lg">
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

      <section className="border-b border-gray-100 bg-white py-8">
        <div className="container-shell">
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold text-ink-900">From companies we track Jobs</p>
                <p className="mt-1 text-sm leading-6 text-ink-500">
                  Company career pages, public ATS boards, and trusted hiring sources in one fresh
                  job index.
                </p>
              </div>
              <p className="text-xs font-semibold uppercase tracking-normal text-brand-600">
                Source-aware job discovery
              </p>
            </div>
            <div className="source-slider-mask mt-5">
              <div className="source-slider-track flex gap-3">
                {sourceSliderItems.map((source, index) => (
                  <div
                    className="flex h-16 min-w-[190px] items-center gap-3 rounded-md border border-gray-200 bg-white px-4 shadow-sm"
                    key={`${source.name}-${index}`}
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md border ${source.iconFrameClass}`}
                    >
                      {source.logo}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink-900">
                        {source.name}
                      </span>
                      <span className="block truncate text-xs text-ink-500">
                        {source.description}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
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
                "Resume, cover letter, and tracker tools connected to the search."
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
                "A focused workflow for saving, preparing, and tracking applications."
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

function GoogleSourceIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.1A6.62 6.62 0 0 1 5.5 12c0-.73.12-1.43.34-2.1V7.06H2.18A10.99 10.99 0 0 0 1 12c0 1.77.42 3.44 1.18 4.94l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.37c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A10.99 10.99 0 0 0 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.37 12 5.37Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GreenhouseSourceIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24">
      <path
        d="M4 11.2 12 4l8 7.2v8.3a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5v-8.3Z"
        fill="#0B7A3B"
      />
      <path d="M8.2 20.9v-6.1h7.6v6.1" fill="#D1FAE5" />
      <path d="M8.6 10.4c3.6-.2 6-2.1 7.1-5.6 2 4.5-.1 8.4-4.2 8.4-1.1 0-2.1-.4-2.9-1.2Z" fill="#34D399" />
    </svg>
  );
}

function LeverSourceIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24">
      <path d="M5 4h5v12h9v4H5V4Z" fill="#2563EB" />
      <path d="M12 4h7v4h-7V4Z" fill="#38BDF8" />
      <path d="M12 10h6v4h-6v-4Z" fill="#1D4ED8" />
    </svg>
  );
}

function PartnerSourceIcon() {
  return (
    <svg aria-hidden="true" className="h-6 w-6" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#2F3437" />
      <path
        d="M7 8.5 12 5l5 3.5v7l-5 3.5-5-3.5v-7Z"
        fill="#FFFFFF"
      />
      <path d="M9.2 12 12 10.1l2.8 1.9-2.8 1.9L9.2 12Z" fill="#FF7A1A" />
    </svg>
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
              <Badge tone="green">Score {job.score}</Badge>
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
