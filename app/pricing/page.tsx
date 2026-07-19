import type { Metadata } from "next";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { JsonLd } from "@/components/seo/json-ld";
import { pricingSummary, publicPricingPlans } from "@/lib/pricing";
import { absoluteUrl, defaultOgImagePath } from "@/lib/seo";

const pricingDescription =
  "Compare Hirevate paid plans for fresh job discovery, six professional resume templates, AI writing, resume matching, and lifecycle tracking.";

const pricingFaqItems = [
  {
    question: "Which Hirevate plan is best for an active job search?",
    answer:
      "Every paid plan includes the same Hirevate features. Choose Daily for the lowest commitment, Weekly for a short sprint, Monthly for an active search cycle, or Annual for the lowest equivalent weekly price."
  },
  {
    question: "What are the current Hirevate prices?",
    answer: pricingSummary
  },
  {
    question: "Can I preview jobs before subscribing?",
    answer:
      "Yes. Public job pages provide a limited discovery preview. A paid subscription is required for the complete job feed and Apply now links."
  },
  {
    question: "Do paid plans include resume and cover letter tools?",
    answer:
      "Yes. All paid plans include six professional resume templates, PDF export, AI-assisted resume and cover-letter writing, resume matching, and the application tracker."
  },
  {
    question: "How do I cancel a Hirevate subscription?",
    answer:
      "Sign in, open Dashboard, choose Manage billing, and confirm cancellation. Renewal stops and paid access continues until the end of the current billing period."
  }
];

const pricingOffers = publicPricingPlans.flatMap((plan) =>
  plan.options.map((option) => ({
    "@type": "Offer",
    name: option.schemaName,
    price: option.priceValue,
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: absoluteUrl("/pricing"),
    category: plan.name,
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: option.priceValue,
      priceCurrency: "USD",
      unitText: option.interval
    }
  }))
);

const pricingInternalLinks = [
  { href: "/jobs?sort=newest", label: "Latest jobs", requiresAccount: true },
  { href: "/jobs?workMode=remote", label: "Remote jobs", requiresAccount: true },
  { href: "/jobs?keyword=software%20engineer", label: "Software engineer jobs", requiresAccount: true },
  { href: "/jobs?keyword=product%20manager", label: "Product manager jobs", requiresAccount: true },
  { href: "/jobs?keyword=data%20analyst", label: "Data analyst jobs", requiresAccount: true },
  { href: "/jobs?keyword=customer%20success", label: "Customer success jobs", requiresAccount: true },
  { href: "/resume-builder", label: "Preview resume templates", requiresAccount: false },
  { href: "/cover-letter", label: "Cover letter builder", requiresAccount: true },
  { href: "/legal/subscription-terms", label: "Subscription terms", requiresAccount: false },
  { href: "/legal/eu-withdrawal-refund-policy", label: "EU refund policy", requiresAccount: false }
];

function getAccountAccessHref(path: string) {
  return `/signup?redirect=${encodeURIComponent(path)}`;
}

export const metadata: Metadata = {
  title: "Pricing",
  description: pricingDescription,
  alternates: {
    canonical: "/pricing"
  },
  openGraph: {
    title: "Pricing",
    description: pricingDescription,
    url: "/pricing",
    images: [defaultOgImagePath]
  },
  twitter: {
    title: "Pricing",
    description: pricingDescription,
    card: "summary_large_image",
    images: [defaultOgImagePath]
  }
};

export default function PricingPage() {
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Hirevate",
            url: absoluteUrl("/pricing"),
            image: absoluteUrl(defaultOgImagePath),
            description: pricingDescription,
            brand: {
              "@type": "Brand",
              name: "Hirevate"
            },
            offers: pricingOffers
          },
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Hirevate",
            url: absoluteUrl("/pricing"),
            applicationCategory: "BusinessApplication",
            applicationSubCategory: "Job search and career management",
            operatingSystem: "Web",
            image: absoluteUrl(defaultOgImagePath),
            description: pricingDescription,
            offers: {
              "@type": "OfferCatalog",
              name: "Hirevate subscriptions",
              itemListElement: pricingOffers
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: pricingFaqItems.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: {
                "@type": "Answer",
                text: item.answer
              }
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
                name: "Pricing",
                item: absoluteUrl("/pricing")
              }
            ]
          }
        ]}
      />
      <section className="bg-gray-50 py-12" id="plans">
        <div className="container-shell">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold text-ink-900">Pricing</h1>
            <p className="mt-3 text-base leading-7 text-ink-500">
              Choose daily access for the lowest commitment, weekly access for a short sprint,
              monthly access for a complete search cycle, or annual access for the lowest
              equivalent weekly price.
            </p>
          </div>
          <div className="mt-8">
            <PricingCards />
          </div>
        </div>
      </section>
      <section className="border-t border-gray-100 bg-white py-10">
        <div className="container-shell">
          <h2 className="text-2xl font-semibold text-ink-900">What each plan connects to</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-500">
            Public job pages can be previewed for discovery. Opening plan access from this page
            requires an account, and a paid plan unlocks the complete job feed and Apply now links.
            All four paid plans unlock the same job, resume, cover-letter, matching, and tracking
            features. Choose a plan based on how long you want access.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {pricingInternalLinks.map((item) => (
              <Link
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-200 hover:text-brand-700"
                href={item.requiresAccount ? getAccountAccessHref(item.href) : item.href}
                key={item.href}
              >
                {item.requiresAccount ? (
                  <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                ) : null}
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="border-t border-gray-100 bg-white py-12">
        <div className="container-shell max-w-3xl">
          <h2 className="text-3xl font-semibold text-ink-900">Pricing FAQ</h2>
          <div className="mt-6 divide-y divide-gray-100 rounded-lg border border-gray-200">
            {pricingFaqItems.map((item) => (
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
