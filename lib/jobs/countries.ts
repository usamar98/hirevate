export const jobCountryPreferenceCookie = "hirevate-job-country";

export type JobCountry = {
  slug: string;
  code: string;
  name: string;
  demonym: string;
  path: string;
  locationTerms: readonly string[];
  popularCities: readonly string[];
};

export type JobLocationCountry = {
  aliases: readonly string[];
  cityTerms: readonly string[];
  code: string;
  name: string;
};

export const configuredJobCountries = [
  {
    slug: "united-states",
    code: "US",
    name: "United States",
    demonym: "US",
    path: "/jobs/country/united-states",
    locationTerms: ["United States", "USA", "New York", "California", "San Francisco", "Los Angeles", "Seattle", "Austin", "Boston", "Chicago"],
    popularCities: ["New York", "San Francisco", "Los Angeles", "Seattle", "Austin"]
  },
  {
    slug: "united-kingdom",
    code: "GB",
    name: "United Kingdom",
    demonym: "UK",
    path: "/jobs/uk",
    locationTerms: ["United Kingdom", "England", "Scotland", "Wales", "Northern Ireland", "London", "Manchester", "Birmingham", "Edinburgh", "Glasgow", "Bristol", "Leeds", "Belfast", "Cardiff"],
    popularCities: ["London", "Manchester", "Birmingham", "Edinburgh", "Glasgow"]
  },
  {
    slug: "canada",
    code: "CA",
    name: "Canada",
    demonym: "Canadian",
    path: "/jobs/country/canada",
    locationTerms: ["Canada", "Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Edmonton"],
    popularCities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"]
  },
  {
    slug: "australia",
    code: "AU",
    name: "Australia",
    demonym: "Australian",
    path: "/jobs/country/australia",
    locationTerms: [
      "Australia",
      "Sydney",
      "Melbourne",
      "Brisbane",
      "Perth",
      "Adelaide",
      "Canberra",
      "Gold Coast",
      "Newcastle",
      "Wollongong",
      "Hobart",
      "Darwin",
      "Geelong",
      "New South Wales",
      "Queensland",
      "Western Australia",
      "South Australia",
      "Tasmania",
      "Northern Territory",
      "Australian Capital Territory"
    ],
    popularCities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra"]
  },
  {
    slug: "germany",
    code: "DE",
    name: "Germany",
    demonym: "German",
    path: "/jobs/country/germany",
    locationTerms: ["Germany", "Deutschland", "Berlin", "Munich", "München", "Hamburg", "Frankfurt", "Cologne"],
    popularCities: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"]
  },
  {
    slug: "sweden",
    code: "SE",
    name: "Sweden",
    demonym: "Swedish",
    path: "/jobs/country/sweden",
    locationTerms: ["Sweden", "Sverige", "Stockholm", "Gothenburg", "Göteborg", "Malmö", "Uppsala", "Lund"],
    popularCities: ["Stockholm", "Gothenburg", "Malmö", "Uppsala", "Lund"]
  },
  {
    slug: "france",
    code: "FR",
    name: "France",
    demonym: "French",
    path: "/jobs/country/france",
    locationTerms: ["France", "Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Lille"],
    popularCities: ["Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux"]
  },
  {
    slug: "netherlands",
    code: "NL",
    name: "Netherlands",
    demonym: "Dutch",
    path: "/jobs/country/netherlands",
    locationTerms: ["Netherlands", "Nederland", "Amsterdam", "Rotterdam", "Utrecht", "Eindhoven", "The Hague"],
    popularCities: ["Amsterdam", "Rotterdam", "Utrecht", "Eindhoven", "The Hague"]
  },
  {
    slug: "ireland",
    code: "IE",
    name: "Ireland",
    demonym: "Irish",
    path: "/jobs/country/ireland",
    locationTerms: ["Ireland", "Dublin", "Cork", "Galway", "Limerick"],
    popularCities: ["Dublin", "Cork", "Galway", "Limerick"]
  },
  {
    slug: "india",
    code: "IN",
    name: "India",
    demonym: "Indian",
    path: "/jobs/country/india",
    locationTerms: ["India", "Bengaluru", "Bangalore", "Mumbai", "Delhi", "New Delhi", "Hyderabad", "Pune", "Chennai", "Gurugram", "Gurgaon", "Noida"],
    popularCities: ["Bengaluru", "Mumbai", "Delhi", "Hyderabad", "Pune"]
  },
  {
    slug: "pakistan",
    code: "PK",
    name: "Pakistan",
    demonym: "Pakistani",
    path: "/jobs/country/pakistan",
    locationTerms: ["Pakistan", "Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad"],
    popularCities: ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad"]
  },
  {
    slug: "uae",
    code: "AE",
    name: "United Arab Emirates",
    demonym: "UAE",
    path: "/jobs/country/uae",
    locationTerms: [
      "United Arab Emirates",
      "UAE",
      "Dubai",
      "Abu Dhabi",
      "Sharjah",
      "Ajman",
      "Ras Al Khaimah",
      "Fujairah",
      "Al Ain"
    ],
    popularCities: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Al Ain"]
  },
  {
    slug: "singapore",
    code: "SG",
    name: "Singapore",
    demonym: "Singapore",
    path: "/jobs/country/singapore",
    locationTerms: ["Singapore"],
    popularCities: ["Singapore"]
  }
] as const satisfies readonly JobCountry[];

