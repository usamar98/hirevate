"use client";

import { CheckCircle2, FileText, Sparkles, Target, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ResumeMatchCardProps = {
  companyName: string;
  jobDescription: string | null;
  jobLocation: string | null;
  jobTitle: string;
};

type ResumeBuilderDraft = {
  certifications?: string;
  education?: Array<{ degree?: string; school?: string }>;
  experience?: Array<{ bullets?: string[]; company?: string; role?: string }>;
  headline?: string;
  projects?: Array<{ bullets?: string[]; name?: string }>;
  skills?: string;
  summary?: string;
  targetKeywords?: string;
  targetRole?: string;
};

type Keyword = {
  label: string;
  normalized: string;
  weight: number;
};

const resumeTextStorageKey = "hirevate-resume-match-text-v1";
const resumeBuilderStorageKey = "hirevate-resume-builder-draft-v1";

const stopWords = new Set([
  "about",
  "after",
  "also",
  "and",
  "are",
  "because",
  "been",
  "being",
  "build",
  "candidate",
  "company",
  "each",
  "from",
  "have",
  "help",
  "into",
  "join",
  "like",
  "more",
  "must",
  "need",
  "our",
  "people",
  "role",
  "team",
  "than",
  "that",
  "the",
  "their",
  "this",
  "through",
  "using",
  "with",
  "work",
  "you",
  "your"
]);

const knownSkills = [
  "A/B testing",
  "accessibility",
  "account management",
  "AI",
  "analytics",
  "API",
  "AWS",
  "backend",
  "B2B",
  "CRM",
  "CSS",
  "customer success",
  "data analysis",
  "design systems",
  "DevOps",
  "Docker",
  "frontend",
  "GraphQL",
  "JavaScript",
  "Kubernetes",
  "lead generation",
  "machine learning",
  "Next.js",
  "Node.js",
  "PostgreSQL",
  "product management",
  "Python",
  "React",
  "Salesforce",
  "SEO",
  "SQL",
  "Supabase",
  "TypeScript",
  "UX"
];

function stripHtml(value: string | null | undefined) {
  return (value ?? "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/\bnext\.js\b/g, "nextjs")
    .replace(/\bnode\.js\b/g, "nodejs")
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeText(value)
    .split(" ")
    .filter((word) => word.length > 2 && !stopWords.has(word) && !/^\d+$/.test(word));
}

function titleCase(value: string) {
  return value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function keywordKey(value: string) {
  return normalizeText(value).replace(/\s+/g, " ");
}

function addKeyword(map: Map<string, Keyword>, label: string, weight: number) {
  const normalized = keywordKey(label);
  if (!normalized || normalized.length < 3 || stopWords.has(normalized)) return;

  const current = map.get(normalized);
  if (!current || current.weight < weight) {
    map.set(normalized, { label: label.trim(), normalized, weight });
  }
}

function extractJobKeywords(jobTitle: string, jobDescription: string | null, companyName: string, jobLocation: string | null) {
  const keywords = new Map<string, Keyword>();
  const rawText = [jobTitle, companyName, jobLocation, stripHtml(jobDescription)].filter(Boolean).join(" ");
  const normalizedText = normalizeText(rawText);
  const titleTokens = tokenize(jobTitle);
  const tokens = tokenize(rawText);
  const counts = new Map<string, number>();

  for (const skill of knownSkills) {
    if (normalizedText.includes(keywordKey(skill))) addKeyword(keywords, skill, 5);
  }

  for (const token of titleTokens) addKeyword(keywords, titleCase(token), 6);

  for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
  Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 26)
    .forEach(([token, count]) => addKeyword(keywords, titleCase(token), Math.min(4, count)));

  for (let index = 0; index < tokens.length - 1; index += 1) {
    const phrase = `${tokens[index]} ${tokens[index + 1]}`;
    if (stopWords.has(tokens[index]) || stopWords.has(tokens[index + 1])) continue;
    if ((normalizedText.match(new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length >= 2) {
      addKeyword(keywords, titleCase(phrase), 4);
    }
  }

  return Array.from(keywords.values())
    .sort((a, b) => b.weight - a.weight || a.label.localeCompare(b.label))
    .slice(0, 34);
}

function termExists(resumeText: string, term: string) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(^|\\s)${escaped}(\\s|$)`, "i").test(resumeText);
}

function getBuilderDraftText() {
  const stored = window.localStorage.getItem(resumeBuilderStorageKey);
  if (!stored) return "";

  try {
    const draft = JSON.parse(stored) as ResumeBuilderDraft;
    return [
      draft.headline,
      draft.targetRole,
      draft.targetKeywords,
      draft.summary,
      draft.skills,
      draft.experience?.flatMap((item) => [item.role, item.company, item.bullets?.join(" ")]).join(" "),
      draft.projects?.flatMap((item) => [item.name, item.bullets?.join(" ")]).join(" "),
      draft.education?.flatMap((item) => [item.school, item.degree]).join(" "),
      draft.certifications
    ]
      .filter(Boolean)
      .join("\n");
  } catch {
    window.localStorage.removeItem(resumeBuilderStorageKey);
    return "";
  }
}

function analyzeResume({
  companyName,
  jobDescription,
  jobLocation,
  jobTitle,
  resumeText
}: ResumeMatchCardProps & { resumeText: string }) {
  const cleanResume = normalizeText(resumeText);
  const resumeTokens = tokenize(resumeText);
  const keywords = extractJobKeywords(jobTitle, jobDescription, companyName, jobLocation);
  const matched = keywords.filter((keyword) => termExists(cleanResume, keyword.normalized));
  const missing = keywords.filter((keyword) => !termExists(cleanResume, keyword.normalized));
  const totalWeight = keywords.reduce((sum, keyword) => sum + keyword.weight, 0) || 1;
  const matchedWeight = matched.reduce((sum, keyword) => sum + keyword.weight, 0);
  const titleTerms = tokenize(jobTitle).filter((token) => token.length > 3);
  const titleMatches = titleTerms.filter((term) => termExists(cleanResume, term));
  const metricSignals = resumeText.match(/(\d+%|\$\d+|\d+x|\d+\+|\b\d{2,}\b)/gi) ?? [];
  const actionSignals = resumeText.match(
    /\b(achieved|automated|built|created|delivered|designed|grew|improved|increased|launched|led|managed|optimized|owned|reduced|shipped|scaled)\b/gi
  ) ?? [];

  if (resumeTokens.length < 45) {
    return {
      matched,
      missing,
      score: resumeTokens.length === 0 ? 0 : 18,
      suggestions: ["Paste a full resume before judging fit for this job."]
    };
  }

  const keywordScore = (matchedWeight / totalWeight) * 60;
  const titleScore = titleTerms.length > 0 ? (titleMatches.length / titleTerms.length) * 15 : 8;
  const metricScore = Math.min(10, metricSignals.length * 2);
  const actionScore = Math.min(8, actionSignals.length * 1.5);
  const lengthScore = resumeTokens.length >= 260 ? 5 : resumeTokens.length >= 150 ? 3 : 1;
  const score = Math.max(10, Math.min(98, Math.round(keywordScore + titleScore + metricScore + actionScore + lengthScore)));
  const suggestions = [
    missing.length > 0
      ? `Add truthful evidence for ${missing.slice(0, 4).map((item) => item.label).join(", ")}.`
      : null,
    titleTerms.length > 0 && titleMatches.length < Math.ceil(titleTerms.length * 0.6)
      ? `Make the target title closer to ${jobTitle}.`
      : null,
    metricSignals.length < 3 ? "Add measurable outcomes with numbers, percentages, users, or revenue." : null,
    actionSignals.length < 5 ? "Start more bullets with strong action verbs and clear ownership." : null
  ].filter(Boolean) as string[];

  return { matched, missing, score, suggestions };
}

function getScoreTone(score: number) {
  if (score >= 80) return { border: "border-emerald-500", label: "Strong match", text: "text-emerald-700" };
  if (score >= 65) return { border: "border-blue-500", label: "Good match", text: "text-blue-700" };
  if (score >= 45) return { border: "border-amber-500", label: "Needs targeting", text: "text-amber-700" };
  return { border: "border-red-400", label: "Low match", text: "text-red-700" };
}

export function ResumeMatchCard({ companyName, jobDescription, jobLocation, jobTitle }: ResumeMatchCardProps) {
  const [resumeText, setResumeText] = useState("");
  const [hasBuilderDraft, setHasBuilderDraft] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analysis = useMemo(
    () => analyzeResume({ companyName, jobDescription, jobLocation, jobTitle, resumeText }),
    [companyName, jobDescription, jobLocation, jobTitle, resumeText]
  );
  const tone = getScoreTone(analysis.score);

  useEffect(() => {
    setResumeText(window.localStorage.getItem(resumeTextStorageKey) ?? "");
    setHasBuilderDraft(Boolean(window.localStorage.getItem(resumeBuilderStorageKey)));
  }, []);

  useEffect(() => {
    if (resumeText.trim()) window.localStorage.setItem(resumeTextStorageKey, resumeText);
  }, [resumeText]);

  async function readResumeFile(file: File | undefined) {
    if (!file) return;
    setResumeText((await file.text()).slice(0, 40_000));
  }

  function clearResume() {
    setResumeText("");
    window.localStorage.removeItem(resumeTextStorageKey);
  }

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-ink-900">Resume match</h2>
          <p className="mt-1 text-sm leading-6 text-ink-500">Compare your resume with this job.</p>
        </div>
        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-8 ${tone.border}`}>
          <span className={`text-lg font-semibold ${tone.text}`}>{analysis.score}%</span>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-gray-100 bg-gray-50 p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`text-sm font-semibold ${tone.text}`}>{tone.label}</p>
            <p className="mt-1 text-xs text-ink-500">
              {analysis.matched.length}/{analysis.matched.length + analysis.missing.length} job signals matched
            </p>
          </div>
          <Target className="h-5 w-5 text-ink-400" aria-hidden="true" />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <textarea
          className="min-h-[150px] w-full resize-y rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm transition placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
          onChange={(event) => setResumeText(event.target.value)}
          placeholder="Paste your resume text here"
          value={resumeText}
        />
        <input
          ref={fileInputRef}
          accept=".txt,.md,.rtf"
          className="hidden"
          onChange={(event) => void readResumeFile(event.target.files?.[0])}
          type="file"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload text
          </Button>
          <Button disabled={!hasBuilderDraft} type="button" variant="outline" onClick={() => setResumeText(getBuilderDraftText())}>
            <FileText className="h-4 w-4" aria-hidden="true" />
            Builder draft
          </Button>
        </div>
        {resumeText ? (
          <button className="text-sm font-semibold text-ink-500 hover:text-red-600" onClick={clearResume} type="button">
            Clear resume text
          </button>
        ) : null}
      </div>

      <div className="mt-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-ink-700">Matched</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {analysis.matched.slice(0, 10).map((keyword) => (
              <Badge key={keyword.normalized} tone="green">
                {keyword.label}
              </Badge>
            ))}
            {analysis.matched.length === 0 ? <span className="text-sm text-ink-500">No matches yet</span> : null}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-700">Missing</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {analysis.missing.slice(0, 10).map((keyword) => (
              <Badge key={keyword.normalized} tone="amber">
                {keyword.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <ul className="mt-5 space-y-2 text-sm leading-6 text-ink-700">
        {analysis.suggestions.length ? (
          analysis.suggestions.slice(0, 4).map((suggestion) => (
            <li className="flex gap-2" key={suggestion}>
              <Sparkles className="mt-1 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
              <span>{suggestion}</span>
            </li>
          ))
        ) : (
          <li className="flex gap-2 text-emerald-700">
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Your resume is well aligned with this role.</span>
          </li>
        )}
      </ul>
    </Card>
  );
}
