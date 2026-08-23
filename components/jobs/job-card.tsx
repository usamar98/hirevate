import Link from "next/link";
import { ArrowUpRight, BadgeDollarSign, Building2, CalendarDays, MapPin, Target } from "lucide-react";
import { CompanyLogo } from "@/components/company-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FreshnessBadge } from "@/components/jobs/freshness-badge";
import { JobSourceAttribution } from "@/components/jobs/job-source-attribution";
import { getJobCompensationLabel } from "@/lib/jobs/compensation";
import { getJobLocationLabel, getWorkModeLabel, getWorkModeTone } from "@/lib/jobs/display";
import { getJobPath } from "@/lib/jobs/seo";
import { classifyStudentJob } from "@/lib/jobs/student-part-time";
import { cn, formatRelativeDate } from "@/lib/utils";
import type { JobWithCompany } from "@/types/database";

const jobCardColors = [
  "border-sky-100 bg-sky-50/60 hover:border-sky-200",
  "border-violet-100 bg-violet-50/60 hover:border-violet-200",
  "border-amber-100 bg-amber-50/60 hover:border-amber-200"
] as const;

function getJobCardColor(seed: string) {
  const hash = Array.from(seed).reduce((total, character) => total + character.charCodeAt(0), 0);
  return jobCardColors[hash % jobCardColors.length];
}

export function JobCard({
  canApply,
  hasAccount,
  job,
  showApplyAction = true,
  showStudentSignals = false
}: {
  canApply: boolean;
  hasAccount: boolean;
  isSaved?: boolean;
  job: JobWithCompany;
  showApplyAction?: boolean;
  showSave?: boolean;
  showStudentSignals?: boolean;
}) {
  const companyName = job.companies?.name ?? "Unknown company";
  const jobPath = getJobPath(job);
  const compensationLabel = getJobCompensationLabel(job);
  const locationLabel = getJobLocationLabel(job);
  const studentClassification = showStudentSignals ? classifyStudentJob(job) : null;
  const hasEligibilityEvidence = studentClassification?.signals.some((signal) =>
    ["cpt-opt-mentioned", "authorization-required", "sponsorship-unavailable"].includes(signal.key)
  );

  return (
    <Card className={cn("p-5 transition hover:shadow-soft", getJobCardColor(job.id))}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <CompanyLogo
            className="mt-1"
            companyName={companyName}
            size="lg"
            website={job.companies?.website}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={getWorkModeTone(job.remote_type)}>{getWorkModeLabel(job.remote_type)}</Badge>
              <FreshnessBadge score={job.freshness_score} />
              {studentClassification?.signals.slice(0, 4).map((signal) => (
                <Badge key={signal.key} tone={signal.tone}>{signal.label}</Badge>
              ))}
              {studentClassification?.hours ? (
                <Badge tone="gray">
                  {studentClassification.hours.min
                    ? `${studentClassification.hours.min}–${studentClassification.hours.max} hours/week`
                    : `Up to ${studentClassification.hours.max} hours/week`}
                </Badge>
              ) : null}
              {studentClassification && !hasEligibilityEvidence ? (
                <Badge tone="gray">Eligibility not stated</Badge>
              ) : null}
              <JobSourceAttribution externalId={job.external_id} source={job.source} />
            </div>
            <Link href={jobPath} className="group mt-4 block">
              <h2 className="text-xl font-semibold leading-7 text-ink-900 group-hover:text-brand-600">
                {job.title}
              </h2>
            </Link>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                {companyName}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {locationLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Refreshed {formatRelativeDate(job.last_seen_at ?? job.updated_at ?? job.discovered_at)}
              </span>
              {compensationLabel ? (
                <span className="inline-flex items-center gap-1.5">
                  <BadgeDollarSign className="h-4 w-4" aria-hidden="true" />
                  {compensationLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {showApplyAction && job.apply_url && canApply ? (
            <form action={`/api/jobs/${job.id}/apply`} method="post" target="_blank">
              <Button type="submit">
                Apply now
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>
          ) : showApplyAction && job.apply_url ? (
            <Button
              asChild
              href={
                hasAccount
                  ? "/pricing?limit=apply-access#plans"
                  : `/signup?redirect=${encodeURIComponent(jobPath)}`
              }
            >
              {hasAccount ? "Upgrade to apply" : "Sign up to apply"}
            </Button>
          ) : null}
          <Button asChild href={jobPath} variant="outline">
            View details
          </Button>
          <Button asChild href={`${jobPath}#resume-match`} variant="outline">
            <Target className="h-4 w-4" aria-hidden="true" />
            Resume match
          </Button>
        </div>
      </div>
    </Card>
  );
}
