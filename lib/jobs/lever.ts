import { createHash } from "crypto";
import { env, hasLeverConfig } from "@/lib/env";
import { calculateFreshnessScore, inferRemoteType } from "@/lib/jobs/freshness";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Company, Database, Json } from "@/types/database";
import type { JobSyncResult } from "@/lib/jobs/sync-types";

type LeverRegion = "global" | "eu";

type LeverSource = {
  companyName: string;
  region: LeverRegion;
  slug: string;
};

type LeverCategories = {
  allLocations?: string[] | null;
  commitment?: string | null;
  department?: string | null;
  location?: string | null;
  team?: string | null;
};

type LeverList = {
  content?: string | null;
  text?: string | null;
};

type LeverSalaryRange = {
  currency?: string | null;
  interval?: string | null;
  max?: number | null;
  min?: number | null;
};

type LeverPosting = {
  additional?: string | null;
  additionalPlain?: string | null;
  applyUrl?: string | null;
  categories?: LeverCategories | null;
  country?: string | null;
  createdAt?: number | string | null;
  description?: string | null;
  descriptionPlain?: string | null;
  hostedUrl?: string | null;
  id?: string | null;
  lists?: LeverList[] | null;
  opening?: string | null;
  openingPlain?: string | null;
  salaryRange?: LeverSalaryRange | null;
  text?: string | null;
  updatedAt?: number | string | null;
  workplaceType?: string | null;
};

type LeverCompany = Pick<Company, "greenhouse_slug" | "id">;

const sourceName = "lever";

function parsePositiveInt(value: string, fallback: number, max: number) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), max);
}

function getMaxCompaniesPerSync() {
  return parsePositiveInt(env.leverMaxCompaniesPerSync, 100, 500);
}

function titleizeSlug(slug: string) {
  return slug
    .replace(/^jobs-?/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim();
}

function getLeverSlugFromUrl(value: string) {
  try {
    const url = new URL(value);
    const [slug] = url.pathname.split("/").filter(Boolean);
    return slug ?? "";
  } catch {
    return value;
  }
}

function cleanSlug(value: string) {
  return getLeverSlugFromUrl(value)
    .trim()
    .replace(/^eu:/i, "")
    .replace(/[^a-zA-Z0-9_-]/g, "");
}

function parseLeverSourceEntry(entry: string, region: LeverRegion): LeverSource | null {
  let value = entry.trim();
  if (!value) return null;

  let sourceRegion = region;
  if (value.toLowerCase().startsWith("eu:")) {
    sourceRegion = "eu";
    value = value.slice(3).trim();
  }

  const [rawSlug, rawCompanyName] = value.split("=").map((part) => part.trim());
  const slug = cleanSlug(rawSlug ?? "");
  if (!slug) return null;

  return {
    companyName: rawCompanyName || titleizeSlug(slug) || slug,
    region: sourceRegion,
    slug
  };
}

function parseLeverSources() {
  const entries = [
    ...env.leverCompanySlugs
      .split(/[,\n;]/)
      .map((entry) => parseLeverSourceEntry(entry, "global")),
    ...env.leverEuCompanySlugs
      .split(/[,\n;]/)
      .map((entry) => parseLeverSourceEntry(entry, "eu"))
  ].filter(Boolean) as LeverSource[];

  const uniqueSources = new Map<string, LeverSource>();
  for (const source of entries) {
    uniqueSources.set(`${source.region}:${source.slug.toLowerCase()}`, source);
  }

  return Array.from(uniqueSources.values()).slice(0, getMaxCompaniesPerSync());
}

function getCompanySlug(source: LeverSource) {
  return `${sourceName}-${source.region === "eu" ? "eu-" : ""}${source.slug.toLowerCase()}`;
}

function getCompanyWebsite(source: LeverSource) {
  return `https://jobs.lever.co/${source.slug}`;
}

function getLeverApiUrl(source: LeverSource) {
  const host = source.region === "eu" ? "api.eu.lever.co" : "api.lever.co";
  const url = new URL(`https://${host}/v0/postings/${encodeURIComponent(source.slug)}`);
  url.searchParams.set("mode", "json");
  return url;
}

function toIsoDate(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const millis = value < 100_000_000_000 ? value * 1000 : value;
    const date = new Date(millis);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  if (typeof value === "string" && value.trim()) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return toIsoDate(numeric);

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  return null;
}

function getLocation(job: LeverPosting) {
  const categories = job.categories;
  const allLocations = categories?.allLocations?.filter(Boolean) ?? [];
  const location = categories?.location?.trim() || allLocations.join(", ").trim();

  if (location) return location;
  if ((job.workplaceType ?? "").toLowerCase() === "remote") return "Remote";

  return job.country ?? null;
}

function getRemoteType(job: LeverPosting, title: string, location: string | null) {
  const workplaceType = (job.workplaceType ?? "").toLowerCase();

  if (workplaceType === "remote") return "remote";
  if (workplaceType === "hybrid") return "hybrid";
  if (workplaceType === "onsite" || workplaceType === "on-site") return "onsite";

  return inferRemoteType(title, location);
}

function getExternalId(source: LeverSource, job: LeverPosting) {
  if (job.id) return `lever:${job.id}`;

  const stableValue = job.hostedUrl ?? job.applyUrl ?? `${source.slug}:${job.text ?? "untitled"}`;
  const hash = createHash("sha256").update(stableValue).digest("hex").slice(0, 24);
  return `lever:fallback:${hash}`;
}

function formatSalaryAmount(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      currency,
      maximumFractionDigits: 0,
      style: "currency"
    }).format(value);
  } catch {
    return `$${Math.round(value).toLocaleString("en-US")}`;
  }
}

