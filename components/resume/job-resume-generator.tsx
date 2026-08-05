"use client";

import {
  AlignLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  Link2,
  Loader2,
  Palette,
  SearchCheck,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { resumeTemplates } from "@/lib/resume/templates";
import type {
  JobAnalysis,
  ResumeDraft,
  ResumeTemplate,
  TailoredResumeResult
} from "@/lib/resume/types";
import { cn } from "@/lib/utils";

type SourceMode = "url" | "description";
type LoadingState = "analyze" | "generate" | null;

async function callJobResumeApi<T>(payload: unknown) {
  const response = await fetch("/api/ai/job-resume", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = (await response.json().catch(() => null)) as { error?: string; result?: T } | null;
  if (!response.ok || !data?.result) {
    throw new Error(data?.error || "The resume workflow could not finish. Try again.");
  }
  return data.result;
}

function Step({ active, complete, label, number }: { active: boolean; complete: boolean; label: string; number: number }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
          complete
            ? "border-emerald-600 bg-emerald-600 text-white"
            : active
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-gray-200 bg-white text-ink-400"
        )}
      >
        {complete ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : number}
      </span>
      <span className={cn("truncate text-xs font-semibold", active || complete ? "text-ink-800" : "text-ink-400")}>
        {label}
      </span>
    </div>
  );
}

