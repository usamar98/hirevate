import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  FileInput,
  Filter,
  Link2,
  ListChecks,
  Sparkles,
  XCircle
} from "lucide-react";
import { HeroFeaturePreview } from "@/components/marketing/hero-feature-preview";
import { HomeDiscoveryLinks } from "@/components/marketing/home-discovery-links";
import { JobResumeWalkthrough } from "@/components/marketing/job-resume-walkthrough";
import { ProductShowcase } from "@/components/marketing/product-showcase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JsonLd } from "@/components/seo/json-ld";
import { getJobCompensationLabel } from "@/lib/jobs/compensation";
import { getActiveJobsCount, getFeaturedJobs } from "@/lib/jobs/queries";
import { getJobPath } from "@/lib/jobs/seo";
import { getJobSourceTrust } from "@/lib/jobs/sources";
import { getLandingCopy } from "@/lib/i18n/content";
import { languageLocales, type SupportedLanguage } from "@/lib/i18n/config";
import { resolveLanguagePreference } from "@/lib/i18n/server";
import { publicPricingPlans, startTrialHref } from "@/lib/pricing";
import {
  absoluteUrl,
  defaultDescription,
  defaultOgImagePath,
  defaultTitle,
  siteName
} from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: defaultTitle },
  description: defaultDescription,
  alternates: {
    canonical: "/"
  },
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    url: "/",
    images: [defaultOgImagePath]
  },
  twitter: {
    title: defaultTitle,
    description: defaultDescription,
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
  },
  {
    title: "Resume from job link",
    description: "Paste a readable job URL or description, choose a professional template, and generate an editable role-targeted resume using only your facts.",
    icon: FileInput
  }
];

