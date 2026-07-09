import type { Metadata } from "next";
import Link from "next/link";
import { CoverLetterBuilder } from "@/components/cover-letter/cover-letter-builder";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, defaultOgImagePath } from "@/lib/seo";

const coverLetterDescription =
  "Create a focused cover letter for a specific company and role, with proof points, keywords, copy, and download.";

const coverLetterFaqItems = [
  {
    question: "What does the Hirevate cover letter builder create?",
    answer:
      "It helps users turn a target company, role, proof points, and keywords into a focused cover letter they can copy or download."
  },
  {
    question: "Can the cover letter target a specific job description?",
    answer:
      "Yes. Users can add role details and keywords so the cover letter speaks directly to the company, job title, and evidence they want to highlight."
  },
  {
    question: "Does Hirevate submit cover letters automatically?",
    answer:
      "No. Hirevate helps users prepare application materials, then users apply on the available employer, ATS, or verified partner source."
  }
];

const coverLetterInternalLinks = [
  { href: "/jobs/latest", label: "Latest jobs" },
  { href: "/jobs/remote", label: "Remote jobs" },
  { href: "/jobs/product-manager", label: "Product manager jobs" },
  { href: "/resume-builder", label: "Resume builder" },
  { href: "/pricing", label: "Pricing" }
];

export const metadata: Metadata = {
  title: "Cover Letter Builder",
  description: coverLetterDescription,
  alternates: {
    canonical: "/cover-letter"
  },
  openGraph: {
    title: "Cover Letter Builder",
    description: coverLetterDescription,
    url: "/cover-letter",
    images: [defaultOgImagePath]
  },
  twitter: {
    title: "Cover Letter Builder",
    description: coverLetterDescription,
    card: "summary_large_image",
    images: [defaultOgImagePath]
  }
};

export default function CoverLetterPage() {
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Hirevate Cover Letter Builder",
            url: absoluteUrl("/cover-letter"),
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description: coverLetterDescription,
            featureList: [
              "Company-specific cover letter drafting",
              "Role keyword targeting",
              "Proof point organization",
              "Copy and download workflow"
            ],
            offers: {
              "@type": "Offer",
              name: "Cover letter builder",
              price: "0",
              priceCurrency: "USD"
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: coverLetterFaqItems.map((item) => ({
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
                name: "Cover Letter Builder",
                item: absoluteUrl("/cover-letter")
              }
            ]
          }
        ]}
      />
      <CoverLetterBuilder />
      <section className="border-t border-gray-100 bg-white py-10">
        <div className="container-shell">
          <h2 className="text-2xl font-semibold text-ink-900">Pair cover letters with job pages</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {coverLetterInternalLinks.map((item) => (
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
          <h2 className="text-3xl font-semibold text-ink-900">Cover letter FAQ</h2>
          <div className="mt-6 divide-y divide-gray-100 rounded-lg border border-gray-200">
            {coverLetterFaqItems.map((item) => (
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
