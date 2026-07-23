import "server-only";

import { cookies, headers } from "next/headers";
import {
  isSupportedLanguage,
  languagePreferenceCookie,
  type SupportedLanguage
} from "@/lib/i18n/config";

type RegionalLanguage = Exclude<SupportedLanguage, "en">;

type LanguagePreference = {
  language: SupportedLanguage;
  regionalLanguage: RegionalLanguage | null;
};

function isCrawler(userAgent: string) {
  return /bot|crawler|spider|slurp|google|bing|yandex|baidu|duckduck|facebookexternalhit/i.test(
    userAgent
  );
}

function getRegionalLanguage(countryCode: string): RegionalLanguage | null {
  if (countryCode === "DE") return "de";
  if (countryCode === "SE") return "sv";
  return null;
}

export async function resolveLanguagePreference(): Promise<LanguagePreference> {
  const headerStore = await headers();
  const countryCode = (
    headerStore.get("x-vercel-ip-country") ||
    headerStore.get("cf-ipcountry") ||
    headerStore.get("x-country-code") ||
    ""
  ).toUpperCase();
  const regionalLanguage = getRegionalLanguage(countryCode);
  const canChooseRegionalLanguage =
    regionalLanguage !== null && !isCrawler(headerStore.get("user-agent") ?? "");

  if (!canChooseRegionalLanguage || regionalLanguage === null) {
    return { language: "en", regionalLanguage: null };
  }

  const cookieStore = await cookies();
  const savedLanguage = cookieStore.get(languagePreferenceCookie)?.value?.toLowerCase();
  const canUseSavedLanguage =
    isSupportedLanguage(savedLanguage) &&
    (savedLanguage === "en" || savedLanguage === regionalLanguage);

  return {
    language: canUseSavedLanguage ? savedLanguage : regionalLanguage,
    regionalLanguage
  };
}
