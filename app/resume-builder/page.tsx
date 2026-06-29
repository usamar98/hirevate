import type { Metadata } from "next";
import Link from "next/link";
import { ResumeBuilder } from "@/components/resume/resume-builder";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl } from "@/lib/seo";

const resumeBuilderDescription =
  "Build an ATS-friendly, role-targeted resume with keyword coverage, impact suggestions, templates, and print-ready export.";

const resumeBuilderFaqItems = [
  {
    question: "What makes the Hirevate resume builder ATS-friendly?",
    answer:
      "It gives users structured resume sections, keyword coverage checks, impact suggestions, and clean print-ready layouts that are easier for applicant tracking systems to parse."
  },
  {
    question: "Can I target a resume to a specific job?",
    answer:
      "Yes. Users can compare their resume against a target role, identify missing keywords, and rewrite experience bullets around the role's requirements."
  },
  {
    question: "Does the resume builder export to PDF?",
    answer:
      "Yes. Hirevate supports print-ready browser export so users can save a polished resume as a PDF from their browser."
  }
];

const resumeBuilderInternalLinks = [
  { href: "/jobs/latest", label: "Latest jobs" },
  { href: "/jobs/remote", label: "Remote jobs" },
  { href: "/jobs/software-engineer", label: "Software engineer jobs" },
  { href: "/cover-letter", label: "Cover letter builder" },
  { href: "/pricing", label: "Pricing" }
];

export const metadata: Metadata = {
  title: "Resume Builder",
  description: resumeBuilderDescription,
  alternates: {
    canonical: "/resume-builder"
  },
  openGraph: {
    title: "Resume Builder",
    description: resumeBuilderDescription,
    url: "/resume-builder"
  },
  twitter: {
    title: "Resume Builder",
    description: resumeBuilderDescription
  }
};

export default async function ResumeBuilderPage() {
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Hirevate Resume Builder",
            url: absoluteUrl("/resume-builder"),
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description: resumeBuilderDescription,
            featureList: [
              "ATS keyword coverage",
              "Impact bullet suggestions",
              "Role-targeted resume editing",
              "Print-ready resume export"
            ],
            offers: {
              "@type": "Offer",
              name: "Resume builder testing-mode export",
              price: "0",
              priceCurrency: "USD"
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: resumeBuilderFaqItems.map((item) => ({
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
                name: "Resume Builder",
                item: absoluteUrl("/resume-builder")
              }
            ]
          }
        ]}
      />
      <ResumeBuilder />
      <section className="border-t border-gray-100 bg-white py-10">
        <div className="container-shell">
          <h2 className="text-2xl font-semibold text-ink-900">Use this with fresh job pages</h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {resumeBuilderInternalLinks.map((item) => (
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
          <h2 className="text-3xl font-semibold text-ink-900">Resume builder FAQ</h2>
          <div className="mt-6 divide-y divide-gray-100 rounded-lg border border-gray-200">
            {resumeBuilderFaqItems.map((item) => (
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
