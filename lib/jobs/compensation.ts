import type { Job, Json } from "@/types/database";

type CompensationJob = Pick<Job, "description" | "location" | "raw_data">;
type JsonRecord = Record<string, Json | undefined>;
type SalaryInterval = "hour" | "week" | "month" | "year";
type StructuredSalary = {
  currency: string;
  interval: SalaryInterval;
  max: number;
  min: number;
  symbol: string;
};

function asRecord(value: Json | null | undefined): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function asNumber(value: Json | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return value;
}

function asString(value: Json | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function inferCurrency(location: string | null, raw?: JsonRecord | null) {
  const rawCurrency = asString(raw?.salary_currency)?.toUpperCase();
  if (rawCurrency) return rawCurrency;

  const text = (location ?? "").toLowerCase();

  if (/\b(london|united kingdom|uk|england|scotland|wales|manchester|birmingham)\b/.test(text)) {
    return "GBP";
  }

  if (/\b(canada|toronto|vancouver|montreal|calgary|ottawa)\b/.test(text)) {
    return "CAD";
  }

  if (/\b(australia|sydney|melbourne|brisbane|perth)\b/.test(text)) {
    return "AUD";
  }

  if (/\b(germany|france|spain|ireland|netherlands|italy|portugal|europe)\b/.test(text)) {
    return "EUR";
  }

  return "USD";
}

function getCurrencySymbol(currency: string) {
  if (currency === "USD") return "$";
  if (currency === "GBP") return "GBP ";
  if (currency === "EUR") return "EUR ";
  if (currency === "CAD") return "C$";
  if (currency === "AUD") return "A$";
  return `${currency} `;
}

function inferInterval(value: string | null | undefined): SalaryInterval {
  const text = (value ?? "").toLowerCase();

  if (/\b(hour|hourly|hr)\b/.test(text)) return "hour";
  if (/\b(week|weekly)\b/.test(text)) return "week";
  if (/\b(month|monthly|mo)\b/.test(text)) return "month";
  return "year";
}

function isValidSalaryRange(min: number | null, max: number | null, interval: SalaryInterval) {
  if (!min || !max) return false;
  if (min <= 0 || max <= 0 || max < min) return false;

  const floorByInterval: Record<SalaryInterval, number> = {
    hour: 7,
    month: 1000,
    week: 200,
    year: 10000
  };
  const ceilingByInterval: Record<SalaryInterval, number> = {
    hour: 500,
    month: 100000,
    week: 50000,
    year: 1000000
  };

  return min >= floorByInterval[interval] && max <= ceilingByInterval[interval];
}

function formatCurrencyAmount(value: number, symbol: string, interval: SalaryInterval) {
  const amount = Math.round(value);

  if (interval !== "hour" && Math.abs(amount) >= 1000) {
    return `${symbol}${Math.round(amount / 1000).toLocaleString("en-US")}k`;
  }

  return `${symbol}${amount.toLocaleString("en-US")}`;
}

function formatInterval(interval: SalaryInterval) {
  if (interval === "hour") return "hr";
  if (interval === "week") return "wk";
  if (interval === "month") return "mo";
  return "yr";
}

function formatSalaryRange(salary: StructuredSalary) {
  const min = formatCurrencyAmount(salary.min, salary.symbol, salary.interval);
  const max = formatCurrencyAmount(salary.max, salary.symbol, salary.interval);

  if (Math.round(salary.min) === Math.round(salary.max)) {
    return `${min}/${formatInterval(salary.interval)}`;
  }

  return `${min}-${max}/${formatInterval(salary.interval)}`;
}

function stripHtml(value: string | null | undefined) {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseSalaryNumber(value: string) {
  const clean = value.replace(/,/g, "").trim();
  const number = Number.parseFloat(clean.replace(/k$/i, ""));

  if (!Number.isFinite(number)) return null;
  return /k$/i.test(clean) ? number * 1000 : number;
}

function structuredFromValues({
  currency,
  interval,
  location,
  max,
  min,
  raw
}: {
  currency?: string | null;
  interval?: string | null;
  location: string | null;
  max: number | null;
  min: number | null;
  raw?: JsonRecord | null;
}) {
  const salaryInterval = inferInterval(interval);
  if (!isValidSalaryRange(min, max, salaryInterval)) return null;

  const resolvedCurrency = (currency ?? inferCurrency(location, raw)).toUpperCase();

  return {
    currency: resolvedCurrency,
    interval: salaryInterval,
    max: max as number,
    min: min as number,
    symbol: getCurrencySymbol(resolvedCurrency)
  } satisfies StructuredSalary;
}

function getStructuredSalaryFromRaw(raw: JsonRecord | null, location: string | null) {
  if (!raw) return null;

  const salaryRange = asRecord(raw.salaryRange);
  const min = asNumber(raw.salary_min) ?? asNumber(salaryRange?.min);
  const max = asNumber(raw.salary_max) ?? asNumber(salaryRange?.max);
  const currency = asString(raw.salary_currency) ?? asString(salaryRange?.currency);
  const interval = asString(raw.salary_interval) ?? asString(salaryRange?.interval);

  return structuredFromValues({
    currency,
    interval,
    location,
    max,
    min,
    raw
  });
}

function extractStructuredSalaryFromText(value: string | null | undefined, location: string | null, raw: JsonRecord | null) {
  const text = stripHtml(value);
  const match = text.match(
    /(?:USD|US\$|\$|GBP|EUR|CAD|AUD)?\s?(\d[\d,.]*(?:k)?)\s*(?:-|to)\s*(?:USD|US\$|\$|GBP|EUR|CAD|AUD)?\s?(\d[\d,.]*(?:k)?)(?:\s*(?:per|\/)\s*(year|yr|hour|hr|month|mo|week|wk|annum))?/i
  );

  if (!match) return null;

  const min = parseSalaryNumber(match[1] ?? "");
  const max = parseSalaryNumber(match[2] ?? "");
  const interval = match[3] ?? text;
  const currencyMatch = match[0]?.match(/USD|US\$|\$|GBP|EUR|CAD|AUD/i)?.[0]?.toUpperCase();
  const currency =
    currencyMatch === "$" || currencyMatch === "US$"
      ? "USD"
      : currencyMatch ?? inferCurrency(location, raw);

  return structuredFromValues({
    currency,
    interval,
    location,
    max,
    min,
    raw
  });
}

function extractStructuredSalaryFromExtensions(raw: JsonRecord | null, location: string | null) {
  if (!raw) return null;

  const detectedExtensions = asRecord(raw.detected_extensions);
  const detectedSalary =
    asString(detectedExtensions?.salary) ??
    asString(detectedExtensions?.pay) ??
    asString(detectedExtensions?.compensation);

  if (detectedSalary) {
    return extractStructuredSalaryFromText(detectedSalary, location, raw);
  }

  const extensions = raw.extensions;

  if (Array.isArray(extensions)) {
    const match = extensions
      .filter((item): item is string => typeof item === "string")
      .find((item) => /(?:salary|pay|compensation|USD|US\$|\$|GBP|EUR|CAD|AUD|\b\d+\s?k\b)/i.test(item));

    if (match) return extractStructuredSalaryFromText(match, location, raw);
  }

  return null;
}

export function getJobStructuredSalary(job: CompensationJob) {
  const raw = asRecord(job.raw_data);

  return (
    getStructuredSalaryFromRaw(raw, job.location) ??
    extractStructuredSalaryFromExtensions(raw, job.location) ??
    extractStructuredSalaryFromText(job.description, job.location, raw)
  );
}

export function getJobCompensationLabel(job: CompensationJob) {
  const salary = getJobStructuredSalary(job);
  return salary ? formatSalaryRange(salary) : null;
}