export function JobResumeGenerator({
  canUseAi,
  draft,
  isAuthenticated,
  onGenerated
}: {
  canUseAi: boolean;
  draft: ResumeDraft;
  isAuthenticated: boolean;
  onGenerated: (result: TailoredResumeResult, template: ResumeTemplate) => void;
}) {
  const [sourceMode, setSourceMode] = useState<SourceMode>("url");
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [job, setJob] = useState<JobAnalysis | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate | null>(null);
  const [factsConfirmed, setFactsConfirmed] = useState(false);
  const [loading, setLoading] = useState<LoadingState>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);

  function requireAccess() {
    if (canUseAi) return true;
    const destination = encodeURIComponent("/resume-builder#tailor-from-job");
    window.location.assign(isAuthenticated ? "/pricing" : `/login?redirect=${destination}`);
    return false;
  }

  async function analyzeJob() {
    if (!requireAccess()) return;
    const trimmedUrl = jobUrl.trim();
    const trimmedDescription = jobDescription.trim();
    if (sourceMode === "url" && !trimmedUrl) {
      setError("Paste a public job link first.");
      return;
    }
    if (sourceMode === "description" && trimmedDescription.length < 120) {
      setError("Paste at least 120 characters from the job description.");
      return;
    }

    setError(null);
    setLoading("analyze");
    setGenerated(false);
    setReviewNotes([]);
    try {
      const result = await callJobResumeApi<JobAnalysis>({
        task: "analyze_job",
        source:
          sourceMode === "url"
            ? { kind: "url", url: trimmedUrl }
            : { kind: "description", description: trimmedDescription }
      });
      setJob(result);
      setSelectedTemplate(null);
      setFactsConfirmed(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The job could not be analyzed.");
    } finally {
      setLoading(null);
    }
  }

  async function generateResume() {
    if (!requireAccess() || !job) return;
    if (!selectedTemplate) {
      setError("Choose a resume template before generating.");
      return;
    }
    if (!factsConfirmed) {
      setError("Confirm that the current resume draft contains your real career facts.");
      return;
    }

    setError(null);
    setLoading("generate");
    try {
      const result = await callJobResumeApi<TailoredResumeResult>({
        task: "generate_resume",
        template: selectedTemplate,
        job,
        resume: {
          fullName: draft.fullName,
          headline: draft.headline,
          targetRole: draft.targetRole,
          targetKeywords: draft.targetKeywords,
          summary: draft.summary,
          skills: draft.skills,
          experience: draft.experience,
          projects: draft.projects,
          education: draft.education,
          certifications: draft.certifications
        }
      });
      onGenerated(result, selectedTemplate);
      setReviewNotes(result.reviewNotes);
      setGenerated(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The resume could not be generated.");
    } finally {
      setLoading(null);
    }
  }

  const activeStep = generated ? 3 : job ? 2 : 1;

  return (
    <section className="container-shell py-8" id="tailor-from-job" aria-labelledby="job-resume-title">
      <Card className="overflow-hidden border-brand-100 bg-white shadow-soft">
        <div className="grid gap-6 border-b border-gray-100 bg-[linear-gradient(135deg,#eff6ff_0%,#ffffff_48%,#ecfdf5_100%)] p-6 lg:grid-cols-[1fr_auto] lg:items-end lg:p-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="blue">AI job-to-resume</Badge>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Uses only your facts
              </span>
            </div>
            <h2 id="job-resume-title" className="mt-4 text-3xl font-semibold tracking-tight text-ink-900">
              Create a professional resume for a specific job
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-ink-600 sm:text-base">
              Add a readable public job link or paste the description. Hirevate extracts the role,
              asks you to choose one of six templates, then tailors your current resume without
              inventing experience.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-lg border border-white/80 bg-white/85 p-4 shadow-sm">
            <Step active={activeStep === 1} complete={activeStep > 1} label="Add job" number={1} />
            <Step active={activeStep === 2} complete={activeStep > 2} label="Pick template" number={2} />
            <Step active={activeStep === 3} complete={generated} label="Review" number={3} />
          </div>
        </div>

        <div className="p-6 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1" role="group" aria-label="Job input type">
                <button
                  aria-pressed={sourceMode === "url"}
                  className={cn(
                    "flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition",
                    sourceMode === "url" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"
                  )}
                  onClick={() => setSourceMode("url")}
                  type="button"
                >
                  <Link2 className="h-4 w-4" aria-hidden="true" /> Job link
                </button>
                <button
                  aria-pressed={sourceMode === "description"}
                  className={cn(
                    "flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition",
                    sourceMode === "description" ? "bg-white text-ink-900 shadow-sm" : "text-ink-500 hover:text-ink-800"
                  )}
                  onClick={() => setSourceMode("description")}
                  type="button"
                >
                  <AlignLeft className="h-4 w-4" aria-hidden="true" /> Paste description
                </button>
              </div>

              {sourceMode === "url" ? (
                <label className="mt-5 block space-y-2">
                  <span className="text-sm font-semibold text-ink-800">Public job-posting URL</span>
                  <Input
                    inputMode="url"
                    maxLength={2_048}
                    onChange={(event) => setJobUrl(event.target.value)}
                    placeholder="https://company.com/careers/job..."
                    type="url"
                    value={jobUrl}
                  />
                  <span className="block text-xs leading-5 text-ink-500">
                    Login-only, CAPTCHA-protected, or script-only pages may require the description instead.
                  </span>
                </label>
              ) : (
                <label className="mt-5 block space-y-2">
                  <span className="text-sm font-semibold text-ink-800">Job description</span>
                  <textarea
                    className="min-h-48 w-full rounded-md border border-gray-200 bg-white px-3 py-3 text-sm leading-6 text-ink-900 shadow-sm transition placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
                    maxLength={30_000}
                    onChange={(event) => setJobDescription(event.target.value)}
                    placeholder="Paste the title, responsibilities, qualifications, and company details..."
                    value={jobDescription}
                  />
                  <span className="block text-right text-xs text-ink-400">{jobDescription.length.toLocaleString()} / 30,000</span>
                </label>
              )}

              <Button className="mt-5 w-full" disabled={loading !== null} onClick={analyzeJob} size="lg" type="button">
                {loading === "analyze" ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <SearchCheck className="h-4 w-4" aria-hidden="true" />
                )}
                {canUseAi ? "Read and analyze job" : "Unlock job analysis"}
              </Button>

              {error ? (
                <div className="mt-4 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700" role="alert">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="min-w-0">
              {job ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">Job understood</p>
                      <h3 className="mt-2 text-xl font-semibold text-ink-900">{job.title}</h3>
                      <p className="mt-1 text-sm text-ink-500">
                        {[job.company, job.location].filter(Boolean).join(" · ") || "Company details not listed"}
                      </p>
                    </div>
                    {job.sourceUrl ? (
                      <a
                        className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900"
                        href={job.sourceUrl}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        Source <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    ) : null}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-ink-600">{job.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {job.keywords.slice(0, 12).map((keyword) => (
                      <Badge key={keyword} tone="blue">{keyword}</Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <SearchCheck className="h-8 w-8 text-ink-300" aria-hidden="true" />
                  <h3 className="mt-4 font-semibold text-ink-800">Your job analysis appears here</h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-ink-500">
                    We extract the role, responsibilities, qualifications, and ATS keywords before any resume is generated.
                  </p>
                </div>
              )}
            </div>
          </div>

          {job ? (
            <div className="mt-8 border-t border-gray-100 pt-8">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-700">
                  <Palette className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-xl font-semibold text-ink-900">Choose your resume template</h3>
                  <p className="mt-1 text-sm leading-6 text-ink-500">
                    Template selection is required before Hirevate creates the tailored resume.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {resumeTemplates.map((template) => (
                  <button
                    aria-pressed={selectedTemplate === template.value}
                    className={cn(
                      "relative min-h-36 rounded-lg border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2",
                      selectedTemplate === template.value
                        ? "border-brand-500 bg-brand-50 shadow-sm"
                        : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-sm"
                    )}
                    key={template.value}
                    onClick={() => setSelectedTemplate(template.value)}
                    type="button"
                  >
                    {selectedTemplate === template.value ? (
                      <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white">
                        <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                    ) : null}
                    <span className="block font-semibold text-ink-900">{template.label}</span>
                    <span className="mt-2 block text-xs leading-5 text-ink-500">{template.description}</span>
                    <span className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.1em] text-brand-700">
                      {template.bestFor}
                    </span>
                  </button>
                ))}
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-amber-100 bg-amber-50 p-4">
                <input
                  checked={factsConfirmed}
                  className="mt-1 h-4 w-4 rounded border-amber-300 text-brand-600 focus:ring-brand-500"
                  onChange={(event) => setFactsConfirmed(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  <span className="block text-sm font-semibold text-amber-950">I confirm the current resume draft contains my real career facts.</span>
                  <span className="mt-1 block text-xs leading-5 text-amber-800">
                    Hirevate may rewrite and reorder your content, but it will not invent missing experience or qualifications.
                  </span>
                </span>
              </label>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="inline-flex items-center gap-2 text-xs font-medium text-ink-500">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Review every AI-generated change before applying.
                </p>
                <Button
                  disabled={loading !== null || !selectedTemplate || !factsConfirmed}
                  onClick={generateResume}
                  size="lg"
                  type="button"
                >
                  {loading === "generate" ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                  )}
                  Generate complete tailored resume
                  {loading === "generate" ? null : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                </Button>
              </div>
            </div>
          ) : null}

          {generated ? (
            <div className="mt-8 rounded-lg border border-emerald-100 bg-emerald-50 p-5" role="status">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
                <div>
                  <h3 className="font-semibold text-emerald-950">Your tailored resume is ready to review</h3>
                  <p className="mt-1 text-sm leading-6 text-emerald-800">
                    The selected template and generated content are now applied to the editable resume below.
                  </p>
                  {reviewNotes.length > 0 ? (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-xs leading-5 text-emerald-900">
                      {reviewNotes.map((note) => <li key={note}>{note}</li>)}
                    </ul>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Card>
    </section>
  );
}
