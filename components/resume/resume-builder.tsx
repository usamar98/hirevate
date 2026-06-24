"use client";

import {
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  Palette,
  Plus,
  Sparkles,
  Target,
  Trash2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Experience = {
  id: string;
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  bullets: string[];
};

type Project = {
  id: string;
  name: string;
  link: string;
  bullets: string[];
};

type Education = {
  id: string;
  school: string;
  degree: string;
  dates: string;
};

type ResumeDraft = {
  template: "precision" | "modern" | "compact";
  accent: string;
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  targetRole: string;
  targetKeywords: string;
  summary: string;
  skills: string;
  experience: Experience[];
  projects: Project[];
  education: Education[];
  certifications: string;
};

const storageKey = "hirevate-resume-builder-draft-v1";
const unlockKey = "hirevate-resume-builder-export-unlocked";

const initialDraft: ResumeDraft = {
  template: "precision",
  accent: "#2563eb",
  fullName: "Alex Morgan",
  headline: "Senior Software Engineer",
  email: "alex@example.com",
  phone: "+1 555 0148",
  location: "Remote, US",
  website: "linkedin.com/in/alexmorgan",
  targetRole: "Frontend Engineer",
  targetKeywords: "React, TypeScript, Next.js, accessibility, performance, design systems",
  summary:
    "Product-minded engineer specializing in fast, accessible SaaS interfaces. Known for turning ambiguous product ideas into measurable customer-facing workflows.",
  skills:
    "React, TypeScript, Next.js, Node.js, Supabase, PostgreSQL, Tailwind CSS, Accessibility, Performance, Testing",
  experience: [
    {
      id: "exp-1",
      company: "Northstar Labs",
      role: "Senior Software Engineer",
      location: "Remote",
      start: "2022",
      end: "Present",
      bullets: [
        "Led a React and TypeScript rebuild that improved Core Web Vitals pass rate from 62% to 96%.",
        "Built reusable design-system components adopted across 5 product teams.",
        "Partnered with product and support to reduce onboarding drop-off by 18%."
      ]
    },
    {
      id: "exp-2",
      company: "Brightlane",
      role: "Full Stack Engineer",
      location: "New York, NY",
      start: "2019",
      end: "2022",
      bullets: [
        "Shipped customer dashboard workflows used by 40,000 monthly active users.",
        "Reduced API response times by 34% through query optimization and caching."
      ]
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "ATS Resume Intelligence",
      link: "github.com/alex/resume-intelligence",
      bullets: [
        "Created keyword scoring and impact checks for role-specific resume drafts.",
        "Designed print-safe resume templates with browser-native PDF export."
      ]
    }
  ],
  education: [
    {
      id: "edu-1",
      school: "State University",
      degree: "B.S. Computer Science",
      dates: "2015 - 2019"
    }
  ],
  certifications: "AWS Certified Developer, Certified ScrumMaster"
};

function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function splitList(value: string) {
  return value
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function scoreResume(draft: ResumeDraft) {
  const resumeText = [
    draft.headline,
    draft.summary,
    draft.skills,
    draft.experience.flatMap((item) => [item.role, item.company, item.bullets.join(" ")]).join(" "),
    draft.projects.flatMap((item) => [item.name, item.bullets.join(" ")]).join(" ")
  ]
    .join(" ")
    .toLowerCase();
  const keywords = splitList(draft.targetKeywords);
  const matched = keywords.filter((keyword) => resumeText.includes(keyword.toLowerCase()));
  const allBullets = [
    ...draft.experience.flatMap((item) => item.bullets),
    ...draft.projects.flatMap((item) => item.bullets)
  ];
  const metricBullets = allBullets.filter((bullet) => /\d|%|\$|x\b/i.test(bullet));
  const actionBullets = allBullets.filter((bullet) =>
    /built|led|launched|reduced|increased|improved|designed|created|owned|partnered|optimized/i.test(
      bullet
    )
  );

  let score = 30;
  if (draft.fullName && draft.email && draft.headline) score += 10;
  if (draft.summary.length >= 120) score += 10;
  if (draft.experience.length >= 2) score += 12;
  if (splitList(draft.skills).length >= 8) score += 10;
  score += Math.min(16, matched.length * 3);
  score += Math.min(12, metricBullets.length * 3);
  score += Math.min(10, actionBullets.length * 2);

  const suggestions = [
    draft.summary.length < 120 ? "Expand the summary to 2 focused lines with role, domain, and proof." : null,
    matched.length < Math.ceil(keywords.length * 0.6)
      ? "Add more target-role keywords naturally across skills and experience bullets."
      : null,
    metricBullets.length < 3 ? "Add measurable outcomes to at least 3 bullets." : null,
    actionBullets.length < 4 ? "Start bullets with strong verbs like built, led, improved, or reduced." : null,
    draft.projects.length === 0 ? "Add one relevant project to show proof beyond job titles." : null
  ].filter(Boolean) as string[];

  return {
    score: Math.min(98, score),
    matched,
    missing: keywords.filter((keyword) => !matched.includes(keyword)),
    metricBullets,
    suggestions
  };
}

function Field({
  label,
  value,
  onChange,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">{label}</span>
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">{label}</span>
      <textarea
        className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function SectionTitle({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
      <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-700">{title}</h2>
    </div>
  );
}

function ResumePreview({ draft }: { draft: ResumeDraft }) {
  const skills = splitList(draft.skills);
  const certifications = splitList(draft.certifications);

  return (
    <div
      id="resume-preview"
      className={`mx-auto min-h-[980px] w-full max-w-[760px] bg-white p-10 text-ink-900 shadow-soft ${
        draft.template === "compact" ? "text-[12px]" : "text-[13px]"
      }`}
      style={{ borderTop: `6px solid ${draft.accent}` }}
    >
      <div className={draft.template === "modern" ? "grid gap-6 md:grid-cols-[0.9fr_1.7fr]" : ""}>
        <aside className={draft.template === "modern" ? "space-y-6 border-r border-gray-200 pr-5" : "hidden"}>
          <div>
            <p className="text-2xl font-semibold leading-tight">{draft.fullName}</p>
            <p className="mt-1 text-sm font-medium" style={{ color: draft.accent }}>
              {draft.headline}
            </p>
          </div>
          <div className="space-y-1 text-xs text-ink-600">
            <p>{draft.email}</p>
            <p>{draft.phone}</p>
            <p>{draft.location}</p>
            <p>{draft.website}</p>
          </div>
          <PreviewBlock title="Skills" accent={draft.accent}>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span className="rounded-sm bg-gray-100 px-2 py-1 text-[11px]" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
          </PreviewBlock>
        </aside>

        <main className="space-y-6">
          {draft.template !== "modern" ? (
            <header>
              <div className="flex flex-col justify-between gap-3 border-b border-gray-200 pb-5 md:flex-row">
                <div>
                  <h1 className="text-4xl font-semibold leading-tight">{draft.fullName}</h1>
                  <p className="mt-1 text-base font-medium" style={{ color: draft.accent }}>
                    {draft.headline}
                  </p>
                </div>
                <div className="text-sm leading-6 text-ink-600 md:text-right">
                  <p>{draft.email}</p>
                  <p>{draft.phone}</p>
                  <p>{draft.location}</p>
                  <p>{draft.website}</p>
                </div>
              </div>
            </header>
          ) : null}

          <PreviewBlock title="Profile" accent={draft.accent}>
            <p className="leading-6 text-ink-700">{draft.summary}</p>
          </PreviewBlock>

          {draft.template !== "modern" ? (
            <PreviewBlock title="Core Skills" accent={draft.accent}>
              <p className="leading-6 text-ink-700">{skills.join(" / ")}</p>
            </PreviewBlock>
          ) : null}

          <PreviewBlock title="Experience" accent={draft.accent}>
            <div className="space-y-5">
              {draft.experience.map((item) => (
                <div key={item.id}>
                  <div className="flex flex-col justify-between gap-1 md:flex-row">
                    <div>
                      <p className="font-semibold">{item.role}</p>
                      <p className="text-ink-600">{item.company} / {item.location}</p>
                    </div>
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-ink-500">
                      {item.start} - {item.end}
                    </p>
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 leading-6 text-ink-700">
                    {item.bullets.filter(Boolean).map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </PreviewBlock>

          <PreviewBlock title="Projects" accent={draft.accent}>
            <div className="space-y-4">
              {draft.projects.map((item) => (
                <div key={item.id}>
                  <p className="font-semibold">
                    {item.name} <span className="font-normal text-ink-500">{item.link}</span>
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 leading-6 text-ink-700">
                    {item.bullets.filter(Boolean).map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </PreviewBlock>

          <PreviewBlock title="Education" accent={draft.accent}>
            <div className="space-y-2">
              {draft.education.map((item) => (
                <div className="flex flex-col justify-between gap-1 md:flex-row" key={item.id}>
                  <p>
                    <span className="font-semibold">{item.school}</span>, {item.degree}
                  </p>
                  <p className="text-ink-500">{item.dates}</p>
                </div>
              ))}
            </div>
          </PreviewBlock>

          {certifications.length ? (
            <PreviewBlock title="Certifications" accent={draft.accent}>
              <p className="leading-6 text-ink-700">{certifications.join(" / ")}</p>
            </PreviewBlock>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function PreviewBlock({
  title,
  accent,
  children
}: {
  title: string;
  accent: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2
        className="mb-2 border-b pb-1 text-xs font-semibold uppercase tracking-[0.18em]"
        style={{ borderColor: accent, color: accent }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function buildPrintableHtml(draft: ResumeDraft) {
  const preview = document.getElementById("resume-preview");
  const content = preview?.outerHTML ?? "";

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(draft.fullName || "Resume")}</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; background: #fff; color: #111827; font-family: Arial, sans-serif; }
    #resume-preview { min-height: 1122px; width: 794px; max-width: none; margin: 0 auto; box-shadow: none !important; }
    a { color: inherit; }
  </style>
</head>
<body>${content}</body>
</html>`;
}

export function ResumeBuilder({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [draft, setDraft] = useState<ResumeDraft>(initialDraft);
  const [activeTab, setActiveTab] = useState("profile");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState<string | null>(null);

  const analysis = useMemo(() => scoreResume(draft), [draft]);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      try {
        setDraft(JSON.parse(stored) as ResumeDraft);
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

    setIsUnlocked(window.localStorage.getItem(unlockKey) === "true");
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [draft]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");

    if (!sessionId || params.get("checkout") !== "success") return;
    const checkoutSessionId = sessionId;

    async function verifyUnlock() {
      const response = await fetch(
        `/api/stripe/resume-unlock?session_id=${encodeURIComponent(checkoutSessionId)}`
      );
      const payload = (await response.json()) as { unlocked?: boolean; error?: string };

      if (response.ok && payload.unlocked) {
        window.localStorage.setItem(unlockKey, "true");
        setIsUnlocked(true);
        setUnlockMessage("Resume export is unlocked. You can print or save this resume as a PDF.");
        window.history.replaceState(null, "", "/resume-builder");
      } else {
        setCheckoutError(payload.error ?? "Unable to verify payment.");
      }
    }

    verifyUnlock().catch((error) =>
      setCheckoutError(error instanceof Error ? error.message : "Unable to verify payment.")
    );
  }, []);

  function updateDraft(partial: Partial<ResumeDraft>) {
    setDraft((current) => ({ ...current, ...partial }));
  }

  function updateExperience(id: string, partial: Partial<Experience>) {
    setDraft((current) => ({
      ...current,
      experience: current.experience.map((item) => (item.id === id ? { ...item, ...partial } : item))
    }));
  }

  function updateProject(id: string, partial: Partial<Project>) {
    setDraft((current) => ({
      ...current,
      projects: current.projects.map((item) => (item.id === id ? { ...item, ...partial } : item))
    }));
  }

  function updateEducation(id: string, partial: Partial<Education>) {
    setDraft((current) => ({
      ...current,
      education: current.education.map((item) => (item.id === id ? { ...item, ...partial } : item))
    }));
  }

  async function startResumeCheckout() {
    if (!isLoggedIn) {
      window.location.href = "/login?redirect=/resume-builder";
      return;
    }

    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ product: "resume_builder" })
      });
      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        setCheckoutError(payload.error ?? "Unable to start checkout.");
        return;
      }

      window.location.href = payload.url;
    } catch (error) {
      setCheckoutError(error instanceof Error ? error.message : "Unable to start checkout.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  function exportResume() {
    if (!isUnlocked) {
      startResumeCheckout();
      return;
    }

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=1100");
    if (!printWindow) {
      setCheckoutError("Allow pop-ups to print or save your resume.");
      return;
    }

    printWindow.document.write(buildPrintableHtml(draft));
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  return (
    <div className="bg-gray-50">
      <section className="border-b border-gray-200 bg-white">
        <div className="container-shell flex flex-col justify-between gap-6 py-8 lg:flex-row lg:items-end">
          <div>
            <h1 className="text-4xl font-semibold text-ink-900">Resume Builder</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink-500">
              Build a role-targeted resume with ATS scoring, keyword coverage, impact checks, and
              print-ready export.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={exportResume}>
              {isUnlocked ? <Download className="h-4 w-4" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
              {isUnlocked ? "Export resume" : "Unlock export - $2"}
            </Button>
            <Button variant="outline" onClick={() => setDraft(initialDraft)}>
              Reset demo
            </Button>
          </div>
        </div>
      </section>

      <section className="container-shell grid gap-5 py-6 xl:grid-cols-[340px_minmax(0,1fr)_310px]">
        <Card className="h-fit p-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            {(
              [
                { key: "profile", icon: FileText, label: "Profile" },
                { key: "target", icon: Target, label: "Target" },
                { key: "experience", icon: BriefcaseBusiness, label: "Experience" },
                { key: "projects", icon: Award, label: "Projects" },
                { key: "education", icon: GraduationCap, label: "Education" },
                { key: "style", icon: Palette, label: "Style" }
              ] satisfies { key: string; icon: LucideIcon; label: string }[]
            ).map(({ key, icon: Icon, label }) => (
              <button
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-left font-semibold transition ${
                  activeTab === key ? "bg-brand-50 text-brand-700" : "text-ink-600 hover:bg-gray-100"
                }`}
                key={key}
                onClick={() => setActiveTab(key)}
                type="button"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>

          <div className="mt-5 space-y-5">
            {activeTab === "profile" ? (
              <>
                <SectionTitle icon={FileText} title="Identity" />
                <Field label="Full name" value={draft.fullName} onChange={(fullName) => updateDraft({ fullName })} />
                <Field label="Headline" value={draft.headline} onChange={(headline) => updateDraft({ headline })} />
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                  <Field label="Email" value={draft.email} onChange={(email) => updateDraft({ email })} />
                  <Field label="Phone" value={draft.phone} onChange={(phone) => updateDraft({ phone })} />
                </div>
                <Field label="Location" value={draft.location} onChange={(location) => updateDraft({ location })} />
                <Field label="Website" value={draft.website} onChange={(website) => updateDraft({ website })} />
                <TextArea label="Professional summary" value={draft.summary} onChange={(summary) => updateDraft({ summary })} />
                <TextArea label="Skills" value={draft.skills} onChange={(skills) => updateDraft({ skills })} />
              </>
            ) : null}

            {activeTab === "target" ? (
              <>
                <SectionTitle icon={Target} title="Role Targeting" />
                <Field label="Target role" value={draft.targetRole} onChange={(targetRole) => updateDraft({ targetRole })} />
                <TextArea
                  label="Target keywords"
                  rows={5}
                  value={draft.targetKeywords}
                  onChange={(targetKeywords) => updateDraft({ targetKeywords })}
                  placeholder="React, TypeScript, SaaS, accessibility"
                />
                <div className="rounded-md border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-800">
                  Use words from the job description. The score updates as those terms appear
                  naturally across your summary, skills, and bullets.
                </div>
              </>
            ) : null}

            {activeTab === "experience" ? (
              <>
                <SectionTitle icon={BriefcaseBusiness} title="Experience" />
                {draft.experience.map((item) => (
                  <div className="rounded-md border border-gray-200 p-3" key={item.id}>
                    <div className="flex justify-end">
                      <button
                        className="text-ink-400 transition hover:text-red-600"
                        onClick={() =>
                          updateDraft({ experience: draft.experience.filter((row) => row.id !== item.id) })
                        }
                        type="button"
                        aria-label="Remove experience"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <Field label="Role" value={item.role} onChange={(role) => updateExperience(item.id, { role })} />
                      <Field label="Company" value={item.company} onChange={(company) => updateExperience(item.id, { company })} />
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                        <Field label="Start" value={item.start} onChange={(start) => updateExperience(item.id, { start })} />
                        <Field label="End" value={item.end} onChange={(end) => updateExperience(item.id, { end })} />
                      </div>
                      <Field label="Location" value={item.location} onChange={(location) => updateExperience(item.id, { location })} />
                      <TextArea
                        label="Bullets"
                        value={item.bullets.join("\n")}
                        onChange={(value) => updateExperience(item.id, { bullets: value.split("\n") })}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() =>
                    updateDraft({
                      experience: [
                        ...draft.experience,
                        {
                          id: makeId("exp"),
                          company: "Company",
                          role: "Role",
                          location: "Remote",
                          start: "2024",
                          end: "Present",
                          bullets: ["Built a measurable product improvement."]
                        }
                      ]
                    })
                  }
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add experience
                </Button>
              </>
            ) : null}

            {activeTab === "projects" ? (
              <>
                <SectionTitle icon={Award} title="Projects" />
                {draft.projects.map((item) => (
                  <div className="rounded-md border border-gray-200 p-3" key={item.id}>
                    <div className="flex justify-end">
                      <button
                        className="text-ink-400 transition hover:text-red-600"
                        onClick={() => updateDraft({ projects: draft.projects.filter((row) => row.id !== item.id) })}
                        type="button"
                        aria-label="Remove project"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <Field label="Project name" value={item.name} onChange={(name) => updateProject(item.id, { name })} />
                      <Field label="Link" value={item.link} onChange={(link) => updateProject(item.id, { link })} />
                      <TextArea
                        label="Bullets"
                        value={item.bullets.join("\n")}
                        onChange={(value) => updateProject(item.id, { bullets: value.split("\n") })}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() =>
                    updateDraft({
                      projects: [
                        ...draft.projects,
                        { id: makeId("proj"), name: "Project", link: "", bullets: ["Built a relevant project outcome."] }
                      ]
                    })
                  }
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Add project
                </Button>
              </>
            ) : null}

            {activeTab === "education" ? (
              <>
                <SectionTitle icon={GraduationCap} title="Education" />
                {draft.education.map((item) => (
                  <div className="rounded-md border border-gray-200 p-3" key={item.id}>
                    <div className="flex justify-end">
                      <button
                        className="text-ink-400 transition hover:text-red-600"
                        onClick={() => updateDraft({ education: draft.education.filter((row) => row.id !== item.id) })}
                        type="button"
                        aria-label="Remove education"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <Field label="School" value={item.school} onChange={(school) => updateEducation(item.id, { school })} />
                      <Field label="Degree" value={item.degree} onChange={(degree) => updateEducation(item.id, { degree })} />
                      <Field label="Dates" value={item.dates} onChange={(dates) => updateEducation(item.id, { dates })} />
                    </div>
                  </div>
                ))}
                <TextArea
                  label="Certifications"
                  rows={3}
                  value={draft.certifications}
                  onChange={(certifications) => updateDraft({ certifications })}
                />
              </>
            ) : null}

            {activeTab === "style" ? (
              <>
                <SectionTitle icon={Palette} title="Template" />
                <div className="grid gap-2">
                  {(["precision", "modern", "compact"] as const).map((template) => (
                    <button
                      className={`rounded-md border px-3 py-2 text-left text-sm font-semibold capitalize ${
                        draft.template === template
                          ? "border-brand-200 bg-brand-50 text-brand-700"
                          : "border-gray-200 text-ink-700 hover:bg-gray-50"
                      }`}
                      key={template}
                      onClick={() => updateDraft({ template })}
                      type="button"
                    >
                      {template}
                    </button>
                  ))}
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">Accent</span>
                  <div className="mt-2 flex gap-2">
                    {["#2563eb", "#059669", "#7c3aed", "#c2410c", "#0f172a"].map((accent) => (
                      <button
                        aria-label={`Use accent ${accent}`}
                        className={`h-8 w-8 rounded-full border-2 ${
                          draft.accent === accent ? "border-ink-900" : "border-white"
                        } shadow-sm`}
                        key={accent}
                        onClick={() => updateDraft({ accent })}
                        style={{ backgroundColor: accent }}
                        type="button"
                      />
                    ))}
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </Card>

        <div className="min-w-0 overflow-x-auto rounded-lg border border-gray-200 bg-gray-100 p-4">
          <ResumePreview draft={draft} />
        </div>

        <aside className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink-500">ATS score</p>
                <p className="mt-1 text-4xl font-semibold text-ink-900">{analysis.score}</p>
              </div>
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full border-8 text-lg font-semibold"
                style={{ borderColor: draft.accent, color: draft.accent }}
              >
                {analysis.score}%
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <div>
                <p className="font-semibold text-ink-700">Matched keywords</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {analysis.matched.slice(0, 10).map((keyword) => (
                    <Badge key={keyword} tone="green">
                      {keyword}
                    </Badge>
                  ))}
                  {analysis.matched.length === 0 ? <span className="text-ink-500">No matches yet</span> : null}
                </div>
              </div>
              <div>
                <p className="font-semibold text-ink-700">Missing keywords</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {analysis.missing.slice(0, 10).map((keyword) => (
                    <Badge key={keyword} tone="amber">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <SectionTitle icon={Sparkles} title="Impact coach" />
            <ul className="mt-4 space-y-3 text-sm leading-6 text-ink-700">
              {analysis.suggestions.length ? (
                analysis.suggestions.map((suggestion) => (
                  <li className="flex gap-2" key={suggestion}>
                    <Sparkles className="mt-1 h-4 w-4 text-amber-600" aria-hidden="true" />
                    <span>{suggestion}</span>
                  </li>
                ))
              ) : (
                <li className="flex gap-2 text-emerald-700">
                  <CheckCircle2 className="mt-1 h-4 w-4" aria-hidden="true" />
                  This resume is role-targeted and impact-heavy.
                </li>
              )}
            </ul>
          </Card>

          <Card className="border-brand-100 bg-brand-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-brand-700">$2 Resume Export</p>
            <h2 className="mt-2 text-xl font-semibold text-ink-900">
              {isUnlocked ? "Export unlocked" : "Finish, then unlock export"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-600">
              Build and tune for free. Pay $2 when your resume is ready, then print or save it as PDF.
            </p>
            {unlockMessage ? (
              <div className="mt-4 rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {unlockMessage}
              </div>
            ) : null}
            {checkoutError ? (
              <div className="mt-4 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {checkoutError}
              </div>
            ) : null}
            <Button className="mt-5 w-full" onClick={exportResume} disabled={isCheckingOut}>
              {isCheckingOut ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              {isUnlocked ? "Export resume" : "Pay $2 and export"}
            </Button>
          </Card>
        </aside>
      </section>
    </div>
  );
}
