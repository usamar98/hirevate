import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  Archive,
  ArrowRight,
  CalendarClock,
  ClipboardList,
  ExternalLink,
  FileText,
  Flag,
  HeartPulse,
  RotateCcw,
  Send,
  Target,
  Trash2
} from "lucide-react";
import {
  archiveJobApplicationAction,
  createJobApplicationAction,
  deleteJobApplicationAction,
  updateJobApplicationStatusAction
} from "@/app/actions/job-tracker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth/session";
import {
  getJobTrackerDashboard,
  type JobTrackerView
} from "@/lib/job-tracker/queries";
import {
  getApplicationProgress,
  getJobApplicationStatusMeta,
  getListingStatusMeta,
  getNextActionSuggestion,
  jobApplicationStatusOptions,
  priorityOptions
} from "@/lib/job-tracker/status";
import { formatDate } from "@/lib/utils";
import type {
  JobApplication,
  JobApplicationEvent,
  JobApplicationPriority
} from "@/types/database";

export const metadata: Metadata = {
  title: "Job Tracker",
  robots: {
    index: false,
    follow: false
  }
};

const selectClassName =
  "h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-ink-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";
const textAreaClassName =
  "min-h-[96px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";

const successMessages: Record<string, string> = {
  created: "Job added to your tracker.",
  updated: "Application plan updated.",
  archived: "Application archived without losing its history.",
  restored: "Application restored to the active pipeline.",
  deleted: "Tracked job permanently removed."
};

const errorMessages: Record<string, string> = {
  invalid: "Check the form fields and try again.",
  setup:
    "Run supabase/migrations/010_job_tracker_lifecycle.sql in the Supabase SQL Editor to enable the professional tracker.",
  save: "We could not save that job right now.",
  update: "We could not update that job right now.",
  delete: "We could not delete that job right now."
};

function readParam(
  searchParams: Record<string, string | string[] | undefined> | undefined,
  key: string
) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] : value;
}

function Field({
  defaultValue,
  label,
  name,
  placeholder,
  required,
  type = "text"
}: {
  defaultValue?: string | null;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-semibold text-ink-700">{label}</span>
      <Input
        defaultValue={defaultValue ?? ""}
        name={name}
        placeholder={placeholder}
        required={required}
        type={type}
      />
    </label>
  );
}

function StatusSelect({ defaultValue }: { defaultValue: JobApplication["status"] }) {
  return (
    <select className={selectClassName} defaultValue={defaultValue} name="status">
      {jobApplicationStatusOptions.map((status) => (
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      ))}
    </select>
  );
}

function PrioritySelect({ defaultValue }: { defaultValue: JobApplicationPriority }) {
  return (
    <select className={selectClassName} defaultValue={defaultValue} name="priority">
      {priorityOptions.map((priority) => (
        <option key={priority.value} value={priority.value}>
          {priority.label}
        </option>
      ))}
    </select>
  );
}

function StatCard({
  detail,
  icon: Icon,
  label,
  value
}: {
  detail: string;
  icon: typeof ClipboardList;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="p-5">
      <Icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
      <p className="mt-4 text-sm font-semibold text-ink-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink-900">{value}</p>
      <p className="mt-1 text-xs leading-5 text-ink-500">{detail}</p>
    </Card>
  );
}

