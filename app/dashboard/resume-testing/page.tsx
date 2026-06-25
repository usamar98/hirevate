import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BarChart3, BriefcaseBusiness, FileStack, FlaskConical, Trophy, type LucideIcon } from "lucide-react";
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
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Resume A/B Testing"
};

export const dynamic = "force-dynamic";

const statusOptions = [
  { label: "Applied", value: "applied" },
  { label: "Interview", value: "interview" },
  { label: "Offer", value: "offer" },
  { label: "Rejected", value: "rejected" }
] as const;

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function Field({
  label,
  name,
  placeholder,
  required,
  type = "text"
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">{label}</span>
      <Input name={name} placeholder={placeholder} required={required} type={type} />
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

function CreateTestForm() {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-5 w-5 text-brand-600" aria-hidden="true" />
        <h2 className="text-xl font-semibold text-ink-900">Create resume test</h2>
      </div>
      <form action={createResumeAbTestAction} className="mt-5 space-y-4">
        <Field label="Test name" name="name" placeholder="Frontend roles Q3" required />
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
              placeholder="More ATS keywords, tech stack, role-specific phrasing."
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
  const defaultDate = todayIsoDate();

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
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField label="Resume version used" name="resumeVariant">
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
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Job title" name="jobTitle" placeholder="Product Manager" required />
            <Field label="Company" name="company" placeholder="Acme" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">Applied date</span>
              <Input defaultValue={defaultDate} name="appliedAt" required type="date" />
            </label>
            <Field label="Interview date" name="interviewAt" type="date" />
          </div>
          <Field label="Source URL" name="sourceUrl" placeholder="https://company.com/careers/job" type="url" />
          <TextArea label="Notes" name="notes" placeholder="What changed in this version or follow-up plan." />
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
                  {stat.interviews} interviews / {stat.applications} applications - {stat.offers} offers
                </p>
              </div>
              <span className="text-lg font-semibold text-ink-900">{stat.rate}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-gray-100">
              <div
                className="h-2 rounded-full bg-brand-600"
                style={{ width: `${Math.max(6, (stat.applications / maxApplications) * 100)}%` }}
              />
            </div>
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
              <th className="px-5 py-3">Applied</th>
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
                </td>
                <td className="px-5 py-4">
                  <Badge tone={application.resume_variant === "A" ? "blue" : "amber"}>
                    Version {application.resume_variant}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-ink-500">{formatDate(application.applied_at)}</td>
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
                  <form action={deleteResumeAbApplicationAction}>
                    <input name="applicationId" type="hidden" value={application.id} />
                    <Button size="sm" type="submit" variant="ghost">
                      Delete
                    </Button>
                  </form>
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

export default async function ResumeTestingPage() {
  const user = await requireUser("/dashboard/resume-testing");
  const dashboard = await getResumeAbDashboard(user.id);

  return (
    <section className="bg-gray-50 py-10">
      <div className="container-shell space-y-8">
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
          </Button>
        </div>

        {!dashboard.configured ? (
          <EmptyState
            title="Connect Supabase to track resume tests"
            description="Apply the resume A/B testing migration, then reload this dashboard."
          />
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

        <div className="grid gap-5 lg:grid-cols-2">
          <VariantPerformance dashboard={dashboard} />
          <JobTitlePerformance dashboard={dashboard} />
        </div>

        <RecentApplications dashboard={dashboard} />
      </div>
    </section>
  );
}
