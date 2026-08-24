import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, PencilLine, WandSparkles } from "lucide-react";
import { ResumeBuilder } from "@/components/resume/resume-builder";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, defaultOgImagePath, siteName } from "@/lib/seo";

const title = "Manual Resume Builder";
const description =
  "Build a resume section by section with Hirevate's free editor and ATS checks. Keep full control of every role, skill, achievement, and career fact.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/resume-builder/manual" },
  openGraph: {
    title: `${title} | ${siteName}`,
    description,
    type: "website",
    url: absoluteUrl("/resume-builder/manual"),
    images: [defaultOgImagePath]
  },
  twitter: {
    title: `${title} | ${siteName}`,
    description,
    card: "summary_large_image",
    images: [defaultOgImagePath]
  }
};

export default function ManualResumeBuilderPage() {
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Hirevate Manual Resume Builder",
            url: absoluteUrl("/resume-builder/manual"),
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description,
            featureList: [
              "Manual resume section editing",
              "ATS keyword and impact checks",
              "Experience, project, education, and skills sections",
              "Professional resume templates",
              "Optional AI writing assistance",
              "Print-ready resume export"
            ],
            provider: {
              "@type": "Organization",
              name: siteName,
              url: absoluteUrl("/")
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
              {
                "@type": "ListItem",
                position: 2,
                name: "Manual Resume Builder",
                item: absoluteUrl("/resume-builder/manual")
              }
            ]
          }
        ]}
      />

      <ResumeBuilder
        canExport={false}
        canUseAi={false}
        isAuthenticated={false}
        mode="manual"
      />

      <section className="border-t border-gray-100 bg-white py-14">
        <div className="container-shell grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <PencilLine aria-hidden="true" className="h-6 w-6 text-brand-700" />
            <h2 className="mt-4 text-3xl font-semibold text-ink-900">
              Full control, one shared draft
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-ink-600">
              Changes made here stay in the same browser draft used by the job-tailored workflow,
              so you can write manually first and tailor the finished evidence to a role later.
            </p>
          </div>
          <div className="border-l-2 border-brand-200 pl-6">
            <WandSparkles aria-hidden="true" className="h-6 w-6 text-violet-600" />
            <h2 className="mt-4 text-2xl font-semibold text-ink-900">
              Need a faster job-specific version?
            </h2>
            <p className="mt-3 leading-7 text-ink-600">
              Paste a public job link or description, confirm the role, choose a template, and
              tailor this same draft without inventing experience.
            </p>
            <Link
              className="mt-5 inline-flex h-11 items-center gap-2 font-semibold text-brand-700 hover:text-brand-800"
              href="/resume-builder#tailor-from-job"
            >
              Open AI Resume From a Job
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
