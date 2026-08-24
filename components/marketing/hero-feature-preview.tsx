"use client";

import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  ListChecks,
  Search,
  Sparkles,
  Target
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { CompanyLogo } from "@/components/company-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FeatureKey = "jobs" | "resume" | "coverLetter" | "tracker";

export type HeroPreviewJob = {
  company: string;
  compensation: string | null;
  href: string;
  location: string;
  score: number | null;
  sourceLabel: string;
  title: string;
  website: string | null;
};

export type HeroJobsPreviewCopy = {
  apply: string;
  score: string;
  search: string;
  searchTerm: string;
  subtitle: string;
  title: string;
  verified: string;
};

export type HeroFeatureLabels = Record<FeatureKey, string>;

function PreviewShell({
  children,
  status,
  title
}: {
  children: ReactNode;
  status: string;
  title: string;
}) {
  return (
    <div className="min-h-[510px] overflow-hidden rounded-lg border border-gray-200 bg-white p-3 shadow-soft">
      <div className="flex min-w-0 items-center justify-between gap-3 rounded-md border border-gray-100 bg-gray-50 px-4 py-3">
        <p className="truncate text-sm font-semibold text-ink-900">{title}</p>
        <Badge tone="green">{status}</Badge>
      </div>
      {children}
    </div>
  );
}

