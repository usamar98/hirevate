"use client";

import { useEffect, useMemo, useState } from "react";
import { Clipboard, Download, FileText, Loader2, Sparkles, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Tone = "focused" | "warm" | "executive";

const inputLabelClassName = "text-sm font-semibold text-ink-700";
const textAreaClassName =
  "min-h-[112px] w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";
const selectClassName =
  "h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-ink-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";

const toneOpeners: Record<Tone, string> = {
  focused: "I am excited to apply for",
  warm: "I was glad to find",
  executive: "I am writing to express interest in"
};

const toneClosers: Record<Tone, string> = {
  focused: "I would welcome the chance to discuss how I can help the team move faster and deliver measurable results.",
  warm: "I would be grateful for the opportunity to discuss the role and learn more about the team.",
  executive: "I would value a conversation about how my experience can support the team's goals."
};

function splitLines(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function buildLetter({
  achievements,
  company,
  experience,
  fullName,
  jobDescription,
  role,
  skills,
  tone
}: {
  achievements: string;
  company: string;
  experience: string;
  fullName: string;
  jobDescription: string;
  role: string;
  skills: string;
  tone: Tone;
}) {
  const cleanRole = role.trim() || "the open role";
  const cleanCompany = company.trim() || "your team";
  const skillList = splitLines(skills);
  const achievementList = splitLines(achievements);
  const jobKeywords = splitLines(jobDescription)
    .join(" ")
    .split(/\s+/)
    .filter((word) => word.length > 5)
    .slice(0, 8);
  const skillsSentence = skillList.length
    ? `My strongest fit is in ${skillList.join(", ")}.`
    : "My background gives me a strong base for the responsibilities in this role.";
  const achievementSentence = achievementList.length
    ? `Recent examples include ${achievementList.join("; ")}.`
    : "I have consistently worked across ambiguous priorities, stakeholder needs, and measurable delivery goals.";
  const keywordSentence = jobKeywords.length
    ? `The role's emphasis on ${Array.from(new Set(jobKeywords)).slice(0, 5).join(", ")} is especially aligned with the work I want to do next.`
    : `The role looks closely aligned with the type of impact I want to create next.`;

  return [
    "Dear Hiring Team,",
    "",
    `${toneOpeners[tone]} ${cleanRole} at ${cleanCompany}. ${keywordSentence}`,
    "",
    `${experience.trim() || "My experience"} has prepared me to contribute quickly. ${skillsSentence} ${achievementSentence}`,
    "",
    `What stands out to me about ${cleanCompany} is the opportunity to bring practical execution, clear communication, and ownership to work that matters. I am careful about matching my strengths to the role, and this opportunity feels like a strong fit.`,
    "",
    `${toneClosers[tone]}`,
    "",
    "Sincerely,",
    fullName.trim() || "Your name"
  ].join("\n");
}

export function CoverLetterBuilder({
  canUseAi,
  isAuthenticated
}: {
  canUseAi: boolean;
  isAuthenticated: boolean;
}) {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [achievements, setAchievements] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState<Tone>("focused");
  const [copied, setCopied] = useState(false);
  const [aiLetter, setAiLetter] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const localLetter = useMemo(
    () =>
      buildLetter({
        achievements,
        company,
        experience,
        fullName,
        jobDescription,
        role,
        skills,
        tone
      }),
    [achievements, company, experience, fullName, jobDescription, role, skills, tone]
  );
  const letter = aiLetter ?? localLetter;

  useEffect(() => {
    setAiLetter(null);
  }, [achievements, company, experience, fullName, jobDescription, role, skills, tone]);

  const score = Math.min(
    100,
    35 +
      (role ? 10 : 0) +
      (company ? 10 : 0) +
      (experience ? 15 : 0) +
      (skills ? 15 : 0) +
      (achievements ? 15 : 0)
  );

  async function writeWithAi() {
    if (!canUseAi) {
      window.location.assign(isAuthenticated ? "/pricing" : "/login?redirect=%2Fcover-letter");
      return;
    }

    setAiLoading(true);
    setAiError(null);
    try {
      const response = await fetch("/api/ai/career-writing", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          task: "cover_letter",
          context: {
            fullName,
            role,
            company,
            tone,
            experience,
            skills,
            achievements,
            jobDescription
          }
        })
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: string; result?: { text?: string } }
        | null;
      if (!response.ok || !data?.result?.text) {
        throw new Error(data?.error || "AI writing could not finish. Try again.");
      }
      setAiLetter(data.result.text);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI writing could not finish.");
    } finally {
      setAiLoading(false);
    }
  }

  async function copyLetter() {
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadLetter() {
    const blob = new Blob([letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${company || "cover-letter"}-${role || "role"}.txt`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="bg-gray-50 py-10">
      <div className="container-shell space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-semibold text-ink-900">Cover letter builder</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink-500">
              Draft a targeted cover letter from the role, company, strengths, and proof points.
            </p>
          </div>
          <Badge tone={score >= 85 ? "green" : score >= 65 ? "amber" : "gray"}>{score}% complete</Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-brand-600" aria-hidden="true" />
              <h2 className="text-xl font-semibold text-ink-900">Inputs</h2>
            </div>
            <div className="mt-5 grid gap-4">
              <label className="space-y-1.5">
                <span className={inputLabelClassName}>Full name</span>
                <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Usama Riaz" />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5">
                  <span className={inputLabelClassName}>Target role</span>
                  <Input value={role} onChange={(event) => setRole(event.target.value)} placeholder="Product Manager" />
                </label>
                <label className="space-y-1.5">
                  <span className={inputLabelClassName}>Company</span>
                  <Input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Acme" />
                </label>
              </div>
              <label className="space-y-1.5">
                <span className={inputLabelClassName}>Tone</span>
                <select className={selectClassName} value={tone} onChange={(event) => setTone(event.target.value as Tone)}>
                  <option value="focused">Focused</option>
                  <option value="warm">Warm</option>
                  <option value="executive">Executive</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <span className={inputLabelClassName}>Experience summary</span>
                <textarea
                  className={textAreaClassName}
                  value={experience}
                  onChange={(event) => setExperience(event.target.value)}
                  placeholder="5 years building SaaS workflows, leading launches, and improving conversion."
                />
              </label>
              <label className="space-y-1.5">
                <span className={inputLabelClassName}>Key skills</span>
                <textarea
                  className={textAreaClassName}
                  value={skills}
                  onChange={(event) => setSkills(event.target.value)}
                  placeholder="Product strategy, SQL, stakeholder management, lifecycle analytics"
                />
              </label>
              <label className="space-y-1.5">
                <span className={inputLabelClassName}>Proof points</span>
                <textarea
                  className={textAreaClassName}
                  value={achievements}
                  onChange={(event) => setAchievements(event.target.value)}
                  placeholder="Increased activation by 18%, reduced manual review time by 30%"
                />
              </label>
              <label className="space-y-1.5">
                <span className={inputLabelClassName}>Job description keywords</span>
                <textarea
                  className={textAreaClassName}
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  placeholder="Paste a short job description or comma-separated keywords."
                />
              </label>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brand-600" aria-hidden="true" />
                <h2 className="text-xl font-semibold text-ink-900">Draft</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button disabled={aiLoading} type="button" onClick={writeWithAi} variant="outline">
                  {aiLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  )}
                  {canUseAi ? "Write with AI" : "Unlock AI writing"}
                </Button>
                <Button type="button" onClick={copyLetter} variant="outline">
                  <Clipboard className="h-4 w-4" aria-hidden="true" />
                  {copied ? "Copied" : "Copy"}
                </Button>
                <Button type="button" onClick={downloadLetter}>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Download
                </Button>
              </div>
            </div>
            {aiError ? (
              <div className="mt-4 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {aiError}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-ink-500">
              <span>{aiLetter ? "AI-assisted draft" : "Live structured draft"}</span>
              {aiLetter ? (
                <button className="font-semibold text-brand-700 hover:text-brand-800" onClick={() => setAiLetter(null)} type="button">
                  Return to live draft
                </button>
              ) : null}
            </div>
            <pre className="mt-3 min-h-[640px] whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-5 text-sm leading-7 text-ink-800 shadow-sm">
              {letter}
            </pre>
            <p className="mt-3 text-xs leading-5 text-ink-500">
              Review every AI suggestion before applying. Hirevate instructs the model to use only
              your facts and never invent employers, skills, or achievements.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
