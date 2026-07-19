"use client";

import { useState } from "react";
import {
  languagePreferenceCookie,
  type SupportedLanguage
} from "@/lib/i18n/config";

type LanguageSwitcherProps = {
  language: SupportedLanguage;
  showGermanOption: boolean;
};

const languageOptions = [
  { code: "en", label: "English", shortLabel: "EN" },
  { code: "de", label: "Deutsch", shortLabel: "DE" }
] as const;

export function LanguageSwitcher({ language, showGermanOption }: LanguageSwitcherProps) {
  const [pendingLanguage, setPendingLanguage] = useState<SupportedLanguage | null>(null);

  if (!showGermanOption) return null;

  function selectLanguage(nextLanguage: SupportedLanguage) {
    if (nextLanguage === language || pendingLanguage) return;

    setPendingLanguage(nextLanguage);
    const secureSuffix = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `${languagePreferenceCookie}=${nextLanguage}; Max-Age=31536000; Path=/; SameSite=Lax${secureSuffix}`;
    window.location.reload();
  }

  const controlLabel = language === "de" ? "Sprache auswählen" : "Choose language";

  return (
    <div
      aria-label={controlLabel}
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
