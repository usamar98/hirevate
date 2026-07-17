import "server-only";

import { cookies, headers } from "next/headers";
import {
  getJobCountryByCode,
  getJobCountryBySlug,
  jobCountryPreferenceCookie
} from "@/lib/jobs/countries";

type RawSearchParams = Record<string, string | string[] | undefined> | undefined;

function readParam(searchParams: RawSearchParams, key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] : value;
}

function isCrawler(userAgent: string) {
  return /bot|crawler|spider|slurp|google|bing|yandex|baidu|duckduck|facebookexternalhit/i.test(userAgent);
}

export async function resolveJobCountryPreference(searchParams: RawSearchParams) {
  const explicitCountry = readParam(searchParams, "country")?.toLowerCase();
  if (explicitCountry === "all") {
    return { country: null, slug: "all", source: "manual" as const };
  }

  const explicitMatch = getJobCountryBySlug(explicitCountry);
  if (explicitMatch) {
    return { country: explicitMatch, slug: explicitMatch.slug, source: "manual" as const };
  }

  const cookieStore = await cookies();
  const savedCountry = cookieStore.get(jobCountryPreferenceCookie)?.value?.toLowerCase();
  if (savedCountry === "all") {
    return { country: null, slug: "all", source: "saved" as const };
  }

  const savedMatch = getJobCountryBySlug(savedCountry);
  if (savedMatch) {
    return { country: savedMatch, slug: savedMatch.slug, source: "saved" as const };
  }

  const headerStore = await headers();
  if (isCrawler(headerStore.get("user-agent") ?? "")) {
    return { country: null, slug: "all", source: "default" as const };
  }

  const countryCode =
    headerStore.get("x-vercel-ip-country") ||
    headerStore.get("cf-ipcountry") ||
    headerStore.get("x-country-code");
  const detectedCountry = getJobCountryByCode(countryCode);

  return detectedCountry
    ? { country: detectedCountry, slug: detectedCountry.slug, source: "detected" as const }
    : { country: null, slug: "all", source: "default" as const };
}