const additionalLocationCountries: readonly JobLocationCountry[] = [
  { code: "AR", name: "Argentina", aliases: ["Argentina"], cityTerms: [] },
  { code: "AT", name: "Austria", aliases: ["Austria"], cityTerms: [] },
  { code: "BE", name: "Belgium", aliases: ["Belgium"], cityTerms: [] },
  { code: "BR", name: "Brazil", aliases: ["Brazil"], cityTerms: [] },
  { code: "CL", name: "Chile", aliases: ["Chile"], cityTerms: [] },
  { code: "CN", name: "China", aliases: ["China"], cityTerms: [] },
  { code: "CO", name: "Colombia", aliases: ["Colombia"], cityTerms: [] },
  { code: "CZ", name: "Czechia", aliases: ["Czechia", "Czech Republic"], cityTerms: [] },
  { code: "DK", name: "Denmark", aliases: ["Denmark"], cityTerms: [] },
  { code: "EG", name: "Egypt", aliases: ["Egypt"], cityTerms: [] },
  { code: "FI", name: "Finland", aliases: ["Finland"], cityTerms: [] },
  { code: "GR", name: "Greece", aliases: ["Greece"], cityTerms: [] },
  { code: "HK", name: "Hong Kong", aliases: ["Hong Kong"], cityTerms: [] },
  { code: "ID", name: "Indonesia", aliases: ["Indonesia"], cityTerms: [] },
  { code: "IL", name: "Israel", aliases: ["Israel"], cityTerms: [] },
  { code: "IT", name: "Italy", aliases: ["Italy"], cityTerms: [] },
  { code: "JP", name: "Japan", aliases: ["Japan"], cityTerms: [] },
  { code: "KW", name: "Kuwait", aliases: ["Kuwait"], cityTerms: [] },
  { code: "MY", name: "Malaysia", aliases: ["Malaysia"], cityTerms: [] },
  { code: "MX", name: "Mexico", aliases: ["Mexico"], cityTerms: [] },
  { code: "NZ", name: "New Zealand", aliases: ["New Zealand"], cityTerms: [] },
  { code: "NO", name: "Norway", aliases: ["Norway"], cityTerms: [] },
  { code: "PE", name: "Peru", aliases: ["Peru"], cityTerms: [] },
  { code: "PH", name: "Philippines", aliases: ["Philippines"], cityTerms: [] },
  { code: "PL", name: "Poland", aliases: ["Poland"], cityTerms: [] },
  { code: "PT", name: "Portugal", aliases: ["Portugal"], cityTerms: [] },
  { code: "QA", name: "Qatar", aliases: ["Qatar"], cityTerms: [] },
  { code: "SA", name: "Saudi Arabia", aliases: ["Saudi Arabia"], cityTerms: [] },
  { code: "ZA", name: "South Africa", aliases: ["South Africa"], cityTerms: [] },
  { code: "KR", name: "South Korea", aliases: ["South Korea"], cityTerms: [] },
  { code: "ES", name: "Spain", aliases: ["Spain"], cityTerms: [] },
  { code: "CH", name: "Switzerland", aliases: ["Switzerland"], cityTerms: [] },
  { code: "TW", name: "Taiwan", aliases: ["Taiwan"], cityTerms: [] },
  { code: "TH", name: "Thailand", aliases: ["Thailand"], cityTerms: [] },
  { code: "TR", name: "Turkey", aliases: ["Turkey", "Turkiye"], cityTerms: [] },
  { code: "VN", name: "Vietnam", aliases: ["Vietnam"], cityTerms: [] }
];

