import type { Job } from "@/types/database";
import { configuredJobCountries, type JobCountry } from "@/lib/jobs/countries";

type DisplayJob = Pick<Job, "location" | "remote_type">;

const countryLabels = new Set([
  "argentina",
  "australia",
  "austria",
  "belgium",
  "brazil",
  "canada",
  "chile",
  "china",
  "colombia",
  "denmark",
  "egypt",
  "france",
  "germany",
  "india",
  "indonesia",
  "ireland",
  "italy",
  "japan",
  "malaysia",
  "mexico",
  "netherlands",
  "new zealand",
  "norway",
  "pakistan",
  "peru",
  "philippines",
  "poland",
  "portugal",
  "saudi arabia",
  "singapore",
  "south africa",
  "south korea",
  "spain",
  "sweden",
  "switzerland",
  "turkey",
  "uae",
  "u k",
  "uk",
  "united arab emirates",
  "united kingdom",
  "united states",
  "united states of america",
  "u s",
  "us",
  "usa",
  "vietnam"
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

function cleanLocationPart(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^[,;|\s]+|[,;|\s]+$/g, "")
    .trim();
}

function getLocationParts(value: string | null | undefined) {
  return (value ?? "")
    .replace(/\s+\/\s+/g, ",")
    .replace(/[;|\n]+/g, ",")
    .split(",")
    .map(cleanLocationPart)
    .filter(Boolean);
}

export function formatJobLocation(value: string | null | undefined) {
  const parts = getLocationParts(value);

  if (parts.length === 0) return null;

  const uniqueParts: string[] = [];
  const seen = new Set<string>();

  for (const part of parts) {
    const key = locationKey(part);
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueParts.push(part);
  }

  return uniqueParts.join(", ");
}

const countryAliasesByCode: Record<string, readonly string[]> = {
  AE: ["uae", "united arab emirates"],
  GB: ["uk", "u k", "united kingdom"],
  US: ["us", "u s", "usa", "united states", "united states of america"]
};

function partMatchesTerm(part: string, term: string) {
  const partKey = locationKey(part);
  const termKey = locationKey(term);
  return (
    partKey === termKey ||
    partKey.startsWith(`${termKey} `) ||
    partKey.endsWith(` ${termKey}`)
  );
}

function getCountryAliases(country: JobCountry) {
  return new Set(
    [country.name, country.code, ...(countryAliasesByCode[country.code] ?? [])].map(locationKey)
  );
}

function getCountryCardName(country: JobCountry) {
  if (country.code === "AE") return "UAE";
  if (country.code === "GB") return "UK";
  if (country.code === "US") return "US";
  return country.name;
}

function getCountryLocationLabel(value: string, country: JobCountry) {
  const parts = getLocationParts(value);
  const selectedIndexes = new Set<number>();
  const cityMatches: Array<{ index: number; label: string }> = [];

  parts.forEach((part, index) => {
    if (country.locationTerms.some((term) => partMatchesTerm(part, term))) {
      selectedIndexes.add(index);
    }

    const city = country.popularCities.find((term) => partMatchesTerm(part, term));
    if (city) cityMatches.push({ index, label: city });
  });

  if (selectedIndexes.size === 0) return null;

  const selectedAliases = getCountryAliases(country);
  const hasOtherCountry = parts.some((part, index) => {
    if (selectedIndexes.has(index)) return false;
    const key = locationKey(part);
    return isCountry(part) && !selectedAliases.has(key);
  });
  const hasOtherConfiguredCity = parts.some((part, index) => {
    if (selectedIndexes.has(index)) return false;
    return configuredJobCountries.some(
      (item) =>
        item.code !== country.code && item.popularCities.some((city) => partMatchesTerm(part, city))
    );
  });
  const distinctCityIndexes = new Set(cityMatches.map((match) => match.index));
  const isMultiLocation =
    hasOtherCountry || hasOtherConfiguredCity || distinctCityIndexes.size > 1;
  const city = cityMatches[0]?.label;
  const label = city ? `${city}, ${getCountryCardName(country)}` : getCountryCardName(country);

  return isMultiLocation ? `${label} (multi-location)` : label;
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

export function getJobLocationLabel(job: DisplayJob, country?: JobCountry | null) {
  if (country && job.location) {
    const countryLabel = getCountryLocationLabel(job.location, country);
    if (countryLabel) return countryLabel;
  }

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
