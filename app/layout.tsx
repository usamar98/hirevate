import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/layout/site-footer";
import { CookieConsent } from "@/components/legal/cookie-consent";
import { SiteHeader } from "@/components/layout/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { env } from "@/lib/env";
import { publicPricingPlans } from "@/lib/pricing";
import {
  absoluteUrl,
  defaultDescription,
  defaultOgImagePath,
  geoAudienceKeywords,
  siteName,
  siteUrl
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`
  },
  applicationName: siteName,
  authors: [{ name: siteName, url: siteUrl }],
  category: "job search",
  creator: siteName,
  publisher: siteName,
  description: defaultDescription,
  keywords: [
    "hidden jobs",
    "public-source jobs",
    "fresh job listings",
    "resume builder",
    "job search tracker",
    "remote jobs",
    "professional jobs",
    ...geoAudienceKeywords
  ],
  alternates: {
    canonical: "/",
    types: {
      "text/plain": [
        { title: "Hirevate LLM context", url: "/llms.txt" },
        { title: "Hirevate full LLM context", url: "/llms-full.txt" },
        { title: "Hirevate AI crawler guide", url: "/ai.txt" }
      ]
    }
  },
  openGraph: {
    title: siteName,
    description: defaultDescription,
    url: "/",
    siteName,
    locale: "en_US",
    type: "website",
    images: [
      {
        url: defaultOgImagePath,
        width: 1200,
        height: 630,
        alt: "Hirevate hidden jobs and resume tools"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: defaultDescription,
    images: [defaultOgImagePath]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  verification: env.googleSiteVerification ? { google: env.googleSiteVerification } : undefined,
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#111827"
};

const organizationId = absoluteUrl("/#organization");
const websiteId = absoluteUrl("/#website");
const softwareApplicationId = absoluteUrl("/#software-application");

const paidPlanOfferItems = publicPricingPlans.flatMap((plan) =>
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

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": organizationId,
  name: siteName,
  alternateName: "Hirevate Hidden Jobs",
  url: siteUrl,
  logo: absoluteUrl("/icon.svg"),
  image: absoluteUrl(defaultOgImagePath),
  description: defaultDescription,
  knowsAbout: geoAudienceKeywords
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": websiteId,
  name: siteName,
  url: siteUrl,
  description: defaultDescription,
  inLanguage: "en-US",
  publisher: {
    "@id": organizationId
  },
  potentialAction: {
    "@type": "SearchAction",
    target: `${absoluteUrl("/jobs")}?keyword={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "@id": softwareApplicationId,
  name: siteName,
  url: siteUrl,
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Job search and career management",
  operatingSystem: "Web",
  image: absoluteUrl(defaultOgImagePath),
  description: defaultDescription,
  publisher: {
    "@id": organizationId
  },
  offers: {
    "@type": "OfferCatalog",
    name: "Hirevate subscriptions",
    itemListElement: paidPlanOfferItems
  }
};

const jobSearchServiceJsonLd = {
  "@context": "https://schema.org",
  "@type": "Service",
  "@id": absoluteUrl("/#job-search-service"),
  name: "Hidden job discovery and application workflow",
  serviceType: "Public-source job discovery and application workflow",
  provider: {
    "@id": organizationId
  },
  areaServed: "Global",
  audience: {
    "@type": "Audience",
    audienceType: "Job seekers"
  },
  description: defaultDescription,
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Hirevate plans",
    itemListElement: paidPlanOfferItems
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <JsonLd data={[organizationJsonLd, websiteJsonLd, softwareApplicationJsonLd, jobSearchServiceJsonLd]} />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <CookieConsent />
      </body>
    </html>
  );
}
