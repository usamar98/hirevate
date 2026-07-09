import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { comparisons, getComparison } from "@/lib/content/comparisons";
import { absoluteUrl, defaultOgImagePath, siteName } from "@/lib/seo";

export function generateStaticParams() {
  return comparisons.map((comparison) => ({ slug: comparison.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const comparison = getComparison(slug);
  if (!comparison) return { title: "Comparison not found", robots: { index: false, follow: true } };

  const path = `/compare/${comparison.slug}`;
  return {
    title: comparison.title,
    description: comparison.description,
    alternates: { canonical: path },
    openGraph: {
      title: `${comparison.title} | ${siteName}`,
      description: comparison.description,
      url: path,
      type: "article",
      images: [defaultOgImagePath]
    },
    twitter: {
      card: "summary_large_image",
      title: `${comparison.title} | ${siteName}`,
      description: comparison.description,
      images: [defaultOgImagePath]
    }
  };
}

export default async function ComparisonPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const comparison = getComparison(slug);
  if (!comparison) notFound();
  const path = `/compare/${comparison.slug}`;

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: comparison.title,
            description: comparison.description,
            datePublished: "2026-07-09",
            dateModified: "2026-07-09",
            image: absoluteUrl(defaultOgImagePath),
            mainEntityOfPage: absoluteUrl(path),
            author: { "@type": "Organization", name: siteName, url: absoluteUrl("/") },
            publisher: { "@type": "Organization", name: siteName, url: absoluteUrl("/") }
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: comparison.faqs.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer }
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
                name: "Comparisons",
                item: absoluteUrl("/compare")
              },
              {
                "@type": "ListItem",
                position: 3,
                name: comparison.title,
                item: absoluteUrl(path)
              }
            ]
          }
        ]}
      />
      <article className="bg-white py-12">
        <div className="container-shell max-w-5xl">
          <nav className="text-sm text-ink-500" aria-label="Breadcrumb">
            <Link className="hover:text-ink-900" href="/compare">
              Comparisons
            </Link>
            <span aria-hidden="true"> / </span>
            <span>{comparison.competitor}</span>
          </nav>
          <h1 className="mt-8 text-4xl font-semibold text-ink-900">{comparison.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-ink-500">{comparison.description}</p>
          <p className="mt-4 text-sm text-ink-500">
            Product facts checked against official help documentation on July 9, 2026.
          </p>

          <div className="mt-10 overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead className="bg-gray-50 text-sm text-ink-700">
                <tr>
                  <th className="p-4 font-semibold">Topic</th>
                  <th className="p-4 font-semibold">Hirevate</th>
                  <th className="p-4 font-semibold">{comparison.competitor}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm leading-6 text-ink-600">
                {comparison.rows.map((row) => (
                  <tr key={row.topic}>
                    <th className="p-4 align-top font-semibold text-ink-900">{row.topic}</th>
                    <td className="p-4 align-top">{row.hirevate}</td>
                    <td className="p-4 align-top">{row.competitor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-2">
            <section>
              <h2 className="text-2xl font-semibold text-ink-900">Choose Hirevate when</h2>
              <ul className="mt-5 space-y-3">
                {comparison.bestForHirevate.map((item) => (
                  <li className="flex gap-3 text-sm leading-6 text-ink-600" key={item}>
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="text-2xl font-semibold text-ink-900">
                Choose {comparison.competitor} when
              </h2>
              <ul className="mt-5 space-y-3">
                {comparison.bestForCompetitor.map((item) => (
                  <li className="flex gap-3 text-sm leading-6 text-ink-600" key={item}>
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-brand-600" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-12 border-t border-gray-200 pt-10">
            <h2 className="text-2xl font-semibold text-ink-900">Official references</h2>
            <p className="mt-3 text-sm leading-6 text-ink-500">
              Competitor capabilities above are summarized from these first-party help pages.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {comparison.officialReferences.map((reference) => (
                <a
                  className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-ink-700 hover:border-brand-200 hover:text-brand-700"
                  href={reference.url}
                  key={reference.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {reference.label}
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </section>

          <section className="mt-12 border-t border-gray-200 pt-10">
            <h2 className="text-2xl font-semibold text-ink-900">Frequently asked questions</h2>
            <div className="mt-5 divide-y divide-gray-100">
              {comparison.faqs.map((item) => (
                <div className="py-5" key={item.question}>
                  <h3 className="font-semibold text-ink-900">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-500">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </article>
    </>
  );
}
