import type { Metadata } from "next";
import Link from "next/link";
import { CoverLetterBuilder } from "@/components/cover-letter/cover-letter-builder";
import { publicPricingFacts } from "@/lib/pricing";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, defaultOgImagePath } from "@/lib/seo";

const coverLetterDescription =
  "Use Hirevate's free cover letter editor to create a job-specific draft with proof points and role keywords. Eligible users can add AI-assisted writing.";

const coverLetterFaqItems = [
  {
    question: "What does the Hirevate cover letter builder create?",
    answer:
      "It turns a target company, role, proof points, and keywords into a focused live draft. Eligible members can also create a job-specific AI-assisted draft for review."
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

const coverLetterSteps = [
  {
    title: "Name the company and role",
    description:
      "Start with the exact job title and employer. This gives the opening a specific purpose and prevents the letter from reading like a reusable message sent everywhere."
  },
  {
    title: "Add evidence, not adjectives",
    description:
      "Choose two or three proof points from your work, studies, projects, or volunteering. Results, scope, and examples are more persuasive than unsupported claims about being passionate or hardworking."
  },
  {
    title: "Edit the draft in your voice",
    description:
      "Check each sentence for accuracy, remove generic phrases, and keep the final letter concise. Copy the result or download it only after it sounds like something you would genuinely say."
  }
];

export const metadata: Metadata = {
  title: "Free Cover Letter Builder for Any Job",
  description: coverLetterDescription,
  alternates: {
    canonical: "/cover-letter"
  },
  openGraph: {
    title: "Free Cover Letter Builder for Any Job",
    description: coverLetterDescription,
    url: "/cover-letter",
    images: [defaultOgImagePath]
  },
  twitter: {
    title: "Free Cover Letter Builder for Any Job",
    description: coverLetterDescription,
    card: "summary_large_image",
    images: [defaultOgImagePath]
  }
};

export default async function CoverLetterPage() {
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
              "Secure AI-assisted job-specific writing",
              "Role keyword targeting",
              "Proof point organization",
              "Copy and download workflow"
            ],
            offers: [
              {
                "@type": "Offer",
                name: "Hirevate 3-day free trial",
                price: "0",
                priceCurrency: "USD",
                url: absoluteUrl("/pricing")
              },
              ...publicPricingFacts.map((plan) => ({
                "@type": "Offer",
                name: plan.plan,
                price: plan.priceValue,
                priceCurrency: "USD",
                url: absoluteUrl("/pricing")
              }))
            ]
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
      <CoverLetterBuilder canUseAi={false} isAuthenticated={false} />
      <section className="border-t border-gray-100 bg-gray-50 py-14">
        <div className="container-shell">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold text-ink-900">
              Create a job-specific cover letter in three steps
            </h2>
            <p className="mt-3 text-base leading-7 text-ink-500">
              Hirevate&apos;s free cover letter builder helps you turn relevant evidence into a focused
              first draft. The goal is not to make every letter sound identical; it is to give you
              a practical structure that is easy to personalize and verify.
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {coverLetterSteps.map((step, index) => (
              <article className="rounded-lg border border-gray-200 bg-white p-6" key={step.title}>
                <p className="text-sm font-semibold text-brand-700">Step {index + 1}</p>
                <h3 className="mt-2 text-xl font-semibold text-ink-900">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-ink-500">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="border-t border-gray-100 bg-white py-14">
        <div className="container-shell grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold text-ink-900">
              What a strong cover letter should answer
            </h2>
            <p className="mt-4 text-base leading-7 text-ink-500">
              A recruiter should quickly understand why you chose this role, which requirement you
              can already meet, and what evidence supports that match. Use the company name and job
              title naturally, connect one or two role keywords to real experience, and explain the
              value you could bring without repeating your entire resume.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-ink-900">A final accuracy check</h2>
            <ul className="mt-4 space-y-3 text-base leading-7 text-ink-500">
              <li>Verify the hiring manager, company, and role names before sending.</li>
              <li>Remove claims that you cannot support with a concrete example.</li>
              <li>Keep the tone professional, direct, and consistent with your normal voice.</li>
              <li>Check the employer&apos;s instructions for format, length, and required attachments.</li>
            </ul>
          </div>
        </div>
      </section>
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
