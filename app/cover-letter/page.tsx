import type { Metadata } from "next";
import { CoverLetterBuilder } from "@/components/cover-letter/cover-letter-builder";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/seo";

const coverLetterDescription =
  "Create a focused cover letter for a specific company and role, with proof points, keywords, copy, and download.";

export const metadata: Metadata = {
  title: "Cover Letter Builder",
  description: coverLetterDescription,
  alternates: {
    canonical: "/cover-letter"
  },
  openGraph: {
    title: "Cover Letter Builder",
    description: coverLetterDescription,
    url: "/cover-letter"
  },
  twitter: {
    title: "Cover Letter Builder",
    description: coverLetterDescription
  }
};

export default function CoverLetterPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Hirevate Cover Letter Builder",
          url: absoluteUrl("/cover-letter"),
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description: coverLetterDescription,
          offers: {
            "@type": "Offer",
            name: "Cover letter builder",
            price: "0",
            priceCurrency: "USD"
          }
        }}
      />
      <CoverLetterBuilder />
    </>
  );
}
