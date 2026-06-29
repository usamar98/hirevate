import Link from "next/link";
import { ArrowUpRight, BadgeDollarSign, Building2, CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FreshnessBadge } from "@/components/jobs/freshness-badge";
import { getJobCompensationLabel } from "@/lib/jobs/compensation";
import { getJobLocationLabel, getWorkModeLabel, getWorkModeTone } from "@/lib/jobs/display";
import { getJobPath } from "@/lib/jobs/seo";
import { getJobSourceTrust } from "@/lib/jobs/sources";
import { formatRelativeDate } from "@/lib/utils";
import type { JobWithCompany } from "@/types/database";

export function JobCard({
  job
}: {
  isSaved?: boolean;
  job: JobWithCompany;
  showSave?: boolean;
}) {
  const companyName = job.companies?.name ?? "Unknown company";
  const jobPath = getJobPath(job);
  const compensationLabel = getJobCompensationLabel(job);
  const locationLabel = getJobLocationLabel(job);
  const sourceTrust = getJobSourceTrust(job);

  return (
    <Card className="p-5 transition hover:border-brand-100 hover:shadow-soft">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={getWorkModeTone(job.remote_type)}>{getWorkModeLabel(job.remote_type)}</Badge>
            <FreshnessBadge score={job.freshness_score} />
            <Badge tone={sourceTrust.isEmployerOrAtsApply ? "green" : "blue"}>
              {sourceTrust.label}
            </Badge>
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
              Discovered {formatRelativeDate(job.discovered_at)}
            </span>
            {compensationLabel ? (
              <span className="inline-flex items-center gap-1.5">
                <BadgeDollarSign className="h-4 w-4" aria-hidden="true" />
                {compensationLabel}
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {job.apply_url ? (
            <Button asChild href={job.apply_url} target="_blank" rel="noopener noreferrer">
              {sourceTrust.applyCta}
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
          <Button asChild href={jobPath} variant="outline">
            View details
          </Button>
        </div>
      </div>
    </Card>
  );
}
