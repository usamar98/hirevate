import type { Metadata } from "next";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { JsonLd } from "@/components/seo/json-ld";
import { getCurrentUser } from "@/lib/auth/session";
import { absoluteUrl } from "@/lib/seo";

const pricingDescription =
  "Compare Hirevate plans for hidden job discovery, unlimited job views, saved jobs, and the advanced resume builder.";

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
              name: "Free",
              price: "0",
              priceCurrency: "USD",
              availability: "https://schema.org/InStock"
            },
            {
              "@type": "Offer",
              name: "Pro Monthly",
              price: "12",
              priceCurrency: "USD",
              availability: "https://schema.org/InStock"
            },
            {
              "@type": "Offer",
              name: "Annual",
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
              Upgrade for unlimited hidden jobs, or build a role-targeted resume with testing-mode
              export while the resume builder is being validated.
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
