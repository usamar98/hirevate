import type { ResumeTemplate } from "@/lib/resume/types";

export const resumeTemplateValues = [
  "precision",
  "modern",
  "executive",
  "minimal",
  "compact",
  "technical"
] as const satisfies readonly ResumeTemplate[];

export const resumeTemplates: Array<{
  value: ResumeTemplate;
  label: string;
  description: string;
  bestFor: string;
}> = [
  {
    value: "precision",
    label: "Precision",
    description: "Balanced hierarchy with clean ATS-safe sections.",
    bestFor: "Most professional roles"
  },
  {
    value: "modern",
    label: "Modern",
    description: "Structured sidebar for skills and contact details.",
    bestFor: "Product, design, and technology"
  },
  {
    value: "executive",
    label: "Executive",
    description: "Confident typography and restrained leadership styling.",
    bestFor: "Leadership and senior roles"
  },
  {
    value: "minimal",
    label: "Minimal",
    description: "Quiet, editorial layout with maximum readability.",
    bestFor: "Consulting and operations"
  },
  {
    value: "compact",
    label: "Compact",
    description: "Dense layout that keeps substantial experience concise.",
    bestFor: "Experienced candidates"
  },
  {
    value: "technical",
    label: "Technical",
    description: "Crisp labels and a project-forward technical rhythm.",
    bestFor: "Engineering and data roles"
  }
];
