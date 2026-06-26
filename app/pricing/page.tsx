import type { Metadata } from "next";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { JsonLd } from "@/components/seo/json-ld";
import { getCurrentUser } from "@/lib/auth/session";
import { absoluteUrl } from "@/lib/seo";

const pricingDescription =
  "Compare Hirevate services for hidden job discovery, resume building, cover letters, job tracking, saved jobs, and unlimited direct-apply search.";

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
              name: "Free Search",
              price: "0",
              priceCurrency: "USD",
              availability: "https://schema.org/InStock"
            },
            {
              "@type": "Offer",
              name: "Resume Builder",
              price: "0",
              priceCurrency: "USD",
              availability: "https://schema.org/InStock"
            },
            {
              "@type": "Offer",
              name: "Job Search Pro",
              price: "12",
              priceCurrency: "USD",
              availability: "https://schema.org/InStock"
            },
            {
              "@type": "Offer",
              name: "All Access Annual",
              price: "49",
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
              Choose the service level that matches your search: hidden jobs, resume building,
              cover letters, job tracking, saved roles, and unlimited direct-apply discovery.
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
