import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarClock, ClipboardList, FileText, Send, Target } from "lucide-react";
import {
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
import { getJobTrackerDashboard } from "@/lib/job-tracker/queries";
import {
  getJobApplicationStatusMeta,
  jobApplicationStatusOptions
} from "@/lib/job-tracker/status";
import { formatDate } from "@/lib/utils";
import type { JobApplication } from "@/types/database";

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
  updated: "Tracker updated.",
  deleted: "Tracked job removed."
};

const errorMessages: Record<string, string> = {
  invalid: "Check the form fields and try again.",
  setup: "Job tracker needs database setup. Run supabase/migrations/007_job_tracker.sql in Supabase.",
  save: "We could not save that job right now.",
  update: "We could not update that job right now.",
  delete: "We could not delete that job right now."
};

function readParam(searchParams: Record<string, string | string[] | undefined> | undefined, key: string) {
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
      <p className="mt-1 text-xs text-ink-500">{detail}</p>
    </Card>
  );
}

function ApplicationRow({ application }: { application: JobApplication }) {
  const status = getJobApplicationStatusMeta(application.status);

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={status.tone}>{status.label}</Badge>
            {application.next_follow_up_at ? (
              <Badge tone="amber">Follow up {formatDate(application.next_follow_up_at)}</Badge>
            ) : null}
          </div>
          <h3 className="mt-3 text-xl font-semibold text-ink-900">{application.job_title}</h3>
          <p className="mt-1 text-sm text-ink-500">
            {application.company}
            {application.location ? ` - ${application.location}` : ""}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-500">
            {application.applied_at ? <span>Applied {formatDate(application.applied_at)}</span> : null}
            {application.salary_range ? <span>{application.salary_range}</span> : null}
            {application.contact_name ? <span>Contact: {application.contact_name}</span> : null}
          </div>
          {application.notes ? (
            <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-600">{application.notes}</p>
          ) : null}
          {application.job_url ? (
            <Link
              className="mt-3 inline-flex text-sm font-semibold text-brand-600"
              href={application.job_url}
              target="_blank"
            >
              Open job
            </Link>
          ) : null}
        </div>
        <div className="grid gap-2 sm:grid-cols-[170px_150px_auto] lg:min-w-[460px]">
          <form action={updateJobApplicationStatusAction} className="contents">
            <input name="applicationId" type="hidden" value={application.id} />
            <StatusSelect defaultValue={application.status} />
            <Input
              aria-label="Next follow-up date"
              defaultValue={application.next_follow_up_at ?? ""}
              name="nextFollowUpAt"
              type="date"
            />
            <Button type="submit" variant="outline">
              Update
            </Button>
          </form>
          <form action={deleteJobApplicationAction} className="sm:col-start-3">
            <input name="applicationId" type="hidden" value={application.id} />
            <Button type="submit" variant="danger">
              Delete
            </Button>
          </form>
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
          <h2 className="text-xl font-semibold text-ink-900">Log a job</h2>
          <p className="mt-1 text-sm leading-6 text-ink-500">
            Track status, follow-ups, contacts, and notes for each application.
          </p>
        </div>
        <Button asChild href="/cover-letter" variant="outline">
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
            <span className="text-sm font-semibold text-ink-700">Status</span>
            <StatusSelect defaultValue="interested" />
          </label>
          <Field
            defaultValue={readParam(searchParams, "salaryRange")}
            label="Salary"
            name="salaryRange"
            placeholder="$80k-$110k"
          />
          <Field label="Applied date" name="appliedAt" type="date" />
          <Field label="Follow-up date" name="nextFollowUpAt" type="date" />
          <Field label="Contact name" name="contactName" placeholder="Recruiter or hiring manager" />
          <Field label="Contact email" name="contactEmail" placeholder="name@company.com" type="email" />
        </div>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-ink-700">Notes</span>
          <textarea
            className={textAreaClassName}
            name="notes"
            placeholder="Referral context, application angle, next step, or interview notes."
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

export default async function JobTrackerPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await requireUser("/dashboard/job-tracker");
  const dashboard = await getJobTrackerDashboard(user.id);
  const successMessage = successMessages[readParam(resolvedSearchParams, "trackerSuccess") ?? ""];
  const errorMessage = errorMessages[readParam(resolvedSearchParams, "trackerError") ?? ""];

  return (
    <section className="bg-gray-50 py-10">
      <div className="container-shell space-y-8">
        {successMessage ? (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {successMessage}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        ) : null}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-semibold text-ink-900">Job tracker</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink-500">
              Manage applications from first interest to offer with follow-up dates and notes.
            </p>
          </div>
          <Button asChild href="/jobs">
            Browse jobs
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {!dashboard.configured ? (
          <EmptyState
            title="Job tracker database needs setup"
            description={dashboard.setupMessage ?? "Run the job tracker migration in Supabase."}
            action={
              <Button asChild href="/dashboard">
                Back to dashboard
              </Button>
            }
          />
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard detail="All tracked roles" icon={ClipboardList} label="Tracked" value={dashboard.total} />
              <StatCard detail="Interested, applied, or interviewing" icon={Target} label="Open" value={dashboard.openCount} />
              <StatCard detail="Interview or offer statuses" icon={Send} label="Interviews" value={dashboard.interviews} />
              <StatCard detail="From non-interested applications" icon={CalendarClock} label="Interview rate" value={`${dashboard.interviewRate}%`} />
            </div>

            <CreateApplicationForm searchParams={resolvedSearchParams} />

            {dashboard.followUpsDue.length ? (
              <Card className="border-amber-200 bg-amber-50 p-5">
                <h2 className="text-lg font-semibold text-amber-950">Follow-ups due</h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {dashboard.followUpsDue.map((application) => (
                    <div className="rounded-md border border-amber-100 bg-white p-4" key={application.id}>
                      <p className="font-semibold text-ink-900">{application.job_title}</p>
                      <p className="mt-1 text-sm text-ink-500">{application.company}</p>
                      <p className="mt-2 text-sm font-medium text-amber-800">
                        Due {formatDate(application.next_follow_up_at)}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            ) : null}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-ink-900">Applications</h2>
                <Badge tone={dashboard.total ? "blue" : "gray"}>{dashboard.total} tracked</Badge>
              </div>
              {dashboard.applications.map((application) => (
                <ApplicationRow application={application} key={application.id} />
              ))}
              {dashboard.applications.length === 0 ? (
                <EmptyState
                  title="No tracked jobs yet"
                  description="Add a job manually or open a job detail page and send it into your tracker."
                  action={
                    <Button asChild href="/jobs">
                      Browse jobs
                    </Button>
                  }
                />
              ) : null}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
