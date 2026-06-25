import Link from "next/link";
import { ArrowUpRight, Building2, CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FreshnessBadge } from "@/components/jobs/freshness-badge";
import { SaveJobButton } from "@/components/jobs/save-job-button";
import { getJobSourceLabel } from "@/lib/jobs/sources";
import { formatRelativeDate } from "@/lib/utils";
import type { JobWithCompany } from "@/types/database";

export function JobCard({
  isSaved,
  job,
  showSave = true
}: {
  isSaved: boolean;
  job: JobWithCompany;
  showSave?: boolean;
}) {
  const companyName = job.companies?.name ?? "Unknown company";
  const remoteTone = job.remote_type === "remote" ? "green" : job.remote_type === "hybrid" ? "blue" : "gray";
  const sourceLabel = getJobSourceLabel(job.source);

  return (
    <Card className="p-5 transition hover:border-brand-100 hover:shadow-soft">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={job.source === "adzuna" ? "green" : job.source === "serpapi" ? "amber" : "blue"}>
              {sourceLabel}
            </Badge>
            <Badge tone={remoteTone}>{job.remote_type ?? "onsite"}</Badge>
            <FreshnessBadge score={job.freshness_score} />
          </div>
          <Link href={`/jobs/${job.id}`} className="group mt-4 block">
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
              {job.location ?? "Location not listed"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" aria-hidden="true" />
              Discovered {formatRelativeDate(job.discovered_at)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {job.apply_url ? (
            <Button asChild href={job.apply_url} target="_blank" rel="noopener noreferrer">
              Direct apply
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
          {showSave ? <SaveJobButton isSaved={isSaved} jobId={job.id} /> : null}
          <Button asChild href={`/jobs/${job.id}`} variant="outline">
            View details
          </Button>
        </div>
      </div>
    </Card>
  );
}
