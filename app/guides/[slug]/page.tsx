import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { getGuide, guides } from "@/lib/content/guides";
import { absoluteUrl, defaultOgImagePath, siteName } from "@/lib/seo";

export function generateStaticParams() {
  return guides.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);

  if (!guide) return { title: "Guide not found", robots: { index: false, follow: true } };

  const path = `/guides/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: path },
    openGraph: {
      title: `${guide.title} | ${siteName}`,
      description: guide.description,
      url: path,
      type: "article",
      images: [defaultOgImagePath]
    },
    twitter: {
      card: "summary_large_image",
      title: `${guide.title} | ${siteName}`,
      description: guide.description,
      images: [defaultOgImagePath]
    }
  };
}

export default async function GuidePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const path = `/guides/${guide.slug}`;

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "Article",
            headline: guide.title,
            description: guide.description,
            datePublished: guide.updatedAt,
            dateModified: guide.updatedAt,
            image: absoluteUrl(defaultOgImagePath),
            mainEntityOfPage: absoluteUrl(path),
            author: { "@type": "Organization", name: siteName, url: absoluteUrl("/") },
            publisher: { "@type": "Organization", name: siteName, url: absoluteUrl("/") }
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: guide.faqs.map((item) => ({
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
                name: "Guides",
                item: absoluteUrl("/guides")
              },
              {
                "@type": "ListItem",
                position: 3,
                name: guide.title,
                item: absoluteUrl(path)
              }
            ]
          }
        ]}
      />
      <article className="bg-white py-12">
        <div className="container-shell max-w-3xl">
          <nav className="text-sm text-ink-500" aria-label="Breadcrumb">
            <Link className="hover:text-ink-900" href="/guides">
              Guides
            </Link>
            <span aria-hidden="true"> / </span>
            <span>{guide.eyebrow}</span>
          </nav>
          <p className="mt-8 text-sm font-semibold uppercase text-brand-600">{guide.eyebrow}</p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight text-ink-900">{guide.title}</h1>
          <p className="mt-5 text-lg leading-8 text-ink-500">{guide.description}</p>
          <p className="mt-4 text-sm text-ink-500">
            Updated {guide.updatedAt} | {guide.readMinutes} minute read
          </p>

          <div className="mt-10 space-y-10">
            {guide.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-2xl font-semibold text-ink-900">{section.heading}</h2>
                <div className="mt-4 space-y-4 text-base leading-8 text-ink-700">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
                {section.bullets ? (
                  <ul className="mt-5 space-y-3 text-base leading-7 text-ink-700">
                    {section.bullets.map((bullet) => (
                      <li className="flex gap-3" key={bullet}>
                        <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </section>
            ))}
          </div>

          <section className="mt-12 border-t border-gray-200 pt-10">
            <h2 className="text-2xl font-semibold text-ink-900">Frequently asked questions</h2>
            <div className="mt-5 divide-y divide-gray-100">
              {guide.faqs.map((item) => (
                <div className="py-5" key={item.question}>
                  <h3 className="font-semibold text-ink-900">{item.question}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-500">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-10 flex flex-wrap gap-4 border-t border-gray-200 pt-8">
            <Link className="inline-flex items-center gap-2 font-semibold text-brand-600" href="/jobs/latest">
              Browse latest jobs
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link className="font-semibold text-brand-600" href="/resume-builder">
              Resume builder
            </Link>
            <Link className="font-semibold text-brand-600" href="/cover-letter">
              Cover letter builder
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
