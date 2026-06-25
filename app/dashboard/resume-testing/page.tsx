import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ExternalLink,
  FileStack,
  FlaskConical,
  Lightbulb,
  Mail,
  Target,
  Trophy,
  type LucideIcon
} from "lucide-react";
import {
  createResumeAbApplicationAction,
  createResumeAbTestAction,
  deleteResumeAbApplicationAction,
  updateResumeAbApplicationStatusAction
} from "@/app/actions/resume-ab-testing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/lib/auth/session";
import { getResumeAbDashboard, type ResumeAbDashboard } from "@/lib/resume-ab-testing/queries";
import { cn, formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Resume A/B Testing",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

const statusOptions = [
  { label: "Applied", value: "applied" },
  { label: "Interview", value: "interview" },
  { label: "Offer", value: "offer" },
  { label: "Rejected", value: "rejected" }
] as const;

const channelOptions = [
  { label: "Direct apply", value: "direct" },
  { label: "Referral", value: "referral" },
  { label: "Recruiter", value: "recruiter" },
  { label: "Job board", value: "job_board" },
  { label: "Other", value: "other" }
] as const;

const successMessages: Record<string, string> = {
  "test-created": "Resume test created. Start logging applications against version A and B.",
  "application-created": "Application logged. Your experiment analytics have been updated.",
  "application-updated": "Application outcome updated.",
  "application-deleted": "Application removed from the test."
};

const errorMessages: Record<string, string> = {
  setup: "Resume testing database tables are missing. Run migrations 004 and 005 in Supabase SQL Editor.",
  "not-configured": "Supabase browser environment variables are not configured.",
  "invalid-test": "Please name the test and both resume versions.",
  "invalid-application": "Please check the application fields and try again.",
  "missing-test": "That resume test could not be found.",
  "save-failed": "We could not save this resume test data. Please try again.",
  "update-failed": "We could not update that application outcome.",
  "delete-failed": "We could not delete that application."
};

function getSingleParam(params: SearchParams | undefined, key: string) {
  const value = params?.[key];
  return Array.isArray(value) ? value[0] : value;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIsoDate(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatChannel(value: string | null | undefined) {
  return channelOptions.find((option) => option.value === value)?.label ?? "Direct apply";
}

function Field({
  defaultValue,
  label,
  name,
  placeholder,
  required,
  type = "text"
}: {
  defaultValue?: string;
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">{label}</span>
      <Input defaultValue={defaultValue} name={name} placeholder={placeholder} required={required} type={type} />
    </label>
  );
}

function TextArea({
  label,
  name,
  placeholder,
  rows = 3
}: {
  label: string;
  name: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">{label}</span>
      <textarea
        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
        name={name}
        placeholder={placeholder}
        rows={rows}
      />
    </label>
  );
}

function SelectField({
  children,
  label,
  name
}: {
  children: ReactNode;
  label: string;
  name: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">{label}</span>
      <select
        className="h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-ink-900 shadow-sm transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
        name={name}
      >
        {children}
      </select>
    </label>
  );
}

function StatCard({
  detail,
  icon: Icon,
  label,
  value
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="p-5">
      <Icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
      <p className="mt-4 text-sm font-semibold text-ink-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink-900">{value}</p>
      <p className="mt-1 text-sm text-ink-500">{detail}</p>
    </Card>
  );
}

function ActionBanner({ params }: { params: SearchParams | undefined }) {
  const successCode = getSingleParam(params, "resumeTestSuccess");
  const errorCode = getSingleParam(params, "resumeTestError");
  const message = successCode ? successMessages[successCode] : errorCode ? errorMessages[errorCode] : null;
  const isError = Boolean(errorCode);

  if (!message) return null;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium",
        isError
          ? "border-red-100 bg-red-50 text-red-800"
          : "border-emerald-100 bg-emerald-50 text-emerald-800"
      )}
    >
      {isError ? (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span>{message}</span>
    </div>
  );
}

function CreateTestForm() {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-5 w-5 text-brand-600" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-ink-900">Create resume test</h2>
      </div>
      <form action={createResumeAbTestAction} className="mt-5 space-y-4">
        <Field label="Test name" name="name" placeholder="Operations roles Q3" required />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-md border border-gray-200 p-3">
            <Field label="Resume A name" name="resumeAName" placeholder="Impact-led resume" required />
            <TextArea
              label="Resume A angle"
              name="resumeANotes"
              placeholder="More metrics, leadership bullets, stronger summary."
            />
          </div>
          <div className="space-y-3 rounded-md border border-gray-200 p-3">
            <Field label="Resume B name" name="resumeBName" placeholder="Keyword-led resume" required />
            <TextArea
              label="Resume B angle"
              name="resumeBNotes"
              placeholder="More role keywords, tools, and targeted phrasing."
            />
          </div>
        </div>
        <Button type="submit" className="w-full">
          Create A/B test
        </Button>
      </form>
    </Card>
  );
}

function LogApplicationForm({ dashboard }: { dashboard: ResumeAbDashboard }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <BriefcaseBusiness className="h-5 w-5 text-brand-600" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-ink-900">Log application</h2>
      </div>
      {dashboard.tests.length ? (
        <form action={createResumeAbApplicationAction} className="mt-5 space-y-4">
          <SelectField label="Resume test" name="abTestId">
            {dashboard.tests.map((test) => (
              <option key={test.id} value={test.id}>
                {test.name}
              </option>
            ))}
          </SelectField>
          <div className="grid gap-4 md:grid-cols-3">
            <SelectField label="Resume version" name="resumeVariant">
              <option value="A">Version A</option>
              <option value="B">Version B</option>
            </SelectField>
            <SelectField label="Outcome" name="status">
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </SelectField>
            <SelectField label="Channel" name="applicationChannel">
              {channelOptions.map((channel) => (
                <option key={channel.value} value={channel.value}>
                  {channel.label}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Job title" name="jobTitle" placeholder="Product Manager" required />
            <Field label="Company" name="company" placeholder="Acme" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Contact name" name="contactName" placeholder="Recruiter or referral" />
            <Field label="Contact email" name="contactEmail" placeholder="recruiter@company.com" type="email" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field defaultValue={todayIsoDate()} label="Applied date" name="appliedAt" required type="date" />
            <Field label="Interview date" name="interviewAt" type="date" />
            <Field defaultValue={addDaysIsoDate(7)} label="Follow-up date" name="nextFollowUpAt" type="date" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Job URL" name="sourceUrl" placeholder="https://company.com/careers/job" type="url" />
            <Field label="Resume file URL" name="resumeSnapshotUrl" placeholder="https://drive.google.com/..." type="url" />
          </div>
          <TextArea label="Notes" name="notes" placeholder="What changed in this version, referral context, or next step." />
          <Button type="submit" className="w-full">
            Add application
          </Button>
        </form>
      ) : (
        <p className="mt-4 text-sm leading-6 text-ink-500">
          Create a resume test first, then log each application against version A or B.
        </p>
      )}
    </Card>
  );
}

function VariantPerformance({ dashboard }: { dashboard: ResumeAbDashboard }) {
  const maxApplications = Math.max(...dashboard.variantStats.map((stat) => stat.applications), 1);

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink-900">Resume version performance</h2>
          <p className="mt-1 text-sm text-ink-500">Track which resume version produces more interviews.</p>
        </div>
        <Badge tone={dashboard.bestResume ? "green" : "gray"}>
          {dashboard.bestResume ? `Winner: ${dashboard.bestResume.variant}` : "No winner yet"}
        </Badge>
      </div>
      <div className="mt-5 space-y-5">
        {dashboard.variantStats.map((stat) => (
          <div key={stat.variant}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <div>
                <p className="font-semibold text-ink-900">
                  Version {stat.variant}: {stat.resumeName}
                </p>
                <p className="text-ink-500">
                  {stat.interviews} interviews / {stat.applications} applications - {stat.offers} offers - {stat.share}% sample
                </p>
              </div>
              <span className="text-lg font-semibold text-ink-900">{stat.rate}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-100">
              <div
                className={cn("h-2 rounded-full", stat.variant === "A" ? "bg-brand-600" : "bg-amber-500")}
                style={{ width: `${Math.max(stat.applications ? 6 : 0, (stat.applications / maxApplications) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function FunnelCard({ dashboard }: { dashboard: ResumeAbDashboard }) {
  const funnel = [
    { label: "Applied", value: dashboard.funnelStats.applied, tone: "bg-gray-400" },
    { label: "Interview", value: dashboard.funnelStats.interview, tone: "bg-brand-600" },
    { label: "Offer", value: dashboard.funnelStats.offer, tone: "bg-emerald-600" },
    { label: "Rejected", value: dashboard.funnelStats.rejected, tone: "bg-red-500" }
  ];
  const max = Math.max(...funnel.map((item) => item.value), 1);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-brand-600" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-ink-900">Application funnel</h2>
      </div>
      <div className="mt-5 space-y-4">
        {funnel.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-ink-700">{item.label}</span>
              <span className="text-ink-500">{item.value}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-100">
              <div className={cn("h-2 rounded-full", item.tone)} style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function DecisionPanel({ dashboard }: { dashboard: ResumeAbDashboard }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-ink-900">Decision engine</h2>
        </div>
        <Badge tone={dashboard.totalApplications >= 10 ? "green" : "amber"}>
          {dashboard.totalApplications >= 10 ? "Signal building" : "Needs data"}
        </Badge>
      </div>
      <div className="mt-5 space-y-3">
        {dashboard.insightCards.map((insight) => (
          <div className="rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-sm leading-6 text-ink-700" key={insight}>
            {insight}
          </div>
        ))}
      </div>
    </Card>
  );
}

function JobTitlePerformance({ dashboard }: { dashboard: ResumeAbDashboard }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink-900">Job title conversion</h2>
          <p className="mt-1 text-sm text-ink-500">See which target titles convert to interviews.</p>
        </div>
        <Badge tone="blue">{dashboard.jobTitleStats.length} titles</Badge>
      </div>
      <div className="mt-5 space-y-4">
        {dashboard.jobTitleStats.length ? (
          dashboard.jobTitleStats.map((title) => (
            <div
              className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3 last:border-b-0"
              key={title.title}
            >
              <div>
                <p className="font-semibold text-ink-900">{title.title}</p>
                <p className="text-sm text-ink-500">
                  {title.interviews} interviews / {title.applications} applications
                </p>
              </div>
              <span className="text-lg font-semibold text-ink-900">{title.rate}%</span>
            </div>
          ))
        ) : (
          <p className="text-sm leading-6 text-ink-500">No job-title data yet.</p>
        )}
      </div>
    </Card>
  );
}

function TestSummaries({ dashboard }: { dashboard: ResumeAbDashboard }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-brand-600" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-ink-900">Test summaries</h2>
        </div>
        <Badge tone="gray">{dashboard.testSummaries.length} tests</Badge>
      </div>
      <div className="mt-5 space-y-4">
        {dashboard.testSummaries.length ? (
          dashboard.testSummaries.map((test) => (
            <div className="rounded-md border border-gray-100 p-4" key={test.id}>
              <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                <div>
                  <p className="font-semibold text-ink-900">{test.name}</p>
                  <p className="mt-1 text-sm text-ink-500">
                    {test.applications} applications - {test.interviews} interviews - {test.offers} offers
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={test.sampleQuality === "Ready to decide" ? "green" : "amber"}>{test.sampleQuality}</Badge>
                  <span className="text-sm font-semibold text-ink-900">{test.interviewRate}%</span>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink-600">{test.recommendation}</p>
            </div>
          ))
        ) : (
          <p className="text-sm leading-6 text-ink-500">No active tests yet.</p>
        )}
      </div>
    </Card>
  );
}

function FollowUpQueue({ dashboard }: { dashboard: ResumeAbDashboard }) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-brand-600" aria-hidden="true" />
          <h2 className="text-xl font-semibold text-ink-900">Follow-up queue</h2>
        </div>
        <Badge tone={dashboard.followUpQueue.length ? "amber" : "green"}>
          {dashboard.followUpQueue.length ? `${dashboard.followUpQueue.length} due` : "Clear"}
        </Badge>
      </div>
      <div className="mt-5 space-y-4">
        {dashboard.followUpQueue.length ? (
          dashboard.followUpQueue.map((item) => (
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3 last:border-b-0" key={item.id}>
              <div>
                <p className="font-semibold text-ink-900">{item.jobTitle}</p>
                <p className="text-sm text-ink-500">
                  {item.company ?? "Company not set"} - version {item.resumeVariant} - {item.daysSinceApplied} days since apply
                </p>
              </div>
              {item.sourceUrl ? (
                <Link className="text-sm font-semibold text-brand-600" href={item.sourceUrl} target="_blank">
                  Open
                </Link>
              ) : null}
            </div>
          ))
        ) : (
          <p className="text-sm leading-6 text-ink-500">No follow-ups due.</p>
        )}
      </div>
    </Card>
  );
}

function RecentApplications({ dashboard }: { dashboard: ResumeAbDashboard }) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-gray-100 p-5">
        <h2 className="text-xl font-semibold text-ink-900">Recent applications</h2>
        <p className="mt-1 text-sm text-ink-500">Update outcomes as replies come in.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
            <tr>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Resume</th>
              <th className="px-5 py-3">Follow-up</th>
              <th className="px-5 py-3">Outcome</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {dashboard.applications.slice(0, 20).map((application) => (
              <tr key={application.id}>
                <td className="px-5 py-4">
                  <p className="font-semibold text-ink-900">{application.job_title}</p>
                  <p className="text-ink-500">{application.company ?? "Company not set"}</p>
                  {application.contact_name || application.contact_email ? (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-500">
                      <Mail className="h-3 w-3" aria-hidden="true" />
                      {application.contact_name ?? application.contact_email}
                    </p>
                  ) : null}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col items-start gap-2">
                    <Badge tone={application.resume_variant === "A" ? "blue" : "amber"}>
                      Version {application.resume_variant}
                    </Badge>
                    <span className="text-xs text-ink-500">{formatChannel(application.application_channel)}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-ink-500">
                  <p>Applied {formatDate(application.applied_at)}</p>
                  <p className="mt-1 text-xs">Follow up {formatDate(application.next_follow_up_at)}</p>
                </td>
                <td className="px-5 py-4">
                  <form action={updateResumeAbApplicationStatusAction} className="flex min-w-[260px] gap-2">
                    <input name="applicationId" type="hidden" value={application.id} />
                    <select
                      className="h-9 rounded-md border border-gray-200 bg-white px-2 text-sm text-ink-900"
                      defaultValue={application.status}
                      name="status"
                    >
                      {statusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                    <Input
                      className="h-9 max-w-[145px]"
                      defaultValue={application.interview_at ?? ""}
                      name="interviewAt"
                      type="date"
                    />
                    <Button size="sm" type="submit" variant="outline">
                      Save
                    </Button>
                  </form>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {application.source_url ? (
                      <Button asChild href={application.source_url} rel="noreferrer" size="sm" target="_blank" variant="outline">
                        Job
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    ) : null}
                    {application.resume_snapshot_url ? (
                      <Button
                        asChild
                        href={application.resume_snapshot_url}
                        rel="noreferrer"
                        size="sm"
                        target="_blank"
                        variant="outline"
                      >
                        Resume
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    ) : null}
                    <form action={deleteResumeAbApplicationAction}>
                      <input name="applicationId" type="hidden" value={application.id} />
                      <Button size="sm" type="submit" variant="ghost">
                        Delete
                      </Button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {dashboard.applications.length === 0 ? (
              <tr>
                <td className="px-5 py-8 text-center text-ink-500" colSpan={5}>
                  No applications logged yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SetupRequired({ message }: { message: string | null }) {
  return (
    <EmptyState
      title="Resume testing database needs setup"
      description={message ?? "Run the resume A/B testing migrations in Supabase SQL Editor, then reload this dashboard."}
      action={
        <Button asChild href="/dashboard">
          Back to dashboard
        </Button>
      }
    />
  );
}

export default async function ResumeTestingPage({
  searchParams
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await requireUser("/dashboard/resume-testing");
  const dashboard = await getResumeAbDashboard(user.id);

  return (
    <section className="bg-gray-50 py-10">
      <div className="container-shell space-y-8">
        <ActionBanner params={resolvedSearchParams} />

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-semibold text-ink-900">Resume A/B testing</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink-500">
              Compare two resume versions, log applications, and measure which resumes and job
              titles convert into interviews.
            </p>
          </div>
          <Button asChild href="/resume-builder" variant="outline">
            Build resume
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {!dashboard.configured ? (
          <SetupRequired message={dashboard.setupMessage} />
        ) : (
          <>
            {dashboard.setupMessage ? (
              <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                {dashboard.setupMessage}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                detail="Logged applications across tests"
                icon={FileStack}
                label="Applications"
                value={dashboard.totalApplications}
              />
              <StatCard
                detail="Interview or offer outcomes"
                icon={Trophy}
                label="Interviews"
                value={dashboard.interviews}
              />
              <StatCard
                detail="Applications that became interviews"
                icon={BarChart3}
                label="Interview rate"
                value={`${dashboard.interviewRate}%`}
              />
              <StatCard
                detail={dashboard.bestJobTitle ? `${dashboard.bestJobTitle.rate}% interview rate` : "Log more applications"}
                icon={BriefcaseBusiness}
                label="Best job title"
                value={dashboard.bestJobTitle?.title ?? "No data"}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <CreateTestForm />
              <LogApplicationForm dashboard={dashboard} />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <DecisionPanel dashboard={dashboard} />
              <FunnelCard dashboard={dashboard} />
              <FollowUpQueue dashboard={dashboard} />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <VariantPerformance dashboard={dashboard} />
              <JobTitlePerformance dashboard={dashboard} />
            </div>

            <TestSummaries dashboard={dashboard} />
            <RecentApplications dashboard={dashboard} />
          </>
        )}
      </div>
    </section>
  );
}
