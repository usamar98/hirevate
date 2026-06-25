import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { env } from "@/lib/env";
import { absoluteUrl, defaultDescription, defaultOgImagePath, siteName, siteUrl } from "@/lib/seo";

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
  description: defaultDescription,
  keywords: [
    "hidden jobs",
    "direct apply jobs",
    "fresh job listings",
    "resume builder",
    "job search tracker",
    "remote jobs",
    "professional jobs"
  ],
  alternates: {
    canonical: "/"
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

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteName,
  url: siteUrl,
  logo: absoluteUrl("/icon.svg")
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteName,
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${absoluteUrl("/jobs")}?keyword={search_term_string}`,
    "query-input": "required name=search_term_string"
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
        <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
