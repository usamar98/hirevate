import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { getSiteCopy } from "@/lib/i18n/content";
import type { SupportedLanguage } from "@/lib/i18n/config";
import { legalFooterLinks } from "@/lib/legal";

export function SiteFooter({ language }: { language: SupportedLanguage }) {
  const copy = getSiteCopy(language).footer;
  const productLinks = [
    { href: "/jobs#results", label: copy.links.findJobs },
    { href: "/jobs/latest", label: copy.links.latestJobs },
    { href: "/jobs/remote", label: copy.links.remoteJobs },
    { href: "/jobs/uk", label: copy.links.ukJobs },
    { href: "/jobs/engineering", label: copy.links.engineeringJobs },
    { href: "/resume-builder", label: copy.links.resume },
    { href: "/cover-letter", label: copy.links.coverLetter },
    { href: "/pricing", label: copy.links.pricing },
    { href: "/guides", label: copy.links.guides },
    { href: "/about", label: copy.links.about },
    { href: "/login", label: copy.links.login }
  ];
  const translatedLegalLabels: Record<string, string> =
    language === "de"
      ? {
          Privacy: "Datenschutz",
          Terms: "Nutzungsbedingungen",
          Subscriptions: "Abonnements",
          "EU refunds": "EU-Rückerstattungen",
          Cookies: "Cookies",
          "Collection notice": "Hinweis zur Datenerhebung",
          "Job sources": "Jobquellen",
          Copyright: "Urheberrecht",
          "Resume matching": "Lebenslaufabgleich",
          Accessibility: "Barrierefreiheit",
          "Legal notice": "Rechtlicher Hinweis"
        }
      : {};

  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="container-shell grid gap-8 py-10 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <Logo />
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-500">
            {copy.description}
          </p>
        </div>
        <nav aria-label={copy.productLinksLabel} className="flex max-w-2xl flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-ink-500">
          {productLinks.map((item) => (
            <Link className="hover:text-ink-900" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-gray-100">
        <div className="container-shell flex flex-col gap-3 py-5 text-xs text-ink-400 md:flex-row md:items-center md:justify-between">
          <p>&copy; 2026 Hirevate</p>
          <nav aria-label={copy.legalLinksLabel} className="flex flex-wrap gap-x-4 gap-y-2">
            <Link className="hover:text-ink-700" href="/legal">
              {copy.legal}
            </Link>
            {legalFooterLinks.map((item) => (
              <Link className="hover:text-ink-700" href={item.href} key={item.href}>
                {translatedLegalLabels[item.label] ?? item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
