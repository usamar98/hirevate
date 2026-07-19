import "server-only";

import { cookies, headers } from "next/headers";
import {
  isSupportedLanguage,
  languagePreferenceCookie,
  type SupportedLanguage
} from "@/lib/i18n/config";

type LanguagePreference = {
  language: SupportedLanguage;
  showGermanOption: boolean;
};

function isCrawler(userAgent: string) {
  return /bot|crawler|spider|slurp|google|bing|yandex|baidu|duckduck|facebookexternalhit/i.test(
    userAgent
  );
}

export async function resolveLanguagePreference(): Promise<LanguagePreference> {
  const headerStore = await headers();
  const countryCode = (
    headerStore.get("x-vercel-ip-country") ||
    headerStore.get("cf-ipcountry") ||
    headerStore.get("x-country-code") ||
    ""
  ).toUpperCase();
  const showGermanOption =
    countryCode === "DE" && !isCrawler(headerStore.get("user-agent") ?? "");

  if (!showGermanOption) {
    return { language: "en", showGermanOption: false };
  }

  const cookieStore = await cookies();
  const savedLanguage = cookieStore.get(languagePreferenceCookie)?.value?.toLowerCase();

  return {
    language: isSupportedLanguage(savedLanguage) ? savedLanguage : "de",
    showGermanOption: true
  };
}
