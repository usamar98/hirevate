import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { comparisons } from "@/lib/content/comparisons";
import { absoluteUrl, defaultOgImagePath } from "@/lib/seo";

const description =
  "Compare Hirevate's focused public-source job workflow with major job-search platforms using current, cited product facts.";

export const metadata: Metadata = {
  title: "Job Search Comparisons",
  description,
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "Job Search Comparisons | Hirevate",
    description,
    url: "/compare",
    images: [defaultOgImagePath]
  },
  twitter: {
    card: "summary_large_image",
    title: "Job Search Comparisons | Hirevate",
    description,
    images: [defaultOgImagePath]
  }
};

export default function ComparePage() {
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Hirevate job search comparisons",
            url: absoluteUrl("/compare"),
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
                name: "Comparisons",
                item: absoluteUrl("/compare")
              }
            ]
          }
        ]}
      />
      <section className="border-b border-gray-100 bg-gray-50 py-12">
        <div className="container-shell max-w-4xl">
          <p className="text-sm font-semibold uppercase text-brand-600">Product comparisons</p>
          <h1 className="mt-3 text-4xl font-semibold text-ink-900">Compare job search workflows</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink-500">{description}</p>
        </div>
      </section>
      <section className="bg-white py-12">
        <div className="container-shell grid gap-4 md:grid-cols-2">
          {comparisons.map((comparison) => (
            <article className="rounded-lg border border-gray-200 bg-white p-6" key={comparison.slug}>
              <h2 className="text-2xl font-semibold text-ink-900">
                <Link href={`/compare/${comparison.slug}`}>{comparison.title}</Link>
              </h2>
              <p className="mt-3 text-sm leading-6 text-ink-500">{comparison.description}</p>
              <Link
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-600"
                href={`/compare/${comparison.slug}`}
              >
                Read comparison
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
