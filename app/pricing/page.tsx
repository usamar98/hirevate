import type { Metadata } from "next";
import Link from "next/link";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { JsonLd } from "@/components/seo/json-ld";
import { getCurrentUser } from "@/lib/auth/session";
import { pricingSummary, publicPricingPlans } from "@/lib/pricing";
import { absoluteUrl } from "@/lib/seo";

const pricingDescription =
  "Compare Hirevate Silver, Gold, and Platinum subscriptions for hidden job discovery, cover letters, job tracking, and direct-apply search.";

const pricingFaqItems = [
  {
    question: "Which Hirevate plan is best for an active job search?",
    answer:
      "Gold is the best fit for most active searches because it combines hidden job discovery with saved jobs and application tracking."
  },
  {
    question: "What are the current Hirevate prices?",
    answer: pricingSummary
  },
  {
    question: "Does the free plan include direct-apply job search?",
    answer:
      "Yes. The free plan lets job seekers browse a preview of direct-apply roles from official hiring sources."
  },
  {
    question: "Do paid plans include resume and cover letter tools?",
    answer:
      "Yes. Paid Hirevate plans include the resume builder, cover letter builder, saved jobs, and the application workflow tools listed on the pricing page."
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
  { href: "/jobs/latest", label: "Latest jobs" },
  { href: "/jobs/remote", label: "Remote jobs" },
  { href: "/jobs/software-engineer", label: "Software engineer jobs" },
  { href: "/jobs/product-manager", label: "Product manager jobs" },
  { href: "/jobs/data-analyst", label: "Data analyst jobs" },
  { href: "/jobs/customer-success", label: "Customer success jobs" },
  { href: "/resume-builder", label: "Resume builder" },
  { href: "/cover-letter", label: "Cover letter builder" }
];

export const metadata: Metadata = {
  title: "Pricing",
  description: pricingDescription,
  alternates: {
    canonical: "/pricing"
  },
  openGraph: {
    title: "Pricing",
    description: pricingDescription,
    url: "/pricing"
  },
  twitter: {
    title: "Pricing",
    description: pricingDescription
  }
};

export default async function PricingPage() {
  const user = await getCurrentUser();

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: "Hirevate",
            url: absoluteUrl("/pricing"),
            description: pricingDescription,
            brand: {
              "@type": "Brand",
              name: "Hirevate"
            },
            offers: pricingOffers
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
      <section className="bg-gray-50 py-12">
        <div className="container-shell">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-semibold text-ink-900">Pricing</h1>
            <p className="mt-3 text-base leading-7 text-ink-500">
              Choose Silver, Gold, or Platinum. Gold and Platinum include monthly options with
              30% off compared with weekly billing.
            </p>
          </div>
          <div className="mt-8">
            <PricingCards isLoggedIn={Boolean(user)} />
          </div>
        </div>
      </section>
      <section className="border-t border-gray-100 bg-white py-10">
        <div className="container-shell">
          <h2 className="text-2xl font-semibold text-ink-900">What each plan connects to</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {pricingInternalLinks.map((item) => (
              <Link
                className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-200 hover:text-brand-700"
                href={item.href}
                key={item.href}
              >
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
