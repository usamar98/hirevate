"use client";

import {
  AlignLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Link2,
  Pause,
  Play,
  SearchCheck,
  Sparkles
} from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const walkthroughSteps = [
  {
    number: "01",
    title: "Add the job",
    description: "Paste a readable public job link or the full job description.",
  },
  {
    number: "02",
    title: "Confirm the role",
    description: "Hirevate extracts the responsibilities, qualifications, and ATS keywords.",
  },
  {
    number: "03",
    title: "Choose a template",
    description: "Select Precision, Modern, Executive, Minimal, Compact, or Technical.",
  },
  {
    number: "04",
    title: "Generate and review",
    description: "Get an editable, job-tailored resume that uses only your confirmed facts.",
  }
] as const;

function WalkthroughScreen({ activeStep }: { activeStep: number }) {
  if (activeStep === 0) {
    return (
      <div className="p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-700">Job source</p>
        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink-700">
            <Link2 className="h-4 w-4 text-brand-600" aria-hidden="true" /> Public job link
          </div>
          <div className="mt-3 flex h-11 items-center rounded-md border border-brand-200 bg-brand-50 px-3 text-xs text-brand-900">
            company.com/careers/senior-product-designer
          </div>
          <div className="mt-3 flex h-10 items-center justify-center gap-2 rounded-md bg-black text-xs font-semibold text-white">
            <SearchCheck className="h-4 w-4" aria-hidden="true" /> Read and analyze job
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-ink-500">
          <AlignLeft className="h-4 w-4" aria-hidden="true" /> Or paste the description when a page is protected.
        </div>
      </div>
    );
  }

  if (activeStep === 1) {
    return (
      <div className="p-5 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Job understood</p>
          <Badge tone="green">Ready</Badge>
        </div>
        <h3 className="mt-3 text-xl font-semibold text-ink-900">Senior Product Designer</h3>
        <p className="mt-1 text-xs text-ink-500">Northstar Labs · Remote</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">Responsibilities</p>
            <div className="mt-3 space-y-2">
              {["Lead product workflows", "Partner with engineering", "Improve design systems"].map((item) => (
                <div className="flex items-center gap-2 text-xs text-ink-700" key={item}>
                  <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">ATS keywords</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Figma", "Research", "Accessibility", "SaaS", "Systems"].map((item) => (
                <Badge key={item} tone="blue">{item}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activeStep === 2) {
    return (
      <div className="p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">Choose a template</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {["Precision", "Modern", "Technical"].map((template, index) => (
            <div
              className={cn(
                "relative min-h-36 rounded-lg border bg-white p-3 shadow-sm",
                index === 1 ? "border-brand-500 ring-2 ring-brand-100" : "border-gray-200"
              )}
              key={template}
            >
              {index === 1 ? (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                  <Check className="h-3 w-3" aria-hidden="true" />
                </span>
              ) : null}
              <div className={cn("h-2 w-12 rounded", index === 2 ? "bg-slate-900" : "bg-brand-500")} />
              <div className="mt-4 space-y-2">
                <div className="h-1.5 w-full rounded bg-gray-200" />
                <div className="h-1.5 w-4/5 rounded bg-gray-200" />
                <div className="h-1.5 w-full rounded bg-gray-100" />
                <div className="h-1.5 w-3/4 rounded bg-gray-100" />
              </div>
              <p className="mt-4 truncate text-[10px] font-semibold text-ink-700">{template}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-ink-500">Six professional templates are available in the builder.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-5 sm:grid-cols-[0.7fr_1.3fr] sm:p-7">
      <div className="space-y-3">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Tailored resume ready
          </div>
          <p className="mt-2 text-[10px] leading-5 text-emerald-700">Editable, scored, and ready for your final review.</p>
        </div>
        {["ATS score", "Keywords matched", "Impact bullets"].map((label, index) => (
          <div className="rounded-lg border border-gray-200 bg-white p-3" key={label}>
            <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-500">{label}</p>
            <p className="mt-1 text-lg font-semibold text-ink-900">{["92%", "18/21", "7"][index]}</p>
          </div>
        ))}
      </div>
      <div className="rounded-md border border-gray-200 border-l-4 border-l-brand-600 bg-white p-5 shadow-sm">
        <div className="h-3 w-28 rounded bg-ink-900" />
        <div className="mt-2 h-2 w-24 rounded bg-brand-500" />
        <div className="mt-6 h-2 w-20 rounded bg-ink-700" />
        <div className="mt-3 space-y-2">
          <div className="h-1.5 w-full rounded bg-gray-200" />
          <div className="h-1.5 w-full rounded bg-gray-200" />
          <div className="h-1.5 w-4/5 rounded bg-gray-200" />
        </div>
        <div className="mt-7 h-2 w-24 rounded bg-ink-700" />
        <div className="mt-3 space-y-3">
          {[1, 2, 3].map((item) => (
            <div className="flex gap-2" key={item}>
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              <div className="h-1.5 flex-1 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function JobResumeWalkthrough() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    if (!isPlaying || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActiveStep((current) => (current + 1) % walkthroughSteps.length);
    }, 5_500);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  return (
    <section className="below-fold-section overflow-hidden border-y border-gray-100 bg-white py-16 sm:py-20" aria-labelledby="job-resume-walkthrough-title">
      <div className="container-shell">
        <div className="grid items-center gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <div>
            <Badge tone="blue">New: resume from job link</Badge>
            <h2 id="job-resume-walkthrough-title" className="mt-4 text-3xl font-semibold leading-tight text-ink-900 sm:text-4xl">
              From job post to tailored resume in four guided steps
            </h2>
            <p className="mt-4 text-base leading-8 text-ink-500">
              Watch the short walkthrough: Hirevate reads the role, confirms what matters,
              asks for your template, and creates an editable professional resume using only
              the career facts already in your draft.
            </p>
            <div className="mt-7 space-y-2">
              {walkthroughSteps.map((step, index) => (
                <button
                  className={cn(
                    "flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition",
                    activeStep === index
                      ? "border-brand-200 bg-brand-50"
                      : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                  )}
                  key={step.number}
                  onClick={() => setActiveStep(index)}
                  type="button"
                >
                  <span className={cn("font-mono text-xs font-bold", activeStep === index ? "text-brand-700" : "text-ink-400")}>
                    {step.number}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-ink-900">{step.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-ink-500">{step.description}</span>
                  </span>
                </button>
              ))}
            </div>
            <Button asChild className="mt-7" href="/resume-builder#tailor-from-job" size="lg">
              Create a job-tailored resume <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>

          <div>
            <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-gray-50 shadow-[0_30px_80px_rgba(15,23,42,0.16)]">
              <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-white px-4 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5" aria-hidden="true">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                  </div>
                  <span className="text-xs font-semibold text-ink-700">Job-to-resume walkthrough</span>
                </div>
                <button
                  aria-label={isPlaying ? "Pause walkthrough" : "Play walkthrough"}
                  className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-ink-600 transition hover:border-brand-200 hover:text-brand-700"
                  onClick={() => setIsPlaying((current) => !current)}
                  type="button"
                >
                  {isPlaying ? <Pause className="h-3.5 w-3.5" aria-hidden="true" /> : <Play className="h-3.5 w-3.5" aria-hidden="true" />}
                </button>
              </div>
              <div className="min-h-[360px]" aria-live="polite">
                <WalkthroughScreen activeStep={activeStep} />
              </div>
              <div className="grid grid-cols-4 gap-1.5 border-t border-gray-200 bg-white px-4 py-3">
                {walkthroughSteps.map((step, index) => (
                  <button
                    aria-label={`Show step ${index + 1}: ${step.title}`}
                    className="flex h-12 items-center"
                    key={step.number}
                    onClick={() => setActiveStep(index)}
                    type="button"
                  >
                    <span
                      className={cn(
                        "h-1.5 w-full rounded-full transition",
                        index === activeStep ? "bg-brand-600" : "bg-gray-200"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-ink-400">Interactive 22-second product walkthrough · pause or choose any step</p>
          </div>
        </div>
      </div>
    </section>
  );
}
