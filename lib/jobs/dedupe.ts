import type { JobWithCompany } from "@/types/database";

function normalizeText(value: string | null | undefined) {
  return (value ?? "").toLowerCase().replace(/\s+/g, " ").trim();
}

function normalizeUrl(value: string | null | undefined) {
  if (!value) return "";

  try {
    const url = new URL(value);
    url.hash = "";
    url.searchParams.sort();
    return url.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return value.toLowerCase().trim();
  }
}

function getCompanyKey(job: JobWithCompany) {
  return job.company_id ?? normalizeText(job.companies?.name);
}

function getSortTime(job: JobWithCompany) {
  const value = job.updated_at ?? job.discovered_at;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

export function getJobDuplicateKey(job: JobWithCompany) {
  const applyUrl = normalizeUrl(job.apply_url);

  if (!applyUrl) return `unique:${job.id}`;

  return [
    normalizeText(job.title),
    getCompanyKey(job),
    normalizeText(job.location),
    applyUrl
  ].join("|");
}

export function isPreferredDuplicateCandidate(candidate: JobWithCompany, current: JobWithCompany) {
  if (candidate.freshness_score !== current.freshness_score) {
    return candidate.freshness_score > current.freshness_score;
  }

  return getSortTime(candidate) > getSortTime(current);
}

export function dedupeJobs<T extends JobWithCompany>(jobs: T[]) {
  const byKey = new Map<string, T>();

  for (const job of jobs) {
    const key = getJobDuplicateKey(job);
    const current = byKey.get(key);

    if (!current || isPreferredDuplicateCandidate(job, current)) {
      byKey.set(key, job);
    }
  }

  return Array.from(byKey.values());
}
