import Link from "next/link";
import { ArrowRight, ExternalLink, GraduationCap, Info, Search, ShieldCheck } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/jobs/job-card";
import { JsonLd } from "@/components/seo/json-ld";
import { getStudentPartTimeJobs } from "@/lib/jobs/queries";
import { getJobCompanyName, getJobPath } from "@/lib/jobs/seo";
import { studentJobsPageList, type StudentJobsPageConfig } from "@/lib/jobs/student-pages";
import { absoluteUrl } from "@/lib/seo";

const scheduleLinks = [
  { href: "/jobs?keyword=part-time", label: "Part-time" },
  { href: "/jobs?keyword=weekend", label: "Weekend" },
  { href: "/jobs?keyword=evening", label: "Evening" },
  { href: "/jobs?keyword=intern", label: "Internships" },
  { href: "/jobs?keyword=campus", label: "On-campus" }
];

function buildJsonLd(config: StudentJobsPageConfig, jobs: Awaited<ReturnType<typeof getStudentPartTimeJobs>>["jobs"]) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: config.label,
      url: absoluteUrl(config.path),
      description: config.description
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Jobs", item: absoluteUrl("/jobs") },
        { "@type": "ListItem", position: 3, name: config.label, item: absoluteUrl(config.path) }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${config.label} on Hirevate`,
      numberOfItems: jobs.length,
      itemListElement: jobs.map((job, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(getJobPath(job)),
        name: `${job.title} at ${getJobCompanyName(job)}`
      }))
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: config.faqs.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer }
      }))
    }
  ];
}

export async function StudentJobsLandingPage({ config }: { config: StudentJobsPageConfig }) {
  const { configured, jobs } = await getStudentPartTimeJobs(config.audience, config.country, 21);
  const visibleJobs = jobs.slice(0, 20);
  const relatedPages = studentJobsPageList.filter((page) => page.path !== config.path);

  return (
    <>
      <JsonLd data={buildJsonLd(config, visibleJobs)} />
      <section className="border-b border-gray-100 bg-gradient-to-b from-brand-50/70 to-white py-12">
        <div className="container-shell">
          <p className="text-sm font-semibold uppercase tracking-normal text-brand-600">{config.eyebrow}</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold text-ink-900 md:text-5xl">{config.heading}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-ink-600">{config.intro}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild href="#current-openings">
              Browse current openings
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button asChild href="/research/student-part-time-jobs" variant="outline">
              View live methodology
            </Button>
          </div>
          <div className="mt-7 flex flex-wrap items-center gap-2 text-sm">
            <span className="font-semibold text-ink-700">Search by schedule:</span>
            {scheduleLinks.map((item) => (
              <Link className="rounded-full border border-gray-200 bg-white px-3 py-1.5 font-medium text-ink-700 hover:border-brand-200 hover:text-brand-700" href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-10">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <Search className="h-5 w-5 text-brand-600" aria-hidden="true" />
            <h2 className="mt-3 font-semibold text-ink-900">Evidence-first matching</h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">Badges come from wording in the original listing, including schedule, hours, campus and student signals.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <ShieldCheck className="h-5 w-5 text-brand-600" aria-hidden="true" />
            <h2 className="mt-3 font-semibold text-ink-900">Fresh and source-linked</h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">Supported sources refresh daily, original apply links are retained, and unverified jobs leave the system after ten days.</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <GraduationCap className="h-5 w-5 text-brand-600" aria-hidden="true" />
            <h2 className="mt-3 font-semibold text-ink-900">No eligibility guessing</h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">Hirevate labels stated evidence but never marks a role “visa compatible” or decides whether a person may work.</p>
          </div>
        </div>

        {config.officialGuidance ? (
          <aside className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5" aria-label="Official work guidance">
            <div className="flex gap-3">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
              <div>
                <h2 className="font-semibold text-amber-950">Check your own work conditions</h2>
                <p className="mt-2 text-sm leading-6 text-amber-900">{config.officialGuidance.summary}</p>
                <a className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-amber-950 underline underline-offset-4" href={config.officialGuidance.href} rel="noopener noreferrer" target="_blank">
                  {config.officialGuidance.label}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </aside>
        ) : null}

        <section className="mt-10" id="current-openings">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-brand-600">Recently verified</p>
              <h2 className="mt-2 text-3xl font-semibold text-ink-900">Current openings</h2>
              {configured ? <p className="mt-2 text-sm text-ink-500">Showing {visibleJobs.length} evidence-matched roles from public hiring sources.</p> : null}
            </div>
            <Button asChild href="/jobs" variant="outline">Open full job search</Button>
          </div>

          <div className="mt-6 space-y-4">
            {visibleJobs.map((job) => (
              <JobCard canApply={false} hasAccount={false} job={job} key={job.id} showApplyAction={false} showStudentSignals />
            ))}
          </div>

          {!configured ? (
            <div className="mt-8"><EmptyState title="Connect Supabase to load jobs" description="The page is ready, but job data requires the configured Supabase environment." /></div>
          ) : null}
          {configured && visibleJobs.length === 0 ? (
            <div className="mt-8"><EmptyState title="No evidence-matched roles right now" description="Browse all fresh jobs while supported sources are checked again." action={<Button asChild href="/jobs" variant="outline">Browse all jobs</Button>} /></div>
          ) : null}
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold text-ink-900">Related student job searches</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {relatedPages.map((page) => (
              <Link className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:border-brand-200 hover:text-brand-700" href={page.path} key={page.path}>{page.label}</Link>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
            <h2 className="text-xl font-semibold text-ink-900">For universities and student societies</h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">Link to a country page, share the freshness methodology, or request a co-branded resource for your careers hub.</p>
            <Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700" href="/partners/student-jobs">Partnership resources <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
            <h2 className="text-xl font-semibold text-ink-900">Transparent methodology</h2>
            <p className="mt-2 text-sm leading-6 text-ink-500">See which signals are labeled, what Hirevate does not infer, supported source types and the ten-day verification rule.</p>
            <Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700" href="/research/student-part-time-jobs">Read the methodology <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </section>

        <section className="mt-12 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-semibold text-ink-900">{config.label} FAQ</h2>
          <div className="mt-5 grid gap-6 md:grid-cols-2">
            {config.faqs.map((item) => <div key={item.question}><h3 className="font-semibold text-ink-900">{item.question}</h3><p className="mt-2 text-sm leading-6 text-ink-500">{item.answer}</p></div>)}
          </div>
        </section>
      </section>
    </>
  );
}