const emptyPreviewJobs = [
  {
    title: "Fresh jobs are being indexed",
    company: "Hirevate public job index",
    location: "Browse the latest available roles",
    score: null,
    href: "/jobs/latest",
    compensation: null,
    sourceLabel: "Verified source",
    website: null
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
      "Paid users can generate a tailored resume from a readable job link or pasted description, improve resume content, or draft a job-specific cover letter. Resume generation requires a template choice, uses the user's supplied facts, and keeps every result editable for review."
  },
  {
    question: "Can Hirevate generate a complete resume from a job link?",
    answer:
      "Yes. Hirevate analyzes many public job-posting links or pasted descriptions, identifies responsibilities and ATS keywords, asks you to choose one of six professional templates, and creates an editable role-targeted resume from your existing career facts."
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
    description: "Compare Hirevate monthly and annual paid plans."
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

const trialCopy: Record<SupportedLanguage, { cta: string; detail: string }> = {
  en: {
    cta: "Start a 3-day free trial",
    detail: "— no card required and no automatic charge."
  },
  de: {
    cta: "3-tägige kostenlose Testphase starten",
    detail: "— keine Karte erforderlich und keine automatische Abbuchung."
  },
  sv: {
    cta: "Starta en kostnadsfri provperiod på 3 dagar",
    detail: "— inget kort krävs och ingen automatisk debitering."
  },
  es: {
    cta: "Inicia una prueba gratuita de 3 días",
    detail: "— sin tarjeta y sin cargos automáticos."
  }
};

export const revalidate = 3600;

export default async function LandingPage() {
  const { language } = await resolveLanguagePreference();
  const copy = getLandingCopy(language);
  const [featuredJobs, activeJobsCount] = await Promise.all([
    getFeaturedJobs(5),
    getActiveJobsCount()
  ]);
  const heroTitle = activeJobsCount > 0
    ? copy.hero.countedTitle.replace(
        "{count}",
        new Intl.NumberFormat(languageLocales[language]).format(activeJobsCount)
      )
    : copy.hero.title;
  const localizedEmptyPreviewJobs =
    language === "en"
      ? emptyPreviewJobs
      : [
          {
            title: copy.preview.emptyTitle,
            company: copy.preview.emptyCompany,
            location: copy.preview.emptyLocation,
            score: null,
            href: "/jobs/latest",
            compensation: null,
            sourceLabel: copy.preview.verifiedSource,
            website: null
          }
        ];
  const heroPreviewJobs =
    featuredJobs.length > 0
      ? featuredJobs.map((job) => ({
          title: job.title,
          company: job.companies?.name ?? copy.preview.companyFallback,
          location: job.location ?? copy.preview.locationFallback,
          score: job.freshness_score,
          href: getJobPath(job),
          compensation: getJobCompensationLabel(job),
          sourceLabel: getJobSourceTrust(job).label,
          website: job.companies?.website ?? null
        }))
      : localizedEmptyPreviewJobs;
  const localizedFeatures =
    language === "en"
      ? features
      : copy.features.map((feature, index) => ({ ...feature, icon: features[index].icon }));
  const localizedFaqItems = language === "en" ? homeFaqItems : copy.faqItems;
  const localizedDiscoveryLinks =
    language === "en"
      ? discoveryLinks
      : copy.discoveryLinks.map((item, index) => ({ ...item, href: discoveryLinks[index].href }));
  const localizedWorkflowLinks =
    language === "en"
      ? workflowLinks
      : copy.workflowLinks.map((item, index) => ({ ...item, href: workflowLinks[index].href }));

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": absoluteUrl("/#webpage"),
            url: absoluteUrl("/"),
            name: defaultTitle,
            description: defaultDescription,
            isPartOf: {
              "@id": absoluteUrl("/#website")
            },
            about: {
              "@id": absoluteUrl("/#software-application")
            },
            primaryImageOfPage: absoluteUrl(defaultOgImagePath),
            inLanguage: languageLocales[language]
          },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "@id": absoluteUrl("/#software-application"),
            name: siteName,
            url: absoluteUrl("/"),
            applicationCategory: "BusinessApplication",
            applicationSubCategory: "Job search and career management",
            operatingSystem: "Web",
            description: copy.landingDescription,
            featureList: localizedFeatures.map((feature) => `${feature.title}: ${feature.description}`),
            audience: {
              "@type": "Audience",
              audienceType: "Job seekers"
            },
            offers: homeOfferItems
          },
        ]}
      />
      <section className="border-b border-gray-100 bg-white">
        <div className="container-shell grid min-h-[calc(100svh-64px)] items-center gap-10 py-10 sm:py-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-12 lg:py-20">
          <div className="w-[calc(100vw-32px)] min-w-0 max-w-[358px] sm:w-full sm:max-w-none">
            <h1 className="max-w-[358px] text-[2rem] font-semibold leading-[1.08] tracking-normal text-ink-900 sm:max-w-4xl sm:text-5xl sm:leading-[1.04] md:text-6xl">
              {heroTitle}
            </h1>
            <p className="mt-5 max-w-[358px] break-words text-base leading-7 text-ink-500 sm:mt-6 sm:text-lg sm:leading-8 md:max-w-2xl">
              {copy.hero.description}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
              <Button asChild href="/jobs#results" size="lg">
                {copy.hero.jobsCta}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button asChild href="/resume-builder" size="lg" variant="outline">
                {copy.hero.resumeCta}
              </Button>
            </div>
            <p className="mt-4 text-sm font-semibold text-brand-700">
              <Link className="inline-flex min-h-11 items-center" href={startTrialHref}>
                {trialCopy[language].cta}
              </Link>
              <span className="font-medium text-ink-500">
                {" "}
                {trialCopy[language].detail}
              </span>
            </p>
          </div>
          <HeroFeaturePreview
            copy={copy.preview}
            jobs={heroPreviewJobs}
            labels={{
              jobs: copy.preview.title,
              resume: copy.workflowLinks[0].label,
              coverLetter: copy.workflowLinks[1].label,
              tracker: copy.features[5].title
            }}
          />
        </div>
      </section>

      <HomeDiscoveryLinks language={language} />

      <JobResumeWalkthrough />

      <ProductShowcase language={language} />

      <section className="below-fold-section bg-gray-50 py-16">
        <div className="container-shell grid gap-8 lg:grid-cols-2">
          <Card className="p-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-md border border-red-100 bg-red-50 text-red-600">
              <XCircle className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-ink-900">
              {copy.comparison.crowdedTitle}
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-ink-500">
              {copy.comparison.crowdedItems.map((item) => (
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
              {copy.comparison.hirevateTitle}
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-ink-500">
              {copy.comparison.hirevateItems.map((item) => (
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
            <p className="text-sm font-semibold uppercase text-brand-700">{copy.workflow.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-semibold text-ink-900">{copy.workflow.title}</h2>
            <p className="mt-3 text-base leading-7 text-ink-500">
              {copy.workflow.description}
            </p>
          </div>
          <div className="mt-9 grid border-y border-gray-200 md:grid-cols-3">
            <div className="py-7 md:pr-7">
              <span className="text-sm font-semibold text-brand-700">01</span>
              <h3 className="mt-3 text-xl font-semibold text-ink-900">{copy.workflow.steps[0].title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-500">{copy.workflow.steps[0].description}</p>
              <Link className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700" href="/jobs/latest">{copy.workflow.steps[0].cta} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
            <div className="border-t border-gray-200 py-7 md:border-l md:border-t-0 md:px-7">
              <span className="text-sm font-semibold text-brand-700">02</span>
              <h3 className="mt-3 text-xl font-semibold text-ink-900">{copy.workflow.steps[1].title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-500">{copy.workflow.steps[1].description}</p>
              <Link className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700" href="/resume-builder">{copy.workflow.steps[1].cta} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
            <div className="border-t border-gray-200 py-7 md:border-l md:border-t-0 md:pl-7">
              <span className="text-sm font-semibold text-brand-700">03</span>
              <h3 className="mt-3 text-xl font-semibold text-ink-900">{copy.workflow.steps[2].title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-500">{copy.workflow.steps[2].description}</p>
              <Link className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700" href="/pricing">{copy.workflow.steps[2].cta} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="below-fold-section bg-white py-16">
        <div className="container-shell">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold text-ink-900">{copy.featuresTitle}</h2>
            <p className="mt-3 text-base leading-7 text-ink-500">
              {copy.featuresDescription}
            </p>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {localizedFeatures.map((feature) => (
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
            <h2 className="text-3xl font-semibold text-ink-900">{copy.explore.title}</h2>
            <p className="mt-3 text-base leading-7 text-ink-500">
              {copy.explore.description}
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {localizedDiscoveryLinks.map((item) => (
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
            {localizedWorkflowLinks.map((item) => (
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
            <h2 className="text-3xl font-semibold text-ink-900">{copy.pricing.title}</h2>
            <p className="mt-3 text-base leading-7 text-ink-500">
              {copy.pricing.description}
            </p>
            <Button asChild href="/pricing" className="mt-6" variant="secondary">
              {copy.pricing.cta}
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {publicPricingPlans.map((plan) => (
              <Card
                className={
                  plan.highlighted
                    ? "border-black bg-black p-5 text-white"
                    : "border-gray-200 bg-white p-5 text-ink-900"
                }
                key={plan.key}
              >
                <h3 className="font-semibold">{copy.pricing.plans[plan.key].name}</h3>
                <p className="mt-5 text-3xl font-semibold">{plan.homepagePrice}</p>
                <p className={plan.highlighted ? "mt-2 text-sm text-gray-300" : "mt-2 text-sm text-ink-500"}>
                  {copy.pricing.plans[plan.key].detail}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="below-fold-section bg-white py-16">
        <div className="container-shell max-w-3xl">
          <h2 className="text-3xl font-semibold text-ink-900">{copy.faqTitle}</h2>
          <div className="mt-6 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
            {localizedFaqItems.map((item) => (
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
