import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { JsonLd } from "@/components/seo/json-ld";
import { getStudentPartTimeJobs } from "@/lib/jobs/queries";
import { absoluteUrl, defaultOgImagePath } from "@/lib/seo";

const path = "/research/student-part-time-jobs";
const title = "Student & Part-Time Jobs Data Methodology | Hirevate";
const description = "See how Hirevate finds, verifies and labels fresh student and part-time jobs in the US and UK without guessing visa eligibility.";

export const revalidate = 1800;
export const metadata: Metadata = {
  title: { absolute: title }, description, alternates: { canonical: path },
  openGraph: { title, description, url: path, images: [defaultOgImagePath] },
  twitter: { card: "summary_large_image", title, description, images: [defaultOgImagePath] }
};

export default async function StudentPartTimeResearchPage() {
  const [usPartTime, ukPartTime, usStudent, ukStudent] = await Promise.all([
    getStudentPartTimeJobs("part-time", "us", 200),
    getStudentPartTimeJobs("part-time", "uk", 200),
    getStudentPartTimeJobs("student", "us", 200),
    getStudentPartTimeJobs("student", "uk", 200)
  ]);
  const updatedAt = new Date();
  const metrics = [
    { label: "US part-time matches", value: usPartTime.jobs.length, href: "/jobs/part-time/us" },
    { label: "UK part-time matches", value: ukPartTime.jobs.length, href: "/jobs/part-time/uk" },
    { label: "US student matches", value: usStudent.jobs.length, href: "/jobs/student/us" },
    { label: "UK student matches", value: ukStudent.jobs.length, href: "/jobs/student/uk" }
  ];
  const jsonLd = [
    {
      "@context": "https://schema.org", "@type": "WebPage", name: title,
      url: absoluteUrl(path), description, dateModified: updatedAt.toISOString()
    },
    {
      "@context": "https://schema.org", "@type": "Dataset",
      name: "Hirevate US and UK student and part-time job snapshot",
      description: "A rolling snapshot of active public-source jobs matched through explicit schedule, student, campus, internship and authorization wording.",
      url: absoluteUrl(path), dateModified: updatedAt.toISOString(),
      creator: { "@type": "Organization", name: "Hirevate", url: absoluteUrl("/") },
      spatialCoverage: ["United States", "United Kingdom"],
      temporalCoverage: `${new Date(updatedAt.getTime() - 10 * 86400000).toISOString()}/${updatedAt.toISOString()}`,
      measurementTechnique: "Deterministic evidence matching against normalized public job titles, descriptions and source employment fields"
    }
  ];

  return (
    <main className="bg-gray-50 py-12">
      <JsonLd data={jsonLd} />
      <div className="container-shell">
        <p className="text-sm font-semibold uppercase tracking-normal text-brand-600">Open methodology</p>
        <h1 className="mt-3 max-w-4xl text-4xl font-semibold text-ink-900">How Hirevate labels student and part-time jobs</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink-600">A transparent, rolling snapshot of the evidence Hirevate finds in public US and UK listings. Counts update with the job feed and may overlap because one role can match more than one category.</p>
        <p className="mt-3 text-sm text-ink-500">Snapshot refreshed {updatedAt.toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })} UTC.</p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Current job snapshot">
          {metrics.map((metric) => <Link className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-brand-200" href={metric.href} key={metric.label}><p className="text-3xl font-semibold text-ink-900">{metric.value}</p><p className="mt-2 text-sm font-medium text-ink-600">{metric.label}</p></Link>)}
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-2xl font-semibold text-ink-900">Signals we label</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-ink-600">
              {["Explicit part-time wording or a stated weekly-hours range", "Student, undergraduate or graduate-student wording", "Internship, co-op and on-campus wording", "Evening, weekend, seasonal and temporary schedules", "CPT/OPT, work-authorization and sponsorship wording when explicitly present"].map((item) => <li className="flex gap-2" key={item}><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />{item}</li>)}
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-2xl font-semibold text-ink-900">Claims we do not make</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-ink-600">
              {["A job is visa compatible, guaranteed or approved for a particular person", "A universal weekly-hours allowance applies to every student", "An employer will sponsor a visa when the listing does not say so", "A listing remains open after it stops appearing on the public source"].map((item) => <li className="flex gap-2" key={item}><XCircle className="mt-1 h-4 w-4 shrink-0 text-red-500" aria-hidden="true" />{item}</li>)}
            </ul>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-ink-900">Collection and freshness</h2>
          <div className="mt-4 grid gap-5 text-sm leading-6 text-ink-600 md:grid-cols-3">
            <div><h3 className="font-semibold text-ink-900">Public sources</h3><p className="mt-2">Employer career pages, public Greenhouse, Lever and Ashby boards, Adzuna discovery results, optional Jooble results, and trusted hiring partners.</p></div>
            <div><h3 className="font-semibold text-ink-900">Daily verification</h3><p className="mt-2">Supported US, UK, Canada and Australia sources are refreshed every day. Each result keeps its available original source and apply URL.</p></div>
            <div><h3 className="font-semibold text-ink-900">Ten-day retention</h3><p className="mt-2">A job that has not been verified within ten days is deleted automatically from the public system and database.</p></div>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-brand-100 bg-brand-50 p-6">
          <h2 className="text-xl font-semibold text-ink-900">Cite or share this methodology</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-600">Universities, student societies, researchers and career advisers may link directly to this page as Hirevate’s current classification and freshness methodology.</p>
          <div className="mt-4 flex flex-wrap gap-3"><Link className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700" href="/partners/student-jobs">Partnership resources <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700" href="/jobs/part-time">Browse the job hub <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
        </section>
      </div>
    </main>
  );
}
