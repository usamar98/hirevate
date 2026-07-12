import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import {
  legalDocuments,
  legalEffectiveDate,
  legalEffectiveDateLabel,
  legalIdentity
} from "@/lib/legal";
import { absoluteUrl, defaultOgImagePath } from "@/lib/seo";

const description =
  "Review Hirevate privacy, terms, subscription, refund, cookie, job-source, copyright, AI, accessibility, and legal notices.";

export const metadata: Metadata = {
  title: "Legal Documents",
  description,
  alternates: { canonical: "/legal" },
  openGraph: {
    title: "Hirevate Legal Documents",
    description,
    url: "/legal",
    images: [defaultOgImagePath]
  },
  twitter: {
    title: "Hirevate Legal Documents",
    description,
    card: "summary_large_image",
    images: [defaultOgImagePath]
  }
};

export default function LegalPage() {
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Hirevate Legal Documents",
            url: absoluteUrl("/legal"),
            description,
            dateModified: legalEffectiveDate,
            hasPart: legalDocuments.map((document) => ({
              "@type": "WebPage",
              name: document.title,
              url: absoluteUrl(`/legal/${document.slug}`)
            }))
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
              { "@type": "ListItem", position: 2, name: "Legal", item: absoluteUrl("/legal") }
            ]
          }
        ]}
      />
      <section className="border-b border-gray-100 bg-gray-50 py-12">
        <div className="container-shell max-w-4xl">
          <p className="text-sm font-semibold text-brand-700">Hirevate policies</p>
          <h1 className="mt-2 text-4xl font-semibold text-ink-900">Legal documents</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink-500">
            Plain-language policies for using Hirevate, managing subscriptions, understanding data
            practices, and requesting corrections or support.
          </p>
          <p className="mt-3 text-xs text-ink-400">
            Last updated <time dateTime={legalEffectiveDate}>{legalEffectiveDateLabel}</time>
          </p>
        </div>
      </section>
      <section className="bg-white py-12">
        <div className="container-shell max-w-5xl">
          <div className="grid gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 md:grid-cols-2">
            {legalDocuments.map((document) => (
              <Link
                className="group flex min-h-36 items-start gap-4 bg-white p-5 transition hover:bg-gray-50"
                href={`/legal/${document.slug}`}
                key={document.slug}
              >
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block font-semibold text-ink-900">{document.title}</span>
                  <span className="mt-2 block text-sm leading-6 text-ink-500">{document.summary}</span>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                    Read policy
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-8 text-sm leading-6 text-ink-500">
            Questions can be sent to{" "}
            <a className="font-semibold text-brand-700" href={`mailto:${legalIdentity.contactEmail}`}>
              {legalIdentity.contactEmail}
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
}
