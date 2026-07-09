import { getJobStructuredSalary } from "@/lib/jobs/compensation";
import { getJobLocationLabel } from "@/lib/jobs/display";
import { isEmployerOrAtsApplyUrl } from "@/lib/jobs/sources";
import { absoluteUrl, siteName } from "@/lib/seo";
import type { Company, Job, JobWithCompany } from "@/types/database";

const JOB_SCHEMA_MAX_AGE_DAYS = 45;

type JobSlugSource = Pick<Job, "id" | "title" | "location"> & {
  companies: Pick<Company, "name"> | null;
};

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stableToken(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36).padStart(6, "0").slice(0, 6);
}

export function isUuidLike(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function getJobSlug(job: JobSlugSource) {
  const core = slugify(
    [job.title, job.companies?.name, job.location].filter(Boolean).join(" ")
  )
    .split("-")
    .slice(0, 12)
    .join("-");

  return `${core || "job"}-${stableToken(job.id)}`;
}

export function getJobSlugToken(slugOrId: string) {
  return slugOrId.toLowerCase().match(/-([a-z0-9]{6})$/)?.[1] ?? null;
}

export function jobMatchesSlug(job: JobSlugSource, slugOrId: string) {
  const normalized = slugOrId.toLowerCase();
  const token = getJobSlugToken(normalized);

  return getJobSlug(job) === normalized || Boolean(token && stableToken(job.id) === token);
}

export function getJobPath(job: JobSlugSource) {
  return `/jobs/${getJobSlug(job)}`;
}

export function getJobCompanyName(job: JobWithCompany) {
  return job.companies?.name ?? "Company";
}

export function getJobMetaTitle(job: JobWithCompany) {
  return `${job.title} at ${getJobCompanyName(job)} | ${siteName}`;
}

export function getJobMetaDescription(job: JobWithCompany) {
  const location = job.location ? ` in ${job.location}` : "";
  const applyDescription = isEmployerOrAtsApplyUrl(job)
    ? "Apply on the available employer or ATS page."
    : "Review the available hiring source and apply there.";

  return `${job.title} at ${getJobCompanyName(job)}${location}. ${applyDescription}`;
}

function stripHtml(value: string | null | undefined) {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferEmploymentType(job: JobWithCompany) {
  const text = `${job.title} ${stripHtml(job.description)}`.toLowerCase();

  if (text.includes("intern")) return "INTERN";
  if (text.includes("part-time") || text.includes("part time")) return "PART_TIME";
  if (text.includes("contract") || text.includes("freelance")) return "CONTRACTOR";
  if (text.includes("temporary") || text.includes("seasonal")) return "TEMPORARY";

  return "FULL_TIME";
}

function buildJobLocation(job: JobWithCompany) {
  return {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      addressLocality: getJobLocationLabel(job)
    }
  };
}

function buildBaseSalary(job: JobWithCompany) {
  const salary = getJobStructuredSalary(job);
  if (!salary) return undefined;

  return {
    "@type": "MonetaryAmount",
    currency: salary.currency,
    value: {
      "@type": "QuantitativeValue",
      minValue: salary.min,
      maxValue: salary.max,
      unitText: salary.interval.toUpperCase()
    }
  };
}

function inferApplicantCountry(location: string | null) {
  const text = (location ?? "").toLowerCase();

  if (/\b(united states|usa|u\.s\.|us|new york|san francisco|california|texas)\b/.test(text)) {
    return "USA";
  }

  if (/\b(united kingdom|uk|england|london|manchester|scotland|wales)\b/.test(text)) {
    return "United Kingdom";
  }

  if (/\b(canada|toronto|vancouver|montreal)\b/.test(text)) {
    return "Canada";
  }

  return null;
}

export function isJobPostingEligible(job: JobWithCompany) {
  const lastSeen = new Date(job.last_seen_at ?? job.updated_at ?? job.discovered_at);
  const ageMs = Date.now() - lastSeen.getTime();
  const hasCurrentSource =
    Number.isFinite(lastSeen.getTime()) &&
    ageMs >= 0 &&
    ageMs <= JOB_SCHEMA_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
  const hasRequiredContent =
    Boolean(job.title.trim()) &&
    Boolean(job.companies?.name?.trim()) &&
    stripHtml(job.description).length >= 100 &&
    Boolean(job.apply_url);
  const hasValidLocation =
    job.remote_type === "remote"
      ? Boolean(inferApplicantCountry(job.location))
      : Boolean(job.location?.trim());

  return hasCurrentSource && hasRequiredContent && hasValidLocation;
}

export function buildJobPostingJsonLd(job: JobWithCompany) {
  const companyName = getJobCompanyName(job);
  const postedAt = job.posted_at ?? job.discovered_at;
  const lastSeenAt = job.last_seen_at ?? job.updated_at ?? job.discovered_at;
  const description = stripHtml(job.description) || getJobMetaDescription(job);
  const applicantCountry = job.remote_type === "remote" ? inferApplicantCountry(job.location) : null;
  const validThrough = new Date(
    new Date(lastSeenAt).getTime() + JOB_SCHEMA_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description,
    identifier: {
      "@type": "PropertyValue",
      name: companyName,
      value: job.external_id
    },
    datePosted: postedAt,
    dateModified: lastSeenAt,
    validThrough,
    employmentType: inferEmploymentType(job),
    hiringOrganization: {
      "@type": "Organization",
      name: companyName,
      sameAs: job.companies?.website ?? undefined
    },
    baseSalary: buildBaseSalary(job),
    jobLocation: job.remote_type === "remote" ? undefined : buildJobLocation(job),
    applicantLocationRequirements: applicantCountry
      ? {
          "@type": "Country",
          name: applicantCountry
        }
      : undefined,
    jobLocationType: job.remote_type === "remote" ? "TELECOMMUTE" : undefined,
    directApply: isEmployerOrAtsApplyUrl(job),
    url: absoluteUrl(getJobPath(job))
  };
}

export function buildJobBreadcrumbJsonLd(job: JobWithCompany) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/")
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Jobs",
        item: absoluteUrl("/jobs")
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${job.title} at ${getJobCompanyName(job)}`,
        item: absoluteUrl(getJobPath(job))
      }
    ]
  };
}
