import type { Metadata } from "next";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { JsonLd } from "@/components/seo/json-ld";
import { getCurrentUser } from "@/lib/auth/session";
import { absoluteUrl } from "@/lib/seo";

const pricingDescription =
  "Compare Hirevate Silver, Gold, and Platinum subscriptions for hidden job discovery, cover letters, job tracking, and direct-apply search.";

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
        data={{
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
        }}
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
    </>
  );
}