function JobsPreview({ copy, jobs }: { copy: HeroJobsPreviewCopy; jobs: HeroPreviewJob[] }) {
  const [activeJobIndex, setActiveJobIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const activeJob = jobs[activeJobIndex % Math.max(jobs.length, 1)] ?? jobs[0];

  useEffect(() => {
    if (jobs.length < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveJobIndex((current) => (current + 1) % jobs.length);
    }, 4_500);

    return () => window.clearInterval(interval);
  }, [jobs.length, paused]);

  function showAdjacentJob(offset: number) {
    setActiveJobIndex((current) => (current + offset + jobs.length) % jobs.length);
  }

  return (
    <PreviewShell status={copy.verified} title={copy.title}>
      <div
        onBlurCapture={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="mt-3 rounded-md border border-gray-100 bg-gray-50 p-4">
          <p className="text-xs text-ink-500">{copy.subtitle}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <div className="flex h-11 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm text-ink-500">
              <Search className="h-4 w-4" aria-hidden="true" />
              {copy.searchTerm}
            </div>
            <Button asChild href="/jobs#results" className="w-full sm:w-auto">
              {copy.search}
            </Button>
          </div>
        </div>

        {activeJob ? (
          <div
            className="mt-3 rounded-md border border-gray-100 bg-white p-4 shadow-sm"
            key={activeJob.href}
          >
            <div className="flex min-w-0 items-start gap-3">
              <CompanyLogo companyName={activeJob.company} website={activeJob.website} />
              <div className="min-w-0 flex-1">
                <Link href={activeJob.href} className="font-semibold text-ink-900 hover:text-brand-600">
                  {activeJob.title}
                </Link>
                <p className="mt-1 truncate text-sm text-ink-500">
                  {activeJob.company} - {activeJob.location}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {activeJob.compensation ? (
                    <span className="inline-flex items-center rounded-full bg-black px-2.5 py-1 text-xs font-semibold leading-none text-white">
                      {activeJob.compensation}
                    </span>
                  ) : null}
                  {activeJob.score === null ? null : <Badge tone="green">{copy.score} {activeJob.score}</Badge>}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-start gap-3 sm:justify-between">
              <Badge tone="blue">{activeJob.sourceLabel}</Badge>
              <Link href={activeJob.href} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
                <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
                {copy.apply}
              </Link>
            </div>
          </div>
        ) : null}

        {jobs.length > 1 ? (
          <div className="mt-4 flex h-10 items-center justify-between gap-3 border-t border-gray-100 pt-3">
            <span className="text-xs font-semibold text-ink-500">
              {activeJobIndex + 1} of {jobs.length} fresh jobs
            </span>
            <div className="flex items-center gap-2">
              <button
                aria-label="Show previous job"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-ink-600 hover:border-brand-200 hover:text-brand-700"
                onClick={() => showAdjacentJob(-1)}
                title="Previous job"
                type="button"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                aria-label="Show next job"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-ink-600 hover:border-brand-200 hover:text-brand-700"
                onClick={() => showAdjacentJob(1)}
                title="Next job"
                type="button"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </PreviewShell>
  );
}

function ResumePreview() {
  return (
    <PreviewShell status="ATS ready" title="Resume builder">
      <div className="mt-3 grid gap-3 sm:grid-cols-[0.72fr_1.28fr]">
        <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink-900">
            <Sparkles className="h-4 w-4 text-violet-600" aria-hidden="true" />
            Target role
          </div>
          <div className="mt-3 rounded-md border border-gray-200 bg-white px-3 py-2.5 text-xs text-ink-700">
            Product Designer
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-normal text-ink-500">Template</p>
          <div className="mt-2 space-y-2">
            {["Precision", "Modern", "Executive"].map((template, index) => (
              <div
                className={cn(
                  "rounded-md border px-3 py-2 text-xs font-semibold",
                  index === 1
                    ? "border-brand-300 bg-brand-50 text-brand-800"
                    : "border-gray-200 bg-white text-ink-700"
                )}
                key={template}
              >
                {template}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50 p-3">
            <div className="flex items-center justify-between text-xs font-semibold text-emerald-800">
              <span>Match score</span>
              <span>92%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-100">
              <div className="h-full w-[92%] rounded-full bg-emerald-500" />
            </div>
          </div>
        </div>
        <div className="rounded-md border border-gray-200 border-l-4 border-l-brand-600 bg-white p-5 shadow-sm">
          <div className="h-3 w-28 rounded bg-ink-900" />
          <div className="mt-2 h-2 w-20 rounded bg-brand-500" />
          <div className="mt-6 flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
            <div className="h-2 w-24 rounded bg-ink-700" />
          </div>
          <div className="mt-3 space-y-2">
            <div className="h-1.5 w-full rounded bg-gray-200" />
            <div className="h-1.5 w-11/12 rounded bg-gray-200" />
            <div className="h-1.5 w-4/5 rounded bg-gray-200" />
          </div>
          <div className="mt-7 flex items-center gap-2">
            <BriefcaseBusiness className="h-3.5 w-3.5 text-brand-600" aria-hidden="true" />
            <div className="h-2 w-32 rounded bg-ink-700" />
          </div>
          {["Northstar Labs", "Brightlane"].map((company) => (
            <div className="mt-4" key={company}>
              <p className="text-[10px] font-bold text-ink-700">{company}</p>
              <div className="mt-2 space-y-2">
                <div className="h-1.5 w-full rounded bg-gray-200" />
                <div className="h-1.5 w-5/6 rounded bg-gray-200" />
              </div>
            </div>
          ))}
          <div className="mt-7 flex items-center justify-between border-t border-gray-100 pt-3 text-[10px] font-semibold">
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <Check className="h-3 w-3" aria-hidden="true" /> ATS-friendly
            </span>
            <span className="inline-flex items-center gap-1 text-brand-700">
              <FileText className="h-3 w-3" aria-hidden="true" /> PDF export
            </span>
          </div>
        </div>
      </div>
    </PreviewShell>
  );
}

function CoverLetterPreview() {
  return (
    <PreviewShell status="AI assisted" title="Cover letter builder">
      <div className="mt-3 rounded-md border border-gray-100 bg-gray-50 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-normal text-ink-500">Company</p>
            <div className="mt-1.5 rounded-md border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-ink-800">
              Northstar Labs
            </div>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-normal text-ink-500">Role</p>
            <div className="mt-1.5 rounded-md border border-gray-200 bg-white px-3 py-2.5 text-xs font-medium text-ink-800">
              Product Designer
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-md border border-violet-100 bg-violet-50 px-3 py-2.5 text-xs font-semibold text-violet-800">
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Tailored from your resume and the job description
        </div>
      </div>
      <div className="mt-3 rounded-md border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div>
            <p className="text-sm font-semibold text-ink-900">Dear Hiring Team,</p>
            <p className="mt-1 text-[10px] text-ink-500">Focused draft · ready to review</p>
          </div>
          <FileText className="h-5 w-5 text-brand-600" aria-hidden="true" />
        </div>
        <div className="mt-5 space-y-3">
          <p className="text-xs leading-5 text-ink-600">
            I am excited to apply for the Product Designer role at Northstar Labs. My experience
            building accessible product systems aligns closely with your team&apos;s priorities.
          </p>
          <p className="text-xs leading-5 text-ink-600">
            In my current role, I partner with engineering and research to turn complex workflows
            into clear, measurable customer experiences.
          </p>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-md bg-emerald-50 p-3 text-center">
            <p className="text-lg font-semibold text-emerald-800">8/9</p>
            <p className="text-[10px] font-medium text-emerald-700">Keywords covered</p>
          </div>
          <div className="rounded-md bg-blue-50 p-3 text-center">
            <p className="text-lg font-semibold text-blue-800">Focused</p>
            <p className="text-[10px] font-medium text-blue-700">Writing tone</p>
          </div>
        </div>
      </div>
    </PreviewShell>
  );
}

function TrackerPreview() {
  const columns = [
    { title: "Interested", count: 4, jobs: ["UX Researcher"] },
    { title: "Applied", count: 5, jobs: ["Product Designer", "Design Lead"] },
    { title: "Interview", count: 3, jobs: ["Senior UX Designer"] }
  ];

  return (
    <PreviewShell status="3 active" title="Job tracker">
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[["Tracked", "12"], ["Follow-ups", "3"], ["Interview rate", "24%"]].map(([label, value]) => (
          <div className="rounded-md border border-gray-100 bg-gray-50 p-3" key={label}>
            <p className="truncate text-[9px] font-semibold uppercase tracking-normal text-ink-500">{label}</p>
            <p className="mt-1 text-lg font-semibold text-ink-900">{value}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-md border border-gray-100 bg-gray-50 p-3">
        {columns.map((column) => (
          <div className="min-w-0" key={column.title}>
            <div className="mb-2 flex items-center justify-between gap-1">
              <p className="truncate text-[9px] font-semibold uppercase tracking-normal text-ink-500">{column.title}</p>
              <span className="rounded-full bg-white px-1.5 py-0.5 text-[8px] font-semibold text-ink-500">
                {column.count}
              </span>
            </div>
            <div className="space-y-2">
              {column.jobs.map((job, index) => (
                <div className="rounded-md border border-gray-200 bg-white p-2.5 shadow-sm" key={job}>
                  <span className={cn("block h-1 w-7 rounded-full", index ? "bg-blue-500" : "bg-emerald-500")} />
                  <p className="mt-2 text-[10px] font-semibold leading-4 text-ink-900">{job}</p>
                  <p className="mt-1 truncate text-[8px] text-ink-500">Northstar Labs</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 rounded-md border border-amber-100 bg-amber-50 px-4 py-3">
        <CalendarClock className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-amber-950">Follow-up due today</p>
          <p className="truncate text-[10px] text-amber-800">Send portfolio note to Northstar recruiter</p>
        </div>
      </div>
    </PreviewShell>
  );
}

export function HeroFeaturePreview({
  copy,
  jobs,
  labels
}: {
  copy: HeroJobsPreviewCopy;
  jobs: HeroPreviewJob[];
  labels: HeroFeatureLabels;
}) {
  const [activeFeature, setActiveFeature] = useState<FeatureKey>("jobs");
  const features: { icon: typeof Search; key: FeatureKey; label: string }[] = [
    { icon: Search, key: "jobs", label: labels.jobs },
    { icon: FileText, key: "resume", label: labels.resume },
    { icon: Sparkles, key: "coverLetter", label: labels.coverLetter },
    { icon: ListChecks, key: "tracker", label: labels.tracker }
  ];

  return (
    <div className="w-[calc(100vw-32px)] min-w-0 max-w-[358px] sm:w-full sm:max-w-full">
      <div aria-live="polite">
        {activeFeature === "jobs" ? <JobsPreview copy={copy} jobs={jobs} /> : null}
        {activeFeature === "resume" ? <ResumePreview /> : null}
        {activeFeature === "coverLetter" ? <CoverLetterPreview /> : null}
        {activeFeature === "tracker" ? <TrackerPreview /> : null}
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2" aria-label="Product preview" role="group">
        {features.map((feature) => (
          <button
            aria-pressed={activeFeature === feature.key}
            className={cn(
              "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
              activeFeature === feature.key
                ? "border-black bg-black text-white shadow-sm"
                : "border-gray-200 bg-white text-ink-600 hover:border-brand-200 hover:text-brand-700"
            )}
            key={feature.key}
            onClick={() => setActiveFeature(feature.key)}
            type="button"
          >
            <feature.icon className="h-3.5 w-3.5" aria-hidden="true" />
            {feature.label}
          </button>
        ))}
      </div>
    </div>
  );
}
