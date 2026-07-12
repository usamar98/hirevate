import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/json-ld";
import {
  getLegalDocument,
  legalDocuments,
  legalEffectiveDate,
  legalEffectiveDateLabel,
  legalIdentity
} from "@/lib/legal";
import { absoluteUrl, defaultOgImagePath } from "@/lib/seo";

export const dynamicParams = false;

export function generateStaticParams() {
  return legalDocuments.map((document) => ({ slug: document.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const document = getLegalDocument(slug);
  if (!document) return {};

  const path = `/legal/${document.slug}`;
  return {
    title: document.title,
    description: document.description,
    alternates: { canonical: path },
    openGraph: {
      title: document.title,
      description: document.description,
      url: path,
      type: "article",
      images: [defaultOgImagePath]
    },
    twitter: {
      title: document.title,
      description: document.description,
      card: "summary_large_image",
      images: [defaultOgImagePath]
    }
  };
}

export default async function LegalDocumentPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const document = getLegalDocument(slug);
  if (!document) notFound();

  const path = `/legal/${document.slug}`;

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: document.title,
            url: absoluteUrl(path),
            description: document.description,
            dateModified: legalEffectiveDate,
            isPartOf: { "@type": "WebSite", name: "Hirevate", url: absoluteUrl("/") }
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
              { "@type": "ListItem", position: 2, name: "Legal", item: absoluteUrl("/legal") },
              {
                "@type": "ListItem",
                position: 3,
                name: document.shortTitle,
                item: absoluteUrl(path)
              }
            ]
          }
        ]}
      />
      <section className="border-b border-gray-100 bg-gray-50 py-10">
        <div className="container-shell max-w-4xl">
          <Link className="text-sm font-semibold text-brand-700 hover:text-brand-800" href="/legal">
            Legal documents
          </Link>
          <h1 className="mt-3 text-4xl font-semibold text-ink-900">{document.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink-500">{document.summary}</p>
          <p className="mt-3 text-xs text-ink-400">
            Effective <time dateTime={legalEffectiveDate}>{legalEffectiveDateLabel}</time>
          </p>
        </div>
      </section>
      <section className="bg-white py-12">
        <div className="container-shell grid max-w-5xl gap-10 lg:grid-cols-[minmax(0,1fr)_240px]">
          <article className="min-w-0 divide-y divide-gray-100">
            {document.sections.map((section) => (
              <section className="py-6 first:pt-0" key={section.title}>
                <h2 className="text-xl font-semibold text-ink-900">{section.title}</h2>
                {section.text?.map((paragraph) => (
                  <p className="mt-3 text-sm leading-7 text-ink-600" key={paragraph}>
                    {paragraph}
                  </p>
                ))}
                {section.bullets ? (
                  <ul className="mt-3 space-y-2 pl-5 text-sm leading-7 text-ink-600">
                    {section.bullets.map((bullet) => (
                      <li className="list-disc" key={bullet}>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
            <section className="py-6">
              <h2 className="text-xl font-semibold text-ink-900">Contact</h2>
              <p className="mt-3 text-sm leading-7 text-ink-600">
                Send questions or formal requests to{" "}
                <a className="font-semibold text-brand-700" href={`mailto:${legalIdentity.contactEmail}`}>
                  {legalIdentity.contactEmail}
                </a>
                .
              </p>
            </section>
          </article>
          <aside className="h-fit border-l border-gray-100 pl-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">
              Related policies
            </p>
            <nav aria-label="Related legal documents" className="mt-3 grid gap-2">
              {legalDocuments
                .filter((item) => item.slug !== document.slug)
                .map((item) => (
                  <Link
                    className="text-sm text-ink-500 transition hover:text-brand-700"
                    href={`/legal/${item.slug}`}
                    key={item.slug}
                  >
                    {item.shortTitle}
                  </Link>
                ))}
            </nav>
          </aside>
        </div>
      </section>
    </>
  );
}
