"use client";

import { FormEvent, useMemo, useState } from "react";
import { ArrowRight, Building2, CalendarClock, Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type DemoStage = "interested" | "applied" | "interview" | "offer";

type DemoApplication = {
  company: string;
  id: number;
  nextAction: string;
  role: string;
  stage: DemoStage;
};

const stages: Array<{ label: string; value: DemoStage }> = [
  { label: "Interested", value: "interested" },
  { label: "Applied", value: "applied" },
  { label: "Interview", value: "interview" },
  { label: "Offer", value: "offer" }
];

const initialApplications: DemoApplication[] = [
  {
    company: "Northstar Labs",
    id: 1,
    nextAction: "Send portfolio follow-up tomorrow",
    role: "Product Designer",
    stage: "applied"
  },
  {
    company: "Aperture",
    id: 2,
    nextAction: "Tailor resume to research methods",
    role: "UX Researcher",
    stage: "interested"
  },
  {
    company: "Vertex",
    id: 3,
    nextAction: "Prepare three project stories",
    role: "Senior UX Designer",
    stage: "interview"
  }
];

export function PublicTrackerDemo() {
  const [applications, setApplications] = useState(initialApplications);
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");

  const groupedApplications = useMemo(
    () =>
      Object.fromEntries(
        stages.map((stage) => [
          stage.value,
          applications.filter((application) => application.stage === stage.value)
        ])
      ) as Record<DemoStage, DemoApplication[]>,
    [applications]
  );

  function addApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanCompany = company.trim();
    const cleanRole = role.trim();
    if (!cleanCompany || !cleanRole) return;

    setApplications((current) => [
      ...current,
      {
        company: cleanCompany,
        id: Date.now(),
        nextAction: "Review the role and choose a next action",
        role: cleanRole,
        stage: "interested"
      }
    ]);
    setCompany("");
    setRole("");
  }

  function moveApplication(id: number, stage: DemoStage) {
    setApplications((current) =>
      current.map((application) =>
        application.id === id ? { ...application, stage } : application
      )
    );
  }

  return (
    <section aria-labelledby="tracker-demo-title" className="border-y border-gray-200 bg-gray-50 py-10 sm:py-14">
      <div className="container-shell">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-700">Interactive browser preview</p>
            <h2 className="mt-2 text-3xl font-semibold text-ink-900" id="tracker-demo-title">
              Track the role, stage, and next action
            </h2>
            <p className="mt-3 leading-7 text-ink-600">
              Preview entries stay in this page and clear on refresh. The account tracker adds secure syncing, follow-up dates, notes, listing health, and application history.
            </p>
          </div>
          <Button asChild href="/account/job-tracker" size="lg">
            Open the full tracker
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-soft">
          <form className="grid gap-3 border-b border-gray-200 p-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={addApplication}>
            <label className="text-sm font-medium text-ink-700">
              Role
              <input
                className="mt-1.5 h-11 w-full rounded-md border border-gray-200 px-3 text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                maxLength={80}
                onChange={(event) => setRole(event.target.value)}
                placeholder="e.g. Data analyst"
                value={role}
              />
            </label>
            <label className="text-sm font-medium text-ink-700">
              Company
              <input
                className="mt-1.5 h-11 w-full rounded-md border border-gray-200 px-3 text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                maxLength={80}
                onChange={(event) => setCompany(event.target.value)}
                placeholder="e.g. Acme"
                value={company}
              />
            </label>
            <Button className="self-end" disabled={!role.trim() || !company.trim()} size="lg" type="submit">
              <Plus aria-hidden="true" className="h-4 w-4" />
              Add
            </Button>
          </form>

          <div className="grid min-h-[360px] gap-px bg-gray-200 md:grid-cols-4">
            {stages.map((stage) => (
              <section className="min-w-0 bg-gray-50 p-3" key={stage.value}>
                <div className="flex h-8 items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink-800">{stage.label}</h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-ink-500">
                    {groupedApplications[stage.value].length}
                  </span>
                </div>
                <div className="mt-2 space-y-3">
                  {groupedApplications[stage.value].map((application) => (
                    <article className="rounded-md border border-gray-200 bg-white p-3 shadow-sm" key={application.id}>
                      <h4 className="font-semibold text-ink-900">{application.role}</h4>
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
                        <Building2 aria-hidden="true" className="h-3.5 w-3.5" />
                        {application.company}
                      </p>
                      <p className="mt-3 flex items-start gap-1.5 text-xs leading-5 text-ink-600">
                        <CalendarClock aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        {application.nextAction}
                      </p>
                      <label className="mt-3 block text-xs font-semibold text-ink-500">
                        Application stage
                        <select
                          aria-label={`Stage for ${application.role} at ${application.company}`}
                          className="mt-1 h-9 w-full rounded-md border border-gray-200 bg-white px-2 text-sm text-ink-800"
                          onChange={(event) => moveApplication(application.id, event.target.value as DemoStage)}
                          value={application.stage}
                        >
                          {stages.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-gray-200 px-4 py-3 text-sm text-ink-500">
            <span>{applications.length} preview applications</span>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-md px-3 font-semibold text-ink-700 hover:bg-gray-100"
              onClick={() => setApplications(initialApplications)}
              type="button"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Reset preview
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
