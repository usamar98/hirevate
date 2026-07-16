import type { Job } from "@/types/database";

type DisplayJob = Pick<Job, "location" | "remote_type">;

const countryLabels = new Set([
  "australia",
  "canada",
  "france",
  "germany",
  "india",
  "ireland",
  "italy",
  "mexico",
  "netherlands",
  "new zealand",
  "pakistan",
  "poland",
  "singapore",
  "spain",
  "u k",
  "uk",
  "united arab emirates",
  "united kingdom",
  "united states",
  "united states of america",
  "u s",
  "us",
  "usa"
]);

const administrativeCodes = new Set([
  "AK", "AL", "AR", "AZ", "CA", "CO", "CT", "DC", "DE", "FL", "GA",
  "HI", "IA", "ID", "IL", "IN", "KS", "KY", "LA", "MA", "MD", "ME",
  "MI", "MN", "MO", "MS", "MT", "NC", "ND", "NE", "NH", "NJ", "NM",
  "NV", "NY", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX",
  "UT", "VA", "VT", "WA", "WI", "WV", "WY", "AB", "BC", "MB", "NB",
  "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT", "ACT", "NSW",
  "QLD", "SA", "TAS", "VIC"
]);

const administrativeNames = new Set([
  "alabama", "alaska", "alberta", "arizona", "arkansas", "australian capital territory",
  "british columbia", "california", "colorado", "connecticut", "delaware",
  "district of columbia", "england", "florida", "georgia", "hawaii", "idaho",
  "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana", "maine",
  "manitoba", "maryland", "massachusetts", "michigan", "minnesota", "mississippi",
  "missouri", "montana", "nebraska", "nevada", "new brunswick", "new hampshire",
  "new jersey", "new mexico", "new south wales", "new york", "newfoundland and labrador",
  "north carolina", "north dakota", "northern ireland", "northern territory",
  "northwest territories", "nova scotia", "nunavut", "ohio", "oklahoma", "ontario",
  "oregon", "pennsylvania", "prince edward island", "quebec", "queensland",
  "rhode island", "saskatchewan", "scotland", "south australia", "south carolina",
  "south dakota", "tasmania", "tennessee", "texas", "utah", "vermont", "victoria",
  "virginia", "wales", "washington", "west virginia", "western australia",
  "wisconsin", "wyoming", "yukon"
]);

function locationKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[.']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isCountry(value: string) {
  return countryLabels.has(locationKey(value));
}

function isAdministrativeCode(value: string) {
  return administrativeCodes.has(value.replace(/\./g, "").trim().toUpperCase());
}

function isAdministrativePart(value: string) {
  return isAdministrativeCode(value) || administrativeNames.has(locationKey(value));
}

function cleanLocationPart(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[,;|\s]+|[,;|\s]+$/g, "")
    .trim();
}

export function formatJobLocation(value: string | null | undefined) {
  const parts = (value ?? "")
    .replace(/\s+\/\s+/g, ",")
    .replace(/[;|\n]+/g, ",")
    .split(",")
    .map(cleanLocationPart)
    .filter(Boolean);

  if (parts.length === 0) return null;

  const uniqueParts: string[] = [];
  const seen = new Set<string>();

  for (const part of parts) {
    const key = locationKey(part);
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueParts.push(part);
  }

  if (uniqueParts.length === 1) return uniqueParts[0];

  const explicitCityBases = new Set(
    uniqueParts
      .map(locationKey)
      .filter((key) => key.endsWith(" city"))
      .map((key) => key.slice(0, -5).trim())
  );

  const result = uniqueParts.filter((part, index) => {
    const key = locationKey(part);

    if (isCountry(part)) return false;

    // "New York City, New York" is a city followed by its parent state.
    if (explicitCityBases.has(key)) return false;

    if (isAdministrativeCode(part) && index > 0) return false;
    if (!administrativeNames.has(key) || index === 0) return true;

    const previousPart = uniqueParts[index - 1];
    return !previousPart || isCountry(previousPart) || isAdministrativePart(previousPart);
  });

  return (result.length > 0 ? result : uniqueParts.slice(0, 1)).join(", ");
}

export function getWorkModeLabel(remoteType: string | null | undefined) {
  if (remoteType === "remote") return "Remote";
  if (remoteType === "hybrid") return "Hybrid";
  if (remoteType === "onsite") return "On-site";
  return "Work mode not listed";
}

export function getWorkModeTone(remoteType: string | null | undefined): "green" | "blue" | "amber" | "gray" {
  if (remoteType === "remote") return "green";
  if (remoteType === "hybrid") return "blue";
  if (remoteType === "onsite") return "gray";
  return "amber";
}

export function getJobLocationLabel(job: DisplayJob) {
  const location = formatJobLocation(job.location);

  if (location) {
    if (job.remote_type === "remote" && /^remote$/i.test(location)) return "Remote";
    return location;
  }

  if (job.remote_type === "remote") return "Remote";
  if (job.remote_type === "hybrid") return "Hybrid location not listed";
  if (job.remote_type === "onsite") return "Location not listed";

  return "Location not listed";
}
