import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";
import { VisitorTracker } from "@/components/analytics/visitor-tracker";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { SiteFooter } from "@/components/layout/site-footer";
import { CookieConsent } from "@/components/legal/cookie-consent";
import { SiteHeader } from "@/components/layout/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { env } from "@/lib/env";
import { resolveLanguagePreference } from "@/lib/i18n/server";
import {
  absoluteUrl,
  defaultDescription,
  defaultOgImagePath,
  defaultTitle,
  geoAudienceKeywords,
  siteName,
  siteUrl
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
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
    "resume from job link",
    "job description resume generator",
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
    title: defaultTitle,
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
        alt: "Hirevate job-link resume builder and hidden job discovery"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
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
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { language, regionalLanguage } = await resolveLanguagePreference();

  return (
    <html lang={language}>
      <body>
        <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
        <SiteHeader language={language} />
        <main className="flex-1">{children}</main>
        <SiteFooter language={language} />
        <GoogleAnalytics />
        <VisitorTracker />
        <CookieConsent language={language} />
        <LanguageSwitcher language={language} regionalLanguage={regionalLanguage} />
      </body>
    </html>
  );
}
