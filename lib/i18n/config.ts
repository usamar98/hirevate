export const languagePreferenceCookie = "hirevate-language";

export const supportedLanguages = ["en", "de", "sv", "es"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export const languageLocales = {
  en: "en-US",
  de: "de-DE",
  sv: "sv-SE",
  es: "es-ES"
} as const satisfies Record<SupportedLanguage, string>;

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return supportedLanguages.includes(value as SupportedLanguage);
}
