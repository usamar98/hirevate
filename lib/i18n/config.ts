export const languagePreferenceCookie = "hirevate-language";

export const supportedLanguages = ["en", "de", "sv"] as const;

export type SupportedLanguage = (typeof supportedLanguages)[number];

export function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return supportedLanguages.includes(value as SupportedLanguage);
}
