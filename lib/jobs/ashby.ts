import { createHash } from "crypto";
import { env, hasAshbyConfig } from "@/lib/env";
import { defaultAshbySources } from "@/lib/jobs/default-ashby-sources";
import { calculateFreshnessScore, inferRemoteType } from "@/lib/jobs/freshness";
import { getSourceHealthStatus, recordSourceFailure, recordSourceSuccess } from "@/lib/jobs/source-health";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Company, Database, Json } from "@/types/database";
import type { JobSyncResult, JobSyncSourceResult } from "@/lib/jobs/sync-types";

type AshbySource = {
  companyName: string;
  industry: string;
  slug: string;
};

type AshbyAddress = {
  postalAddress?: {
    addressCountry?: string | null;
    addressLocality?: string | null;
    addressRegion?: string | null;
  } | null;
};

type AshbySecondaryLocation =
  | string
  | {
      address?: AshbyAddress | null;
      location?: string | null;
      name?: string | null;
    };

type AshbyCompensationComponent = {
  compensationType?: string | null;
  currencyCode?: string | null;
  interval?: string | null;
  maxValue?: number | null;
  minValue?: number | null;
  summary?: string | null;
};

type AshbyCompensation = {
  compensationTierSummary?: string | null;
  compensationTiers?: Array<{
    components?: AshbyCompensationComponent[] | null;
    tierSummary?: string | null;
  }> | null;
  scrapeableCompensationSalarySummary?: string | null;
  summaryComponents?: AshbyCompensationComponent[] | null;
};

type AshbyJob = {
  address?: AshbyAddress | null;
  applyUrl?: string | null;
  compensation?: AshbyCompensation | null;
  department?: string | null;
  descriptionHtml?: string | null;
  descriptionPlain?: string | null;
  employmentType?: string | null;
  id?: string | null;
  isListed?: boolean | null;
  isRemote?: boolean | null;
  jobUrl?: string | null;
  location?: string | null;
  publishedAt?: string | null;
  secondaryLocations?: AshbySecondaryLocation[] | null;
  shouldDisplayCompensationOnJobPostings?: boolean | null;
  team?: string | null;
  title?: string | null;
  workplaceType?: string | null;
};

type AshbyResponse = {
  jobs?: AshbyJob[];
};

type AshbyCompany = Pick<Company, "greenhouse_slug" | "id" | "is_active">;

const sourceName = "ashby";
const requestTimeoutMs = 15_000;

class AshbyHttpError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "AshbyHttpError";
  }
}

function parsePositiveInt(value: string, fallback: number, max: number) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), max);
}

function getMaxCompaniesPerSync() {
  return parsePositiveInt(env.ashbyMaxCompaniesPerSync, 140, 300);
}

