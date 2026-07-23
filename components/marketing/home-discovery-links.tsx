import Link from "next/link";
import type { ReactNode } from "react";
import type { SupportedLanguage } from "@/lib/i18n/config";
import { jobCountries } from "@/lib/jobs/countries";

const linkCopy = {
  en: { countryLabel: "Browse by country:" },
  de: { countryLabel: "Nach Land durchsuchen:" },
  sv: { countryLabel: "Bläddra efter land:" }
} as const;

const linkClassName =
  "inline-flex min-h-9 items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-ink-800 shadow-sm transition hover:border-brand-200 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100";

function LinkRow({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:gap-3">
      <p className="shrink-0 pt-2 text-sm font-semibold text-ink-900">{label}</p>
      <div className="flex min-w-0 flex-wrap gap-2">{children}</div>
    </div>
  );
}

export function HomeDiscoveryLinks({ language }: { language: SupportedLanguage }) {
  const copy = linkCopy[language];

  return (
    <section
      aria-label={copy.countryLabel.replace(":", "")}
      className="border-b border-gray-100 bg-gray-50 py-6"
    >
      <div className="container-shell">
        <LinkRow label={copy.countryLabel}>
          {jobCountries.map((country) => (
            <Link className={linkClassName} href={country.path} key={country.code}>
              {country.name}
            </Link>
          ))}
        </LinkRow>
      </div>
    </section>
  );
}
