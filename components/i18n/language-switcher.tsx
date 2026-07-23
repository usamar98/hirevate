"use client";

import { useState } from "react";
import {
  languagePreferenceCookie,
  type SupportedLanguage
} from "@/lib/i18n/config";

type RegionalLanguage = Exclude<SupportedLanguage, "en">;

type LanguageSwitcherProps = {
  language: SupportedLanguage;
  regionalLanguage: RegionalLanguage | null;
};

const englishOption = { code: "en", label: "English", shortLabel: "EN" } as const;
const regionalOptions = {
  de: { code: "de", label: "Deutsch", shortLabel: "DE" },
  sv: { code: "sv", label: "Svenska", shortLabel: "SV" }
} as const satisfies Record<
  RegionalLanguage,
  { code: RegionalLanguage; label: string; shortLabel: string }
>;

const controlLabels: Record<SupportedLanguage, string> = {
  en: "Choose language",
  de: "Sprache auswählen",
  sv: "Välj språk"
};

export function LanguageSwitcher({ language, regionalLanguage }: LanguageSwitcherProps) {
  const [pendingLanguage, setPendingLanguage] = useState<SupportedLanguage | null>(null);

  if (!regionalLanguage) return null;

  const languageOptions = [englishOption, regionalOptions[regionalLanguage]];

  function selectLanguage(nextLanguage: SupportedLanguage) {
    if (nextLanguage === language || pendingLanguage) return;

    setPendingLanguage(nextLanguage);
    const secureSuffix = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${languagePreferenceCookie}=${nextLanguage}; Max-Age=31536000; Path=/; SameSite=Lax${secureSuffix}`;
    window.location.reload();
  }

  return (
    <div
      aria-label={controlLabels[language]}
      className="fixed left-3 top-20 z-50 inline-flex items-center rounded-full border border-gray-200 bg-white/95 p-1 shadow-lg backdrop-blur"
      role="group"
    >
      {languageOptions.map((option) => {
        const active = option.code === language;
        const pending = option.code === pendingLanguage;

        return (
          <button
            aria-pressed={active}
            className={`min-w-10 rounded-full px-2.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 ${
              active
                ? "bg-ink-900 text-white"
                : "text-ink-500 hover:bg-gray-100 hover:text-ink-900"
            }`}
            disabled={Boolean(pendingLanguage)}
            key={option.code}
            onClick={() => selectLanguage(option.code)}
            title={option.label}
            type="button"
          >
            {pending ? "…" : option.shortLabel}
          </button>
        );
      })}
    </div>
  );
}