function ApplicationRow({
  application,
  archived
}: {
  application: JobApplication;
  archived: boolean;
}) {
  const status = getJobApplicationStatusMeta(application.status);
  const listing = getListingStatusMeta(application.listing_status);
  const progress = getApplicationProgress(application.status);
  const nextAction =
    application.next_action || getNextActionSuggestion(application.status);

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={status.tone}>{status.label}</Badge>
            <Badge tone={listing.tone}>{listing.label}</Badge>
            <Badge tone={application.priority === "high" ? "red" : "gray"}>
              {application.priority} priority
            </Badge>
            {application.next_follow_up_at ? (
              <Badge tone="amber">
                Follow up {formatDate(application.next_follow_up_at)}
              </Badge>
            ) : null}
          </div>

          <h3 className="mt-3 text-xl font-semibold text-ink-900">
            {application.job_title}
          </h3>
          <p className="mt-1 text-sm text-ink-500">
            {application.company}
            {application.location ? " - " + application.location : ""}
          </p>

          <div className="mt-4 max-w-xl">
            <div className="flex items-center justify-between text-xs font-semibold text-ink-500">
              <span>Application progress</span>
              <span>
                {progress.current ? "Stage " + progress.current + " of " + progress.total : status.label}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-brand-600"
                style={{ width: String(progress.percent) + "%" }}
              />
            </div>
          </div>

          <div className="mt-4 border-l-2 border-brand-200 pl-3">
            <p className="text-xs font-semibold uppercase text-ink-500">Next action</p>
            <p className="mt-1 text-sm leading-6 text-ink-700">{nextAction}</p>
          </div>

          {application.listing_status === "closed" ||
          application.listing_status === "unavailable" ? (
            <p className="mt-4 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-900">
              The source listing is no longer active. Your application history remains here until
              you archive or delete it.
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-500">
            {application.applied_at ? (
              <span>Applied {formatDate(application.applied_at)}</span>
            ) : null}
            {application.salary_range ? <span>{application.salary_range}</span> : null}
            {application.contact_name ? <span>Contact: {application.contact_name}</span> : null}
            {application.listing_last_checked_at ? (
              <span>Listing checked {formatDate(application.listing_last_checked_at)}</span>
            ) : null}
          </div>

          {application.notes ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-600">
              {application.notes}
            </p>
          ) : null}

          {application.job_url ? (
            <Link
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700"
              href={application.job_url}
              rel="noopener noreferrer"
              target="_blank"
            >
              Open source listing
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : null}
        </div>

        <div className="w-full xl:max-w-[480px]">
          <form
            action={updateJobApplicationStatusAction}
            className="grid gap-3 sm:grid-cols-2"
          >
            <input name="applicationId" type="hidden" value={application.id} />
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase text-ink-500">Stage</span>
              <StatusSelect defaultValue={application.status} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase text-ink-500">Priority</span>
              <PrioritySelect defaultValue={application.priority} />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase text-ink-500">
                Follow-up date
              </span>
              <Input
                defaultValue={application.next_follow_up_at ?? ""}
                name="nextFollowUpAt"
                type="date"
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase text-ink-500">
                Next action
              </span>
              <Input
                defaultValue={application.next_action ?? ""}
                name="nextAction"
                placeholder="Prepare interview examples"
              />
            </label>
            <Button className="sm:col-span-2" type="submit" variant="outline">
              Update application plan
            </Button>
          </form>

          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <form action={archiveJobApplicationAction}>
              <input name="applicationId" type="hidden" value={application.id} />
              <input
                name="archiveAction"
                type="hidden"
                value={archived ? "restore" : "archive"}
              />
              <Button type="submit" variant="outline">
                {archived ? (
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Archive className="h-4 w-4" aria-hidden="true" />
                )}
                {archived ? "Restore" : "Archive"}
              </Button>
            </form>
            <form action={deleteJobApplicationAction}>
              <input name="applicationId" type="hidden" value={application.id} />
              <Button type="submit" variant="danger">
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete
              </Button>
            </form>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CreateApplicationForm({
  searchParams
}: {
  searchParams: Record<string, string | string[] | undefined> | undefined;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h2 className="text-xl font-semibold text-ink-900">Add an opportunity</h2>
          <p className="mt-1 text-sm leading-6 text-ink-500">
            Set the stage, priority, next action, and follow-up date from the start.
          </p>
        </div>
        <Button asChild href="/account/cover-letters" variant="outline">
          Cover letter
          <FileText className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <form action={createJobApplicationAction} className="mt-5 space-y-4">
        <input name="jobId" type="hidden" value={readParam(searchParams, "jobId") ?? ""} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            defaultValue={readParam(searchParams, "jobTitle")}
            label="Job title"
            name="jobTitle"
            placeholder="Product Manager"
            required
          />
          <Field
            defaultValue={readParam(searchParams, "company")}
            label="Company"
            name="company"
            placeholder="Acme"
            required
          />
          <Field
            defaultValue={readParam(searchParams, "location")}
            label="Location"
            name="location"
            placeholder="Remote, London"
          />
          <Field
            defaultValue={readParam(searchParams, "jobUrl")}
            label="Job URL"
            name="jobUrl"
            placeholder="https://company.com/careers/job"
            type="url"
          />
          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-ink-700">Stage</span>
            <StatusSelect defaultValue="interested" />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-semibold text-ink-700">Priority</span>
            <PrioritySelect defaultValue="medium" />
          </label>
          <Field
            defaultValue={readParam(searchParams, "salaryRange")}
            label="Salary"
            name="salaryRange"
            placeholder="$80k-$110k"
          />
          <Field label="Applied date" name="appliedAt" type="date" />
          <Field label="Follow-up date" name="nextFollowUpAt" type="date" />
          <Field
            label="Next action"
            name="nextAction"
            placeholder="Tailor resume and apply"
          />
          <Field
            label="Contact name"
            name="contactName"
            placeholder="Recruiter or hiring manager"
          />
          <Field
            label="Contact email"
            name="contactEmail"
            placeholder="name@company.com"
            type="email"
          />
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-ink-700">Notes</span>
          <textarea
            className={textAreaClassName}
            name="notes"
            placeholder="Referral context, application angle, interview notes, or decision criteria."
          />
        </label>
        <Button type="submit">
          <Send className="h-4 w-4" aria-hidden="true" />
          Add to tracker
        </Button>
      </form>
    </Card>
  );
}

function ActivityFeed({ events }: { events: JobApplicationEvent[] }) {
  if (!events.length) return null;

  const labels: Record<JobApplicationEvent["event_type"], string> = {
    created: "Application added",
    stage_changed: "Application stage changed",
    archived: "Application archived",
    restored: "Application restored"
  };

  return (
    <section className="border-t border-gray-200 pt-7">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-brand-600" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-ink-900">Recent activity</h2>
      </div>
      <div className="mt-4 divide-y divide-gray-100 border-y border-gray-100">
        {events.slice(0, 8).map((event) => (
          <div className="flex flex-wrap justify-between gap-2 py-3 text-sm" key={event.id}>
            <span className="font-medium text-ink-700">
              {labels[event.event_type]}
              {event.from_status && event.to_status
                ? ": " + event.from_status.replaceAll("_", " ") + " to " + event.to_status.replaceAll("_", " ")
                : ""}
            </span>
            <span className="text-ink-500">{formatDate(event.created_at)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function JobTrackerPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await requireUser("/account/job-tracker");
  const view: JobTrackerView =
    readParam(resolvedSearchParams, "view") === "archived" ? "archived" : "active";
  const dashboard = await getJobTrackerDashboard(user.id, view);
  const successMessage =
    successMessages[readParam(resolvedSearchParams, "trackerSuccess") ?? ""];
  const errorMessage =
    errorMessages[readParam(resolvedSearchParams, "trackerError") ?? ""];

  return (
    <section className="bg-gray-50 py-10">
      <div className="container-shell space-y-8">
        {successMessage ? (
          <div className="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {successMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-semibold text-ink-900">Application command center</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-ink-500">
              Move every opportunity from interest to decision, plan the next action, and keep the
              application record even when a linked job listing closes.
            </p>
          </div>
          <Button asChild href="/jobs">
            Browse jobs
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {!dashboard.configured ? (
          <EmptyState
            title="Professional tracker needs database setup"
            description={dashboard.setupMessage ?? "Run the tracker lifecycle migration in Supabase."}
            action={
              <Button asChild href="/dashboard">
                Back to dashboard
              </Button>
            }
          />
        ) : (
          <>
            <nav aria-label="Tracker views" className="flex border-b border-gray-200">
              <Link
                className={
                  "px-4 py-3 text-sm font-semibold " +
                  (view === "active"
                    ? "border-b-2 border-brand-600 text-brand-700"
                    : "text-ink-500 hover:text-ink-900")
                }
                href="/account/job-tracker"
              >
                Active pipeline
              </Link>
              <Link
                className={
                  "px-4 py-3 text-sm font-semibold " +
                  (view === "archived"
                    ? "border-b-2 border-brand-600 text-brand-700"
                    : "text-ink-500 hover:text-ink-900")
                }
                href="/account/job-tracker?view=archived"
              >
                Archived ({dashboard.archivedCount})
              </Link>
            </nav>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                detail={view === "archived" ? "Archived records retained" : "Current applications"}
                icon={ClipboardList}
                label={view === "archived" ? "Archived" : "Tracked"}
                value={dashboard.total}
              />
              <StatCard
                detail="Open actions at or past their date"
                icon={CalendarClock}
                label="Follow-ups due"
                value={dashboard.followUpsDue.length}
              />
              <StatCard
                detail="Linked Hirevate listings still active"
                icon={HeartPulse}
                label="Active listings"
                value={dashboard.activeListings}
              />
              <StatCard
                detail="Interviews from submitted applications"
                icon={Target}
                label="Interview rate"
                value={String(dashboard.interviewRate) + "%"}
              />
            </div>

            {view === "active" ? (
              <CreateApplicationForm searchParams={resolvedSearchParams} />
            ) : null}

            {dashboard.followUpsDue.length ? (
              <section className="border-y border-amber-200 bg-amber-50 px-5 py-5">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5 text-amber-700" aria-hidden="true" />
                  <h2 className="text-lg font-semibold text-amber-950">Follow-ups due</h2>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {dashboard.followUpsDue.map((application) => (
                    <div className="border border-amber-100 bg-white p-4" key={application.id}>
                      <p className="font-semibold text-ink-900">{application.job_title}</p>
                      <p className="mt-1 text-sm text-ink-500">{application.company}</p>
                      <p className="mt-2 text-sm font-medium text-amber-800">
                        Due {formatDate(application.next_follow_up_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {dashboard.closedListings > 0 ? (
              <div className="flex gap-3 border-l-2 border-amber-400 bg-white px-4 py-3 text-sm leading-6 text-ink-700">
                <Flag className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                <p>
                  {dashboard.closedListings} linked listing
                  {dashboard.closedListings === 1 ? " is" : "s are"} closed or unavailable. Their
                  application records are preserved.
                </p>
              </div>
            ) : null}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-ink-900">
                  {view === "archived" ? "Archived applications" : "Application pipeline"}
                </h2>
                <Badge tone={dashboard.total ? "blue" : "gray"}>
                  {dashboard.total} {view === "archived" ? "archived" : "active"}
                </Badge>
              </div>
              {dashboard.applications.map((application) => (
                <ApplicationRow
                  application={application}
                  archived={view === "archived"}
                  key={application.id}
                />
              ))}
              {dashboard.applications.length === 0 ? (
                <EmptyState
                  title={view === "archived" ? "No archived applications" : "No tracked jobs yet"}
                  description={
                    view === "archived"
                      ? "Archived applications will appear here with their history intact."
                      : "Add an opportunity manually or send a Hirevate job into your tracker."
                  }
                  action={
                    view === "archived" ? (
                      <Button asChild href="/account/job-tracker">
                        Return to pipeline
                      </Button>
                    ) : (
                      <Button asChild href="/jobs">
                        Browse jobs
                      </Button>
                    )
                  }
                />
              ) : null}
            </div>

            <ActivityFeed events={dashboard.recentActivity} />
          </>
        )}
      </div>
    </section>
  );
}