function titleizeSlug(slug: string) {
  return slug
    .replace(/^jobs-?/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function getAshbySlugFromUrl(value: string) {
  try {
    const url = new URL(value);
    const parts = url.pathname.split("/").filter(Boolean);

    if (url.hostname.endsWith("ashbyhq.com") && parts[0] === "posting-api" && parts[1] === "job-board") {
      return parts[2] ?? "";
    }

    if (url.hostname.endsWith("ashbyhq.com")) {
      return parts[0] ?? "";
    }

    return value;
  } catch {
    return value;
  }
}

function cleanSlug(value: string) {
  return getAshbySlugFromUrl(value)
    .trim()
    .replace(/^ashby:/i, "")
    .replace(/[^a-zA-Z0-9_-]/g, "");
}

function parseAshbySourceEntry(entry: string): AshbySource | null {
  const value = entry.trim();
  if (!value) return null;

  const [rawSlug, rawCompanyName, rawIndustry] = value.split("=").map((part) => part.trim());
  const slug = cleanSlug(rawSlug ?? "");
  if (!slug) return null;

  return {
    companyName: rawCompanyName || titleizeSlug(slug) || slug,
    industry: rawIndustry || "Public ATS",
    slug
  };
}

function parseAshbySources() {
  const configuredSources = env.ashbyCompanySlugs
    .split(/[,\n;]/)
    .map(parseAshbySourceEntry)
    .filter(Boolean) as AshbySource[];

  const bundledSources =
    env.ashbyDisableDefaultSources.toLowerCase() === "true"
      ? []
      : defaultAshbySources.map((source) => ({
          companyName: source.name,
          industry: source.industry,
          slug: source.slug
        }));

  const uniqueSources = new Map<string, AshbySource>();
  for (const source of [...configuredSources, ...bundledSources]) {
    uniqueSources.set(source.slug.toLowerCase(), source);
  }

  return Array.from(uniqueSources.values()).slice(0, getMaxCompaniesPerSync());
}

function getCompanySlug(source: AshbySource) {
  return `${sourceName}-${source.slug.toLowerCase()}`;
}

function getCompanyWebsite(source: AshbySource) {
  return `https://jobs.ashbyhq.com/${source.slug}`;
}

function getAshbyApiUrl(source: AshbySource) {
  const url = new URL(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(source.slug)}`);
  url.searchParams.set("includeCompensation", "true");
  return url;
}

function toIsoDate(value: string | null | undefined) {
  if (!value?.trim()) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function getAddressLabel(address: AshbyAddress | null | undefined) {
  const postalAddress = address?.postalAddress;
  if (!postalAddress) return null;

  return [
    postalAddress.addressLocality,
    postalAddress.addressRegion,
    postalAddress.addressCountry
  ]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ") || null;
}

function getSecondaryLocationLabel(location: AshbySecondaryLocation) {
  if (typeof location === "string") return location.trim() || null;

  return (
    location.location?.trim() ||
    location.name?.trim() ||
    getAddressLabel(location.address) ||
    null
  );
}

function uniqueText(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const cleanValue = value?.trim();
    if (!cleanValue) continue;

    const key = cleanValue.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    result.push(cleanValue);
  }

  return result;
}

function getLocation(job: AshbyJob) {
  const locations = uniqueText([
    job.location,
    getAddressLabel(job.address),
    ...(job.secondaryLocations ?? []).map(getSecondaryLocationLabel)
  ]);

  if (locations.length > 0) return locations.join(", ");
  if (job.isRemote) return "Remote";

  return null;
}

function getRemoteType(job: AshbyJob, title: string, location: string | null) {
  const workplaceType = (job.workplaceType ?? "").toLowerCase().replace(/[\s_-]+/g, "");

  if (workplaceType === "remote") return "remote";
  if (workplaceType === "hybrid") return "hybrid";
  if (workplaceType === "onsite" || workplaceType === "onpremise") return "onsite";
  if (job.isRemote) return "remote";

  return inferRemoteType(title, location);
}

function getExternalId(source: AshbySource, job: AshbyJob) {
  if (job.id) return `ashby:${source.slug}:${job.id}`;

  const stableValue = job.jobUrl ?? job.applyUrl ?? `${source.slug}:${job.title ?? "untitled"}`;
  const hash = createHash("sha256").update(stableValue).digest("hex").slice(0, 24);
  return `ashby:fallback:${source.slug}:${hash}`;
}

function getCompensationComponents(job: AshbyJob) {
  const compensation = job.compensation;
  const tierComponents = (compensation?.compensationTiers ?? []).flatMap((tier) => tier.components ?? []);
  return [...(compensation?.summaryComponents ?? []), ...tierComponents];
}

function getSalaryMetadata(job: AshbyJob) {
  const compensation = job.compensation;
  const components = getCompensationComponents(job);
  const salaryComponent = components.find((component) => {
    const text = `${component.compensationType ?? ""} ${component.summary ?? ""}`.toLowerCase();
    return /salary|cash|base/.test(text) && typeof component.minValue === "number" && typeof component.maxValue === "number";
  });

  return {
    salary_currency: salaryComponent?.currencyCode ?? null,
    salary_description:
      compensation?.scrapeableCompensationSalarySummary ??
      compensation?.compensationTierSummary ??
      salaryComponent?.summary ??
      null,
    salary_interval: salaryComponent?.interval ?? null,
    salary_max: salaryComponent?.maxValue ?? null,
    salary_min: salaryComponent?.minValue ?? null
  };
}

function buildDescription(job: AshbyJob) {
  const compensation = getSalaryMetadata(job);
  const compensationHtml =
    job.shouldDisplayCompensationOnJobPostings && compensation.salary_description
      ? `<h3>Compensation</h3><p>${compensation.salary_description}</p>`
      : "";

  return [job.descriptionHtml, compensationHtml].filter((part) => part?.trim()).join("");
}

function normalizeJob(source: AshbySource, companyId: string, job: AshbyJob) {
  const title = job.title?.trim() || "Untitled role";
  const location = getLocation(job);
  const applyUrl = job.applyUrl ?? job.jobUrl ?? null;
  const sourceUrl = job.jobUrl ?? applyUrl;
  const updatedAt = toIsoDate(job.publishedAt);
  const salary = getSalaryMetadata(job);
  const rawData = {
    ...job,
    salaryRange: {
      currency: salary.salary_currency,
      interval: salary.salary_interval,
      max: salary.salary_max,
      min: salary.salary_min
    },
    ...salary
  };

  return {
    apply_url: applyUrl,
    company_id: companyId,
    description: buildDescription(job) || job.descriptionPlain || null,
    external_id: getExternalId(source, job),
    freshness_score: calculateFreshnessScore({
      applyUrl,
      location,
      sourceUrl,
      title,
      updatedAt
    }),
    location,
    posted_at: updatedAt,
    raw_data: rawData as unknown as Json,
    remote_type: getRemoteType(job, title, location),
    source: sourceName,
    source_url: sourceUrl,
    status: "active",
    title,
    updated_at: updatedAt
  } satisfies Database["public"]["Tables"]["jobs"]["Insert"];
}

async function fetchAshbyJobs(source: AshbySource) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

  try {
    const response = await fetch(getAshbyApiUrl(source), {
      headers: {
        accept: "application/json"
      },
      next: { revalidate: 0 },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new AshbyHttpError(`Ashby returned ${response.status}`, response.status);
    }

    const payload = (await response.json()) as AshbyResponse;
    return (payload.jobs ?? []).filter((job) => job.isListed !== false);
  } finally {
    clearTimeout(timeout);
  }
}

async function ensureAshbyCompanies(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  sources: AshbySource[]
) {
  if (sources.length === 0) return new Map<string, AshbyCompany>();

  const sourceSlugs = sources.map((source) => getCompanySlug(source));
  const { data: existingRows, error: existingError } = await supabase
    .from("companies")
    .select("id, greenhouse_slug, is_active")
    .in("greenhouse_slug", sourceSlugs);

  if (existingError) throw existingError;

  const existingSlugs = new Set((existingRows ?? []).map((company) => company.greenhouse_slug));
  const missingRows = sources
    .filter((source) => !existingSlugs.has(getCompanySlug(source)))
    .map((source) => ({
      greenhouse_slug: getCompanySlug(source),
      industry: source.industry,
      is_active: true,
      name: source.companyName,
      website: getCompanyWebsite(source)
    })) satisfies Database["public"]["Tables"]["companies"]["Insert"][];

  if (missingRows.length > 0) {
    const { error: insertError } = await supabase.from("companies").insert(missingRows);
    if (insertError) throw insertError;
  }

  const { data, error: selectError } = await supabase
    .from("companies")
    .select("id, greenhouse_slug, is_active")
    .in("greenhouse_slug", sourceSlugs);

  if (selectError) throw selectError;

  return new Map((data ?? []).map((company) => [company.greenhouse_slug, company]));
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

async function getExistingJobIds(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  companyId: string,
  externalIds: string[]
) {
  const existingIds = new Set<string>();

  for (const externalIdChunk of chunk(externalIds, 150)) {
    const { data, error } = await supabase
      .from("jobs")
      .select("external_id")
      .eq("company_id", companyId)
      .in("external_id", externalIdChunk);

    if (error) throw error;
    for (const job of data ?? []) existingIds.add(job.external_id);
  }

  return existingIds;
}

async function upsertJobs(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  jobs: Database["public"]["Tables"]["jobs"]["Insert"][]
) {
  for (const jobChunk of chunk(jobs, 80)) {
    const { error } = await supabase.from("jobs").upsert(jobChunk, {
      onConflict: "company_id,external_id"
    });

    if (error) throw error;
  }
}

async function expireMissingJobs(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  companyId: string,
  activeExternalIds: string[]
) {
  const activeExternalIdSet = new Set(activeExternalIds);
  const { data, error } = await supabase
    .from("jobs")
    .select("id, external_id")
    .eq("company_id", companyId)
    .eq("source", sourceName)
    .eq("status", "active");

  if (error) throw error;

  const expiredIds = (data ?? [])
    .filter((job) => !activeExternalIdSet.has(job.external_id))
    .map((job) => job.id);

  for (const idChunk of chunk(expiredIds, 150)) {
    const { error: updateError } = await supabase
      .from("jobs")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .in("id", idChunk);

    if (updateError) throw updateError;
  }

  return expiredIds.length;
}

function isRetiredAshbyBoard(error: unknown) {
  return error instanceof AshbyHttpError && (error.status === 404 || error.status === 410);
}

function buildSourceResult(sources: AshbySource[]): JobSyncSourceResult {
  return {
    configured: hasAshbyConfig(),
    skippedReason: sources.length === 0 ? "Ashby sync has no sources. Add ASHBY_COMPANY_SLUGS or enable bundled sources." : undefined,
    source: sourceName,
    totalJobsExpired: 0,
    totalJobsFetched: 0,
    totalJobsInserted: 0,
    totalJobsUpdated: 0,
    totalRequests: 0,
    totalSkipped: 0
  };
}

export async function syncAshbyJobs(): Promise<JobSyncResult> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role environment variables are not configured.");
  }

  const sources = parseAshbySources();
  const sourceResult = buildSourceResult(sources);
  const result: JobSyncResult = {
    errors: [],
    sourceResults: [sourceResult],
    totalCompaniesChecked: 0,
    totalJobsExpired: 0,
    totalJobsInserted: 0,
    totalJobsUpdated: 0
  };

  if (sources.length === 0) return result;

  const companies = await ensureAshbyCompanies(supabase, sources);

  for (const source of sources) {
    const companyKey = getCompanySlug(source);
    const company = companies.get(companyKey);
    const healthIdentity = {
      displayName: source.companyName,
      source: sourceName,
      sourceKey: companyKey
    };
    const healthStatus = await getSourceHealthStatus(supabase, healthIdentity);

    if (!company || company.is_active === false || healthStatus.shouldSkip) {
      sourceResult.totalSkipped = (sourceResult.totalSkipped ?? 0) + 1;
      continue;
    }

    result.totalCompaniesChecked += 1;
    sourceResult.totalRequests += 1;

    try {
      const jobs = await fetchAshbyJobs(source);
      const normalizedJobs = jobs.map((job) => normalizeJob(source, company.id, job));
      const externalIds = normalizedJobs.map((job) => job.external_id);
      const existingIds = externalIds.length > 0
        ? await getExistingJobIds(supabase, company.id, externalIds)
        : new Set<string>();
      let sourceJobsInserted = 0;

      sourceResult.totalJobsFetched += jobs.length;

      if (normalizedJobs.length > 0) {
        await upsertJobs(supabase, normalizedJobs);

        for (const job of normalizedJobs) {
          if (existingIds.has(job.external_id)) {
            result.totalJobsUpdated += 1;
            sourceResult.totalJobsUpdated += 1;
          } else {
            result.totalJobsInserted += 1;
            sourceResult.totalJobsInserted += 1;
            sourceJobsInserted += 1;
          }
        }
      }

      const expiredCount = await expireMissingJobs(supabase, company.id, externalIds);
      result.totalJobsExpired = (result.totalJobsExpired ?? 0) + expiredCount;
      sourceResult.totalJobsExpired = (sourceResult.totalJobsExpired ?? 0) + expiredCount;

      await recordSourceSuccess(supabase, healthIdentity, {
        jobsFetched: jobs.length,
        jobsInserted: sourceJobsInserted
      });

      await supabase
        .from("companies")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("id", company.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown Ashby sync error";
      sourceResult.totalSkipped = (sourceResult.totalSkipped ?? 0) + 1;

      if (isRetiredAshbyBoard(error)) {
        await recordSourceFailure(supabase, healthIdentity, message, { permanent: true });
        await supabase
          .from("companies")
          .update({ is_active: false, last_synced_at: new Date().toISOString() })
          .eq("id", company.id);
        continue;
      }

      await recordSourceFailure(supabase, healthIdentity, message);
      result.errors.push({
        source: sourceName,
        company: source.companyName,
        slug: source.slug,
        message
      });
    }
  }

  if ((sourceResult.totalSkipped ?? 0) > 0) {
    sourceResult.skippedReason = `${sourceResult.totalSkipped} Ashby boards were skipped because they failed, are disabled, or are cooling down.`;
  }

  return result;
}
