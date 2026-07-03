import type { JobWithCompany } from "@/types/database";

type SourceTrust = {
  applyCta: string;
  applyDescription: string;
  isEmployerOrAtsApply: boolean;
  label: string;
  sourceType: "Company Career Page" | "Greenhouse" | "Lever" | "Adzuna" | "Public ATS";
};

const atsHostPatterns = [
  "greenhouse.io",
  "lever.co",
  "ashbyhq.com",
  "workable.com",
  "smartrecruiters.com",
  "breezy.hr",
  "icims.com",
  "jobvite.com",
  "bamboohr.com",
  "recruitee.com",
  "pinpointhq.com",
  "personio.com",
  "myworkdayjobs.com",
  "successfactors.com"
];

const partnerHostPatterns = [
  "adzuna.",
  "google.",
  "linkedin.com",
  "indeed.com",
  "glassdoor.com",
  "ziprecruiter.com"
];

function getHostname(value: string | null | undefined) {
  if (!value) return null;

  try {
    return new URL(value).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function hostMatches(hostname: string | null, patterns: string[]) {
  return Boolean(hostname && patterns.some((pattern) => hostname === pattern || hostname.endsWith(`.${pattern}`) || hostname.includes(pattern)));
}

function isSameOrganizationHost(applyHostname: string | null, website: string | null | undefined) {
  const companyHostname = getHostname(website);
  if (!applyHostname || !companyHostname) return false;

  return applyHostname === companyHostname || applyHostname.endsWith(`.${companyHostname}`);
}

function getApplyCta(job: Pick<JobWithCompany, "apply_url">) {
  return job.apply_url ? "Apply now" : "View details";
}

export function isEmployerOrAtsApplyUrl(job: Pick<JobWithCompany, "apply_url" | "source" | "companies">) {
  const source = job.source?.toLowerCase() ?? "";
  const applyHostname = getHostname(job.apply_url);

  if (!job.apply_url || !applyHostname) return false;
  if (source === "greenhouse" || source === "lever" || source === "ashby") return true;
  if (hostMatches(applyHostname, partnerHostPatterns)) return false;
  if (hostMatches(applyHostname, atsHostPatterns)) return true;

  return isSameOrganizationHost(applyHostname, job.companies?.website);
}

export function getJobSourceTrust(job: Pick<JobWithCompany, "apply_url" | "source" | "source_url" | "companies">): SourceTrust {
  const source = job.source?.toLowerCase() ?? "";
  const isEmployerOrAtsApply = isEmployerOrAtsApplyUrl(job);

  if (source === "greenhouse") {
    return {
      applyCta: getApplyCta(job),
      applyDescription: "Open the employer or ATS application page for this role.",
      isEmployerOrAtsApply,
      label: "Employer ATS",
      sourceType: "Greenhouse"
    };
  }

  if (source === "lever") {
    return {
      applyCta: getApplyCta(job),
      applyDescription: "Open the employer or ATS application page for this role.",
      isEmployerOrAtsApply,
      label: "Employer ATS",
      sourceType: "Lever"
    };
  }

  if (source === "ashby") {
    return {
      applyCta: getApplyCta(job),
      applyDescription: "Open the employer or ATS application page for this role.",
      isEmployerOrAtsApply,
      label: "Employer ATS",
      sourceType: "Public ATS"
    };
  }

  if (source === "adzuna") {
    return {
      applyCta: getApplyCta(job),
      applyDescription: isEmployerOrAtsApply
        ? "Open the employer or ATS application page for this role."
        : "Open the verified hiring source for this role.",
      isEmployerOrAtsApply,
      label: isEmployerOrAtsApply ? "Employer ATS" : "Verified hiring source",
      sourceType: "Adzuna"
    };
  }


  if (isEmployerOrAtsApply) {
    return {
      applyCta: getApplyCta(job),
      applyDescription: "Open the employer or public ATS application page.",
      isEmployerOrAtsApply,
      label: "Company Career Page",
      sourceType: "Company Career Page"
    };
  }

  return {
    applyCta: getApplyCta(job),
    applyDescription: "Review the public hiring source for this role.",
    isEmployerOrAtsApply,
    label: "Public ATS",
    sourceType: "Public ATS"
  };
}

export function getJobSourceLabel(source: string | null | undefined) {
  if (source === "lever" || source === "greenhouse" || source === "ashby") return "Employer ATS";
  if (source === "adzuna") return "Verified hiring source";
  return "Public ATS";
}

export function getJobSourceDescription(source: string | null | undefined) {
  if (source === "adzuna") return "Verified public hiring source.";
  if (source === "lever" || source === "greenhouse" || source === "ashby") return "Employer ATS posting.";

  return "Public hiring source.";
}