const configuredCountryAliases: Record<string, readonly string[]> = {
  AE: ["United Arab Emirates", "UAE"],
  AU: ["Australia", "AU"],
  GB: ["United Kingdom", "UK", "Great Britain"],
  US: ["United States", "United States of America", "USA", "US"]
};

const structuredLocationCountries: readonly JobLocationCountry[] = [
  ...configuredJobCountries.map((country) => ({
    aliases: configuredCountryAliases[country.code] ?? [country.name],
    cityTerms: country.popularCities,
    code: country.code,
    name: country.name
  })),
  ...additionalLocationCountries
];

function normalizeLocationText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function containsLocationTerm(value: string, term: string) {
  const haystack = normalizeLocationText(value);
  const needle = normalizeLocationText(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${needle}([^a-z0-9]|$)`).test(haystack);
}

export function getJobLocationCountries(value: string | null | undefined) {
  if (!value) return [];

  return structuredLocationCountries.filter((country) => {
    const configuredCountry = configuredJobCountries.find((item) => item.code === country.code);
    const terms = configuredCountry
      ? [...country.aliases, ...configuredCountry.locationTerms]
      : country.aliases;
    return terms.some((term) => containsLocationTerm(value, term));
  });
}

export function getJobLocationLocalities(
  value: string | null | undefined,
  country: JobLocationCountry,
  countryCount: number
) {
  if (!value) return [];

  const cities = country.cityTerms.filter((term) => containsLocationTerm(value, term));
  if (cities.length > 0) return cities;
  if (countryCount > 1) return [];

  const fallback = value
    .replace(/\s+\/\s+/g, ",")
    .split(/[,;|\n]+/)
    .map((part) => part.trim())
    .find(
      (part) =>
        part &&
        !structuredLocationCountries.some((item) =>
          item.aliases.some((alias) => containsLocationTerm(part, alias))
        ) &&
        !/^(remote|hybrid|onsite|on-site)$/i.test(part)
    );

  return fallback ? [fallback] : [];
}

const dailyCoverageCountryCodes = new Set(["US", "GB", "CA", "AU", "AE"]);

// Only advertise markets that the current source mix refreshes reliably every day.
// Other countries can be re-enabled after they have dependable daily source coverage.
export const jobCountries = configuredJobCountries.filter((country) =>
  dailyCoverageCountryCodes.has(country.code)
);

export function getJobCountryBySlug(slug: string | null | undefined) {
  if (!slug) return null;
  return jobCountries.find((country) => country.slug === slug.toLowerCase()) ?? null;
}

export function getJobCountryByCode(code: string | null | undefined) {
  if (!code) return null;
  return jobCountries.find((country) => country.code === code.toUpperCase()) ?? null;
}

export function getCountryLocationFilter(country: JobCountry) {
  return country.locationTerms.map((term) => `location.ilike.%${term}%`).join(",");
}
