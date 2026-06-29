import type { Metadata } from "next";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { JsonLd } from "@/components/seo/json-ld";
import { getCurrentUser } from "@/lib/auth/session";
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
            offers: [
              {
                "@type": "Offer",
                name: "Silver Weekly",
                price: "4.99",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock"
              },
              {
                "@type": "Offer",
                name: "Gold Weekly",
                price: "8.99",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock"
              },
              {
                "@type": "Offer",
                name: "Gold Monthly",
                price: "25.17",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock"
              },
              {
                "@type": "Offer",
                name: "Platinum Weekly",
                price: "14.99",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock"
              },
              {
                "@type": "Offer",
                name: "Platinum Monthly",
                price: "41.97",
                priceCurrency: "USD",
                availability: "https://schema.org/InStock"
              }
            ]
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
