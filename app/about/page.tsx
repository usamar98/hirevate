import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, DatabaseZap, FileText, SearchCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import {
  hirevateAnswerBriefs,
  hirevateEntityFacts,
  hirevatePricingFacts,
  hirevatePublicPages,
  hirevateSourceFacts
} from "@/lib/geo";
import { absoluteUrl, defaultDescription, siteName } from "@/lib/seo";

const aboutDescription =
  "Learn what Hirevate is, how it finds fresh jobs from public hiring sources, and how its resume, cover letter, and job tracker tools support job seekers.";

const sourceCards = [
  {
    title: "Official hiring sources",
    description:
      "Hirevate prioritizes public company career pages, ATS job boards, and trusted hiring sources close to the employer source.",
    icon: DatabaseZap
  },
  {
    title: "Freshness scoring",
    description:
      "Jobs are scored with recency, apply URL presence, location quality, and role relevance signals.",
    icon: SearchCheck
  },
  {
    title: "Application workflow",
    description:
      "Resume building, cover letters, saved jobs, and application tracking help users act on the roles they find.",
    icon: FileText
  },
  {
    title: "Apply model",
    description:
      "Users apply on the available employer, ATS, or verified hiring source. Hirevate does not auto-apply or represent itself as a recruiter.",
    icon: BadgeCheck
  }
];

export const metadata: Metadata = {
  title: "About Hirevate",
  description: aboutDescription,
  alternates: {
    canonical: "/about"
  },
  openGraph: {
    title: "About Hirevate",
    description: aboutDescription,
    url: "/about"
  },
  twitter: {
    title: "About Hirevate",
    description: aboutDescription
  }
};

export default function AboutPage() {
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: "About Hirevate",
            url: absoluteUrl("/about"),
            description: aboutDescription,
            mainEntity: {
              "@type": "Organization",
              "@id": absoluteUrl("/#organization"),
              name: siteName,
              url: absoluteUrl("/"),
              description: defaultDescription,
              knowsAbout: [
                "public-source jobs",
                "company career pages",
                "hidden job discovery",
                "resume building",
                "cover letters",
                "application tracking"
              ]
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: hirevateAnswerBriefs.map((item) => ({
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
                name: "About",
                item: absoluteUrl("/about")
              }
            ]
          }
        ]}
      />
      <section className="bg-gray-50 py-12">
        <div className="container-shell">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-normal text-brand-600">
              About Hirevate
            </p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-ink-900">
              Fresh public-source jobs with the tools to act on them
            </h1>
            <p className="mt-5 text-base leading-8 text-ink-500">
              Hirevate is built for job seekers who want useful roles earlier, cleaner apply links,
              and a simple workflow for resumes, cover letters, saved jobs, and follow-ups.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild href="/jobs#results">
                Browse jobs
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button asChild href="/resume-builder" variant="outline">
                Build resume
              </Button>
              <Button asChild href="/cover-letter" variant="outline">
                Write cover letter
              </Button>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {sourceCards.map((item) => (
              <Card className="p-5" key={item.title}>
                <item.icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
                <h2 className="mt-5 text-lg font-semibold text-ink-900">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-ink-500">{item.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="container-shell grid gap-8 lg:grid-cols-3">
          <div>
            <h2 className="text-3xl font-semibold text-ink-900">Core facts</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-ink-700">
              {hirevateEntityFacts.map((fact) => (
                <li className="flex gap-2" key={fact}>
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-ink-900">Source policy</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-ink-700">
              {hirevateSourceFacts.map((fact) => (
                <li className="flex gap-2" key={fact}>
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-ink-900">Pricing facts</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-ink-700">
              {hirevatePricingFacts.map((fact) => (
                <li className="flex gap-2" key={fact}>
                  <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
            <Button asChild href="/pricing" className="mt-5" variant="outline">
              Compare plans
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-gray-100 bg-gray-50 py-12">
        <div className="container-shell max-w-3xl">
          <h2 className="text-3xl font-semibold text-ink-900">Answer-ready FAQ</h2>
          <div className="mt-6 divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
            {hirevateAnswerBriefs.map((item) => (
              <div className="p-5" key={item.question}>
                <h3 className="font-semibold text-ink-900">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="container-shell">
          <h2 className="text-3xl font-semibold text-ink-900">Public pages</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {hirevatePublicPages.map((page) => (
              <Link
                className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-brand-200 hover:shadow-soft"
                href={page.path}
                key={page.path}
              >
                <h3 className="font-semibold text-ink-900">{page.title}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-500">{page.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
