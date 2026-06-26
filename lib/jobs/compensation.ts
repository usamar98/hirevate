import type { Job, Json } from "@/types/database";

type CompensationJob = Pick<Job, "description" | "location" | "raw_data">;
type JsonRecord = Record<string, Json | undefined>;

function asRecord(value: Json | null | undefined): JsonRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function asNumber(value: Json | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: Json | undefined) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function inferCurrencySymbol(location: string | null) {
  const text = (location ?? "").toLowerCase();

  if (/\b(london|united kingdom|uk|england|scotland|wales|manchester|birmingham)\b/.test(text)) {
    return "£";
  }

  if (/\b(canada|toronto|vancouver|montreal|calgary|ottawa)\b/.test(text)) {
    return "C$";
  }

  if (/\b(australia|sydney|melbourne|brisbane|perth)\b/.test(text)) {
    return "A$";
  }

  if (/\b(germany|france|spain|ireland|netherlands|italy|portugal|europe)\b/.test(text)) {
    return "€";
  }

  return "$";
}

function formatCurrencyAmount(value: number, symbol: string) {
  const amount = Math.round(value);

  if (Math.abs(amount) >= 1000) {
    return `${symbol}${Math.round(amount / 1000).toLocaleString("en-US")}k`;
  }

  return `${symbol}${amount.toLocaleString("en-US")}`;
}

function formatSalaryRange(min: number | null, max: number | null, symbol: string) {
  if (min && max) {
    if (Math.round(min) === Math.round(max)) return formatCurrencyAmount(min, symbol);
    return `${formatCurrencyAmount(min, symbol)}-${formatCurrencyAmount(max, symbol)}`;
  }

  if (min) return `From ${formatCurrencyAmount(min, symbol)}`;
  if (max) return `Up to ${formatCurrencyAmount(max, symbol)}`;

  return null;
}

function stripHtml(value: string | null | undefined) {
  return (value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanCompensationText(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s*[-–—]\s*/g, "-")
    .trim()
    .slice(0, 80);
}

function extractCompensationFromText(value: string | null | undefined) {
  const text = stripHtml(value);
  const match = text.match(
    /((?:USD|US\$|\$|£|€)\s?\d[\d,.]*(?:\s?[kK])?(?:\s*(?:-|to)\s*(?:USD|US\$|\$|£|€)?\s?\d[\d,.]*(?:\s?[kK])?)?(?:\s*(?:per|\/)\s*(?:year|yr|hour|hr|month|mo|annum))?)/i
  );

  return match ? cleanCompensationText(match[1]) : null;
}

function extractCompensationFromExtensions(raw: JsonRecord) {
  const detectedExtensions = asRecord(raw.detected_extensions);
  const detectedSalary =
    asString(detectedExtensions?.salary) ??
    asString(detectedExtensions?.pay) ??
    asString(detectedExtensions?.compensation);

  if (detectedSalary) return cleanCompensationText(detectedSalary);

  const extensions = raw.extensions;

  if (Array.isArray(extensions)) {
    const match = extensions
      .filter((item): item is string => typeof item === "string")
      .find((item) => /(?:salary|pay|compensation|USD|US\$|\$|£|€|\b\d+\s?k\b)/i.test(item));

    if (match) return cleanCompensationText(match);
  }

  return null;
}

export function getJobCompensationLabel(job: CompensationJob) {
  const raw = asRecord(job.raw_data);
  const symbol = inferCurrencySymbol(job.location);
  const salaryRange = raw
    ? formatSalaryRange(asNumber(raw.salary_min), asNumber(raw.salary_max), symbol)
    : null;

  return salaryRange ?? (raw ? extractCompensationFromExtensions(raw) : null) ?? extractCompensationFromText(job.description);
}