function getSalaryDescription(job: LeverPosting) {
  const range = job.salaryRange;
  const min = typeof range?.min === "number" && Number.isFinite(range.min) ? range.min : null;
  const max = typeof range?.max === "number" && Number.isFinite(range.max) ? range.max : null;

  if (!min && !max) return null;

  const currency = range?.currency?.trim() || "USD";
  const interval = range?.interval?.trim();
  const suffix = interval ? ` / ${interval}` : "";

  if (min && max) {
    return `${formatSalaryAmount(min, currency)}-${formatSalaryAmount(max, currency)}${suffix}`;
  }

  if (min) return `From ${formatSalaryAmount(min, currency)}${suffix}`;
  if (max) return `Up to ${formatSalaryAmount(max, currency)}${suffix}`;

  return null;
}

function section(title: string, html: string | null | undefined) {
  if (!html?.trim()) return "";
  return `<h3>${title}</h3>${html}`;
}

function buildDescription(job: LeverPosting) {
  const salaryDescription = getSalaryDescription(job);
  const listHtml = (job.lists ?? [])
    .map((item) => section(item.text ?? "Details", item.content))
    .join("");
  const salaryHtml = salaryDescription ? `<h3>Compensation</h3><p>${salaryDescription}</p>` : "";

  return [
    job.opening,
    job.description,
    listHtml,
    job.additional ? section("Additional information", job.additional) : "",
    salaryHtml
  ]
    .filter((part) => part?.trim())
    .join("");
}

async function fetchLeverJobs(source: LeverSource) {
  const response = await fetch(getLeverApiUrl(source), {
    headers: {
      accept: "application/json"
    },
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`Lever returned ${response.status}`);
  }

  const payload = (await response.json()) as LeverPosting[];
  return Array.isArray(payload) ? payload : [];
}

async function ensureLeverCompanies(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  sources: LeverSource[]
) {
  const companyRows = sources.map((source) => ({
    greenhouse_slug: getCompanySlug(source),
    industry: "Direct employer",
    is_active: true,
    name: source.companyName,
    website: getCompanyWebsite(source)
  })) satisfies Database["public"]["Tables"]["companies"]["Insert"][];

  if (companyRows.length === 0) return new Map<string, LeverCompany>();

  const { error } = await supabase.from("companies").upsert(companyRows, {
    onConflict: "greenhouse_slug"
  });

  if (error) {
    throw error;
  }

  const { data, error: selectError } = await supabase
    .from("companies")
    .select("id, greenhouse_slug")
    .in(
      "greenhouse_slug",
      sources.map((source) => getCompanySlug(source))
    );

  if (selectError) {
    throw selectError;
  }

  return new Map((data ?? []).map((company) => [company.greenhouse_slug, company]));
}

