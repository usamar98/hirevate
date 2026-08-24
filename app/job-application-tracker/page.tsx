import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BellRing, ChartNoAxesCombined, ListChecks, LockKeyhole } from "lucide-react";
import { PublicTrackerDemo } from "@/components/job-tracker/public-tracker-demo";
import { JsonLd } from "@/components/seo/json-ld";
import { absoluteUrl, siteName } from "@/lib/seo";

const title = "Job Application Tracker";
const socialTitle = "Job Application Tracker | Hirevate";
const description =
  "Try Hirevate's job application tracker preview. Organize roles by stage and keep the next action visible from interest through offer.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/job-application-tracker" },
  openGraph: {
    title: socialTitle,
    description,
    type: "website",
    url: absoluteUrl("/job-application-tracker")
  }
};

const features = [
  {
    description: "Separate application progress from whether the original job listing is still active.",
    icon: ListChecks,
    title: "Clear stages"
  },
  {
    description: "Keep the next action and follow-up date attached to the application that needs it.",
    icon: BellRing,
    title: "Follow-up planning"
  },
  {
    description: "Review interview movement and outcomes without treating small samples as certainty.",
    icon: ChartNoAxesCombined,
    title: "Useful signals"
  },
  {
    description: "The public preview sends nothing to Hirevate. Signed-in records use the private account workspace.",
    icon: LockKeyhole,
    title: "Privacy boundaries"
  }
];

export default function JobApplicationTrackerPage() {
  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Hirevate Job Application Tracker Preview",
            description,
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            provider: { "@type": "Organization", name: siteName, url: absoluteUrl("/") },
            url: absoluteUrl("/job-application-tracker")
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
              {
                "@type": "ListItem",
                position: 2,
                name: "Job Application Tracker",
                item: absoluteUrl("/job-application-tracker")
              }
            ]
          }
        ]}
      />

      <main>
        <section className="container-shell grid gap-10 py-14 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-20">
          <div>
            <p className="text-sm font-semibold text-brand-700">Job application tracker</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-ink-900 sm:text-5xl">
              Keep every application and next action in view
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-ink-600">
              Organize roles from first interest through interview and offer. Try the free browser preview below, then use the private account tracker for synced records, reminders, notes, and history.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                className="inline-flex h-12 items-center gap-2 rounded-md bg-black px-5 font-semibold text-white hover:bg-gray-800"
                href="#tracker-demo-title"
              >
                Try the preview
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <Link
                className="inline-flex h-12 items-center rounded-md border border-gray-200 px-5 font-semibold text-ink-900 hover:bg-gray-50"
                href="/account/job-tracker"
              >
                Open my tracker
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <article className="min-h-52 bg-white p-5" key={feature.title}>
                  <Icon aria-hidden="true" className="h-5 w-5 text-brand-700" />
                  <h2 className="mt-5 text-lg font-semibold text-ink-900">{feature.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-ink-600">{feature.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <PublicTrackerDemo />

        <section className="container-shell grid gap-10 py-14 lg:grid-cols-[0.8fr_1.2fr] lg:py-20">
          <div>
            <p className="text-sm font-semibold text-brand-700">A practical workflow</p>
            <h2 className="mt-2 text-3xl font-semibold text-ink-900">What a useful tracker should record</h2>
          </div>
          <div className="space-y-7 text-base leading-8 text-ink-600">
            <p>
              Record the role, employer, source URL, application date, resume version, current stage, next action, and follow-up date. Preserve your application history even if the original listing later closes.
            </p>
            <p>
              Treat conversion rates as directional signals, especially with small samples. Compare similar roles and resume versions before changing your approach. Hirevate explains the method in its{" "}
              <Link className="font-semibold text-brand-700 underline underline-offset-2" href="/guides/application-tracking">
                application tracking guide
              </Link>
              .
            </p>
            <p>
              The preview above is local to the open page and is not saved. The signed-in tracker stores account records, notes, reminders, activity history, and listing health in the private workspace.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
