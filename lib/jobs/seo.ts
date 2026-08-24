import { getJobStructuredSalary } from "@/lib/jobs/compensation";
import {
  getJobLocationCountries,
  getJobLocationLocalities
} from "@/lib/jobs/countries";
import { getSafeJobApplyUrl, isEmployerOrAtsApplyUrl } from "@/lib/jobs/sources";
import { classifyStudentJob } from "@/lib/jobs/student-part-time";
import { absoluteUrl, siteName } from "@/lib/seo";
import type { Company, Job, JobWithCompany } from "@/types/database";

const JOB_SCHEMA_MAX_AGE_DAYS = 5;
const JOB_META_TITLE_MAX_LENGTH = 60;
const JOB_META_DESCRIPTION_MAX_LENGTH = 155;

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

function truncateMetaText(value: string, maxLength: number) {
  if (value.length <= maxLength) return value;

  const clipped = value.slice(0, maxLength - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  const safeClip = lastSpace >= Math.floor(maxLength * 0.65) ? clipped.slice(0, lastSpace) : clipped;
  return `${safeClip.replace(/[,:;\s]+$/, "")}…`;
}

export function getJobMetaTitle(job: JobWithCompany) {
  return truncateMetaText(
    `${job.title} at ${getJobCompanyName(job)} | ${siteName}`,
    JOB_META_TITLE_MAX_LENGTH
  );
}

export function getJobMetaDescription(job: JobWithCompany) {
  const location = job.location ? ` in ${job.location}` : "";
  const applyDescription = isEmployerOrAtsApplyUrl(job)
    ? "Apply on the available employer or ATS page."
    : "Review the available hiring source and apply there.";

  return truncateMetaText(
    `${job.title} at ${getJobCompanyName(job)}${location}. ${applyDescription}`,
    JOB_META_DESCRIPTION_MAX_LENGTH
  );
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
  const classification = classifyStudentJob(job);

  if (text.includes("intern")) return "INTERN";
  if (classification.isPartTime) return "PART_TIME";
  if (text.includes("contract") || text.includes("freelance")) return "CONTRACTOR";
  if (text.includes("temporary") || text.includes("seasonal")) return "TEMPORARY";

  return "FULL_TIME";
}

function buildJobLocations(job: JobWithCompany) {
  const countries = getJobLocationCountries(job.location);

  return countries.flatMap((country) => {
    const localities = getJobLocationLocalities(job.location, country, countries.length);
    const locations = localities.length > 0 ? localities : [undefined];

    return locations.map((addressLocality) => ({
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality,
        addressCountry: country.code
      }
    }));
  });
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
    Boolean(job.posted_at) &&
    isEmployerOrAtsApplyUrl(job);
  const locationCountries = getJobLocationCountries(job.location);
  const hasValidLocation =
    Boolean(job.location?.trim()) && locationCountries.length > 0;

  return hasCurrentSource && hasRequiredContent && hasValidLocation;
}

export function buildJobPostingJsonLd(job: JobWithCompany) {
  const companyName = getJobCompanyName(job);
  const description = stripHtml(job.description) || getJobMetaDescription(job);
  const countries = getJobLocationCountries(job.location);
  const jobLocations = job.remote_type === "remote" ? [] : buildJobLocations(job);
  const applicantLocations = countries.map((country) => ({
    "@type": "Country",
    name: country.name
  }));

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
    datePosted: job.posted_at,
    employmentType: inferEmploymentType(job),
    hiringOrganization: {
      "@type": "Organization",
      name: companyName,
      sameAs: getSafeJobApplyUrl(job.companies?.website) ?? undefined
    },
    baseSalary: buildBaseSalary(job),
    jobLocation:
      jobLocations.length === 0
        ? undefined
        : jobLocations.length === 1
          ? jobLocations[0]
          : jobLocations,
    applicantLocationRequirements:
      job.remote_type !== "remote"
        ? undefined
        : applicantLocations.length === 1
          ? applicantLocations[0]
          : applicantLocations,
    jobLocationType: job.remote_type === "remote" ? "TELECOMMUTE" : undefined,
    directApply: false,
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
