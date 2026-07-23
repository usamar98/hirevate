import Link from "next/link";
import type { SupportedLanguage } from "@/lib/i18n/config";
import { jobCountries } from "@/lib/jobs/countries";

const linkCopy = {
  en: {
    popularLabel: "Popular searches:",
    countryLabel: "Browse by country:",
    careerLabel: "Career tools:",
    popular: [
      "Latest jobs",
      "Remote jobs",
      "London jobs",
      "Engineering jobs",
      "Software engineer jobs",
      "Product manager jobs",
      "Data analyst jobs",
      "Customer success jobs"
    ],
    career: ["Resume builder", "Cover letter builder", "Plans"]
  },
  de: {
    popularLabel: "Beliebte Suchen:",
    countryLabel: "Nach Land durchsuchen:",
    careerLabel: "Karriere-Tools:",
    popular: [
      "Neueste Jobs",
      "Remote-Jobs",
      "Jobs in London",
      "Engineering-Jobs",
      "Jobs für Softwareentwickler",
      "Jobs für Product Manager",
      "Jobs für Datenanalysten",
      "Customer-Success-Jobs"
    ],
    career: ["Lebenslauf-Builder", "Anschreiben-Builder", "Tarife"]
  },
  sv: {
    popularLabel: "Populära sökningar:",
    countryLabel: "Bläddra efter land:",
    careerLabel: "Karriärverktyg:",
    popular: [
      "Senaste jobben",
      "Distansjobb",
      "Jobb i London",
      "Ingenjörsjobb",
      "Jobb för mjukvaruutvecklare",
      "Jobb för produktchefer",
      "Jobb för dataanalytiker",
      "Jobb inom Customer Success"
    ],
    career: ["CV-byggare", "Byggare för personligt brev", "Planer"]
  }
} as const;

const popularSearches = [
  "/jobs/latest",
  "/jobs/remote",
  "/jobs/london",
  "/jobs/engineering",
  "/jobs/software-engineer",
  "/jobs/product-manager",
  "/jobs/data-analyst",
  "/jobs/customer-success"
] as const;

const careerTools = ["/resume-builder", "/cover-letter", "/pricing"] as const;

const linkClassName =
  "inline-flex min-h-9 items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-ink-800 shadow-sm transition hover:border-brand-200 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100";

function LinkRow({
  children,
  label
}: {
  children: React.ReactNode;
  label: string;
}) {
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
      aria-label={copy.popularLabel.replace(":", "")}
      className="border-b border-gray-100 bg-gray-50 py-6"
    >
      <div className="container-shell space-y-4">
        <LinkRow label={copy.popularLabel}>
          {popularSearches.map((href, index) => (
            <Link className={linkClassName} href={href} key={href}>
              {copy.popular[index]}
            </Link>
          ))}
        </LinkRow>

        <LinkRow label={copy.countryLabel}>
          {jobCountries.map((country) => (
            <Link className={linkClassName} href={country.path} key={country.code}>
              {country.name}
            </Link>
          ))}
        </LinkRow>

        <LinkRow label={copy.careerLabel}>
          {careerTools.map((href, index) => (
            <Link className={linkClassName} href={href} key={href}>
              {copy.career[index]}
            </Link>
          ))}
        </LinkRow>
      </div>
    </section>
  );
}
