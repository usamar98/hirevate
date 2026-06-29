import type { JobWithCompany } from "@/types/database";

type SourceTrust = {
  applyCta: string;
  applyDescription: string;
  isEmployerOrAtsApply: boolean;
  label: string;
  sourceType: "Company Career Page" | "Greenhouse" | "Lever" | "Adzuna" | "Google Jobs" | "SerpApi" | "Public ATS";
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
  "serpapi.com",
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

export function isEmployerOrAtsApplyUrl(job: Pick<JobWithCompany, "apply_url" | "source" | "companies">) {
  const source = job.source?.toLowerCase() ?? "";
  const applyHostname = getHostname(job.apply_url);

  if (!job.apply_url || !applyHostname) return false;
  if (source === "greenhouse" || source === "lever") return true;
  if (hostMatches(applyHostname, partnerHostPatterns)) return false;
  if (hostMatches(applyHostname, atsHostPatterns)) return true;

  return isSameOrganizationHost(applyHostname, job.companies?.website);
}

export function getJobSourceTrust(job: Pick<JobWithCompany, "apply_url" | "source" | "source_url" | "companies">): SourceTrust {
  const source = job.source?.toLowerCase() ?? "";
  const isEmployerOrAtsApply = isEmployerOrAtsApplyUrl(job);

  if (source === "greenhouse") {
    return {
      applyCta: "Apply now",
      applyDescription: "Open the employer application page hosted on Greenhouse.",
      isEmployerOrAtsApply,
      label: "Greenhouse",
      sourceType: "Greenhouse"
    };
  }

  if (source === "lever") {
    return {
      applyCta: "Apply now",
      applyDescription: "Open the employer application page hosted on Lever.",
      isEmployerOrAtsApply,
      label: "Lever",
      sourceType: "Lever"
    };
  }

  if (source === "adzuna") {
    return {
      applyCta: isEmployerOrAtsApply ? "Apply now" : "Open Adzuna listing",
      applyDescription: isEmployerOrAtsApply
        ? "Open the employer or ATS application page found through Adzuna."
        : "Open the partner listing from Adzuna. Hirevate does not label this as direct company apply unless it resolves to an employer or ATS page.",
      isEmployerOrAtsApply,
      label: "Adzuna",
      sourceType: "Adzuna"
    };
  }

  if (source === "serpapi") {
    return {
      applyCta: isEmployerOrAtsApply ? "Apply now" : "Open Google Jobs listing",
      applyDescription: isEmployerOrAtsApply
        ? "Open the employer or ATS application page found through Google Jobs."
        : "Open the Google Jobs result collected through SerpApi. Hirevate does not label this as direct company apply unless it resolves to an employer or ATS page.",
      isEmployerOrAtsApply,
      label: "Google Jobs via SerpApi",
      sourceType: "Google Jobs"
    };
  }

  if (isEmployerOrAtsApply) {
    return {
      applyCta: "Apply now",
      applyDescription: "Open the employer or public ATS application page.",
      isEmployerOrAtsApply,
      label: "Company Career Page",
      sourceType: "Company Career Page"
    };
  }

  return {
    applyCta: job.apply_url ? "Open listing" : "View details",
    applyDescription: "Review the public hiring source for this role.",
    isEmployerOrAtsApply,
    label: "Public ATS",
    sourceType: "Public ATS"
  };
}

export function getJobSourceLabel(source: string | null | undefined) {
  if (source === "lever") return "Lever";
  if (source === "serpapi") return "Google Jobs via SerpApi";
  if (source === "adzuna") return "Adzuna";
  if (source === "greenhouse") return "Greenhouse";
  return "Public ATS";
}

export function getJobSourceDescription(source: string | null | undefined) {
  if (source === "serpapi") {
    return "Google Jobs result collected through SerpApi.";
  }

  if (source === "adzuna") {
    return "Partner listing collected through Adzuna.";
  }

  if (source === "lever") {
    return "Public ATS posting hosted on Lever.";
  }

  if (source === "greenhouse") {
    return "Public ATS posting hosted on Greenhouse.";
  }

  return "Public hiring source.";
}
