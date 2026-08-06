import type { Job } from "@/types/database";

export type StudentJobAudience = "part-time" | "student";
export type StudentJobCountry = "us" | "uk";

export type StudentJobSignal = {
  key:
    | "part-time"
    | "internship"
    | "on-campus"
    | "student-mentioned"
    | "cpt-opt-mentioned"
    | "authorization-required"
    | "sponsorship-unavailable"
    | "evening"
    | "weekend"
    | "seasonal"
    | "temporary";
  label: string;
  tone: "blue" | "green" | "amber" | "gray" | "red";
};

type ClassifiableJob = Pick<Job, "description" | "raw_data" | "title">;

const partTimePattern = /\bpart[\s_-]?time\b/i;
const studentPattern = /\b(student|students|undergraduate|graduate student|college student|university student)\b/i;
const internshipPattern = /\b(intern|internship|co[\s-]?op)\b/i;
const campusPattern = /\b(on[\s-]?campus|campus (?:job|role|position|employment|assistant))\b/i;
const cptOptPattern = /\b(CPT|OPT|curricular practical training|optional practical training)\b/i;
const authorizationPattern = /\b(must|need to|requires? to) (?:be )?(?:legally )?(?:authorized|eligible) to work\b|\bwork authorization (?:is )?required\b/i;
const noSponsorshipPattern = /\b(?:no|not) (?:visa )?sponsorship\b|\b(?:does not|cannot|unable to) sponsor\b|\bsponsorship (?:is )?not available\b/i;
const eveningPattern = /\b(evening|night shift|after[\s-]?school)\b/i;
const weekendPattern = /\bweekend(s)?\b/i;
const seasonalPattern = /\bseasonal\b/i;
const temporaryPattern = /\b(temporary|temp role|fixed[\s-]?term)\b/i;

function stripHtml(value: string | null | undefined) {
  return (value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function getRawString(rawData: Job["raw_data"], keys: string[]) {
  if (!rawData || Array.isArray(rawData) || typeof rawData !== "object") return "";

  const record = rawData as Record<string, unknown>;
  return keys
    .map((key) => record[key])
    .filter((value): value is string => typeof value === "string")
    .join(" ");
}

export function getStudentJobSearchText(job: ClassifiableJob) {
  const sourceEmployment = getRawString(job.raw_data, [
    "commitment",
    "contract_time",
    "contract_type",
    "employmentType",
    "employment_type",
    "jobType",
    "workplaceType"
  ]);

  return `${job.title} ${stripHtml(job.description)} ${sourceEmployment}`.replace(/\s+/g, " ").trim();
}

export function getWeeklyHours(text: string) {
  const normalized = stripHtml(text);
  const rangeMatch = normalized.match(/\b(\d{1,2})\s*(?:-|–|to)\s*(\d{1,2})\s*hours?(?:\s+per\s+week|\s*\/\s*week|\s+weekly)?\b/i);

  if (rangeMatch) {
    const min = Number(rangeMatch[1]);
    const max = Number(rangeMatch[2]);
    if (min <= max && max <= 80) return { min, max };
  }

  const singleMatch = normalized.match(/\b(?:up to\s+)?(\d{1,2})\s*hours?(?:\s+per\s+week|\s*\/\s*week|\s+weekly)\b/i);
  if (!singleMatch) return null;

  const max = Number(singleMatch[1]);
  return max <= 80 ? { min: null, max } : null;
}

export function classifyStudentJob(job: ClassifiableJob) {
  const text = getStudentJobSearchText(job);
  const signals: StudentJobSignal[] = [];
  const add = (signal: StudentJobSignal) => {
    if (!signals.some((item) => item.key === signal.key)) signals.push(signal);
  };

  if (partTimePattern.test(text)) add({ key: "part-time", label: "Part-time stated", tone: "green" });
  if (internshipPattern.test(text)) add({ key: "internship", label: "Internship", tone: "blue" });
  if (campusPattern.test(text)) add({ key: "on-campus", label: "On-campus stated", tone: "green" });
  if (studentPattern.test(text)) add({ key: "student-mentioned", label: "Students mentioned", tone: "blue" });
  if (cptOptPattern.test(text)) add({ key: "cpt-opt-mentioned", label: "CPT/OPT mentioned", tone: "amber" });
  if (authorizationPattern.test(text)) add({ key: "authorization-required", label: "Work authorization required", tone: "amber" });
  if (noSponsorshipPattern.test(text)) add({ key: "sponsorship-unavailable", label: "Sponsorship unavailable", tone: "red" });
  if (eveningPattern.test(text)) add({ key: "evening", label: "Evening hours", tone: "gray" });
  if (weekendPattern.test(text)) add({ key: "weekend", label: "Weekend hours", tone: "gray" });
  if (seasonalPattern.test(text)) add({ key: "seasonal", label: "Seasonal", tone: "gray" });
  if (temporaryPattern.test(text)) add({ key: "temporary", label: "Temporary", tone: "gray" });

  const hours = getWeeklyHours(text);
  const isPartTime = signals.some((signal) => signal.key === "part-time") || Boolean(hours && hours.max <= 30);
  const isStudentRelevant = signals.some((signal) =>
    ["student-mentioned", "internship", "on-campus", "cpt-opt-mentioned", "part-time"].includes(signal.key)
  );

  return { hours, isPartTime, isStudentRelevant, signals };
}

export function matchesStudentJobAudience(job: ClassifiableJob, audience: StudentJobAudience) {
  const classification = classifyStudentJob(job);
  return audience === "part-time" ? classification.isPartTime : classification.isStudentRelevant;
}

export const studentCandidateTerms: Record<StudentJobAudience, readonly string[]> = {
  "part-time": ["part-time", "part time", "part_time", "parttime", "weekend", "evening", "seasonal"],
  student: ["student", "intern", "internship", "on-campus", "on campus", "CPT", "OPT", "part-time", "part time"]
};