function normalizeJob(source: LeverSource, companyId: string, job: LeverPosting) {
  const title = job.text?.trim() || "Untitled role";
  const location = getLocation(job);
  const applyUrl = job.applyUrl ?? job.hostedUrl ?? null;
  const sourceUrl = job.hostedUrl ?? applyUrl;
  const updatedAt = toIsoDate(job.updatedAt ?? job.createdAt);
  const salaryDescription = getSalaryDescription(job);
  const rawData = {
    ...job,
    salary_currency: job.salaryRange?.currency ?? null,
    salary_description: salaryDescription,
    salary_interval: job.salaryRange?.interval ?? null,
    salary_max: job.salaryRange?.max ?? null,
    salary_min: job.salaryRange?.min ?? null
  };

  return {
    apply_url: applyUrl,
    company_id: companyId,
    description: buildDescription(job) || job.descriptionPlain || job.openingPlain || null,
    external_id: getExternalId(source, job),
    freshness_score: calculateFreshnessScore({
      applyUrl,
      location,
      sourceUrl,
      title,
      updatedAt
    }),
    location,
    posted_at: toIsoDate(job.createdAt),
    raw_data: rawData as unknown as Json,
    remote_type: getRemoteType(job, title, location),
    source: sourceName,
    source_url: sourceUrl,
    status: "active",
    title,
    updated_at: updatedAt
  } satisfies Database["public"]["Tables"]["jobs"]["Insert"];
}

export async function syncLeverJobs(): Promise<JobSyncResult> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error("Supabase service role environment variables are not configured.");
  }

  const sources = parseLeverSources();
  const sourceResult = {
    configured: hasLeverConfig(),
    skippedReason: sources.length === 0 ? "Add LEVER_COMPANY_SLUGS in Vercel to enable Lever sync." : undefined,
    source: sourceName,
    totalJobsFetched: 0,
    totalJobsInserted: 0,
    totalJobsUpdated: 0,
    totalRequests: 0,
    totalSkipped: 0
  };

  const result: JobSyncResult = {
    errors: [],
    sourceResults: [sourceResult],
    totalCompaniesChecked: 0,
    totalJobsInserted: 0,
    totalJobsUpdated: 0
  };

  if (sources.length === 0) {
    return result;
  }

  const companies = await ensureLeverCompanies(supabase, sources);

  for (const source of sources) {
    result.totalCompaniesChecked += 1;
    sourceResult.totalRequests += 1;

    try {
      const company = companies.get(getCompanySlug(source));
      if (!company) {
        throw new Error("Lever company record was not found after upsert.");
      }

      const jobs = await fetchLeverJobs(source);
      result.sourceResults[0].totalJobsFetched += jobs.length;

      const normalizedJobs = jobs.map((job) => normalizeJob(source, company.id, job));
      if (normalizedJobs.length > 0) {
        const externalIds = normalizedJobs.map((job) => job.external_id);
        const { data: existingJobs, error: existingError } = await supabase
          .from("jobs")
          .select("external_id")
          .eq("company_id", company.id)
          .in("external_id", externalIds);

        if (existingError) {
          throw existingError;
        }

        const existingIds = new Set((existingJobs ?? []).map((job) => job.external_id));
        const { error: upsertError } = await supabase.from("jobs").upsert(normalizedJobs, {
          onConflict: "company_id,external_id"
        });

        if (upsertError) {
          throw upsertError;
        }

        for (const job of normalizedJobs) {
          if (existingIds.has(job.external_id)) {
            result.totalJobsUpdated += 1;
            sourceResult.totalJobsUpdated += 1;
          } else {
            result.totalJobsInserted += 1;
            sourceResult.totalJobsInserted += 1;
          }
        }
      }

      await supabase
        .from("companies")
        .update({ last_synced_at: new Date().toISOString() })
        .eq("greenhouse_slug", getCompanySlug(source));
    } catch (error) {
      sourceResult.totalSkipped = (sourceResult.totalSkipped ?? 0) + 1;
      result.errors.push({
        source: sourceName,
        company: source.companyName,
        slug: source.slug,
        message: error instanceof Error ? error.message : "Unknown Lever sync error"
      });
    }
  }

  if ((sourceResult.totalSkipped ?? 0) > 0) {
    sourceResult.skippedReason = `${sourceResult.totalSkipped} Lever boards were skipped. Check invalid slugs or region settings.`;
  }

  return result;
}
