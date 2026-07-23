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

export const jobCountries = [
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
    locationTerms: ["Australia", "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Canberra"],
    popularCities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"]
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
    slug: "united-arab-emirates",
    code: "AE",
    name: "United Arab Emirates",
    demonym: "UAE",
    path: "/jobs/country/united-arab-emirates",
    locationTerms: ["United Arab Emirates", "UAE", "Dubai", "Abu Dhabi", "Sharjah"],
    popularCities: ["Dubai", "Abu Dhabi", "Sharjah"]
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
