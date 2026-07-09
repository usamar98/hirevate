import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { guides } from "@/lib/content/guides";
import { absoluteUrl, defaultOgImagePath } from "@/lib/seo";

const description =
  "Practical, evidence-first guides for finding hidden jobs, checking source freshness, tailoring resumes, and tracking applications.";

export const metadata: Metadata = {
  title: "Job Search Guides",
  description,
  alternates: { canonical: "/guides" },
  openGraph: {
    title: "Job Search Guides | Hirevate",
    description,
    url: "/guides",
    images: [defaultOgImagePath]
  },
  twitter: {
    card: "summary_large_image",
    title: "Job Search Guides | Hirevate",
    description,
    images: [defaultOgImagePath]
  }
};

export default function GuidesPage() {
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Hirevate job search guides",
            url: absoluteUrl("/guides"),
            description
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
                name: "Guides",
                item: absoluteUrl("/guides")
              }
            ]
          }
        ]}
      />
      <section className="border-b border-gray-100 bg-gray-50 py-12">
        <div className="container-shell max-w-4xl">
          <p className="text-sm font-semibold uppercase text-brand-600">Career resources</p>
          <h1 className="mt-3 text-4xl font-semibold text-ink-900">Job search guides</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink-500">{description}</p>
        </div>
      </section>
      <section className="bg-white py-12">
        <div className="container-shell grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {guides.map((guide) => (
            <article className="rounded-lg border border-gray-200 bg-white p-6" key={guide.slug}>
              <BookOpen className="h-5 w-5 text-brand-600" aria-hidden="true" />
              <p className="mt-5 text-xs font-semibold uppercase text-brand-600">{guide.eyebrow}</p>
              <h2 className="mt-2 text-xl font-semibold text-ink-900">
                <Link href={`/guides/${guide.slug}`}>{guide.title}</Link>
              </h2>
              <p className="mt-3 text-sm leading-6 text-ink-500">{guide.description}</p>
              <Link
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600"
                href={`/guides/${guide.slug}`}
              >
                Read guide
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
