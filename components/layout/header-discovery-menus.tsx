"use client";

import Link from "next/link";
import { ChevronDown, Globe2, Menu, Search, TrendingUp, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getLandingCopy, getSiteCopy } from "@/lib/i18n/content";
import type { SupportedLanguage } from "@/lib/i18n/config";
import { jobCountries } from "@/lib/jobs/countries";

const popularSearchHrefs = [
  "/jobs/latest",
  "/jobs/remote",
  "/jobs/software-engineer",
  "/jobs/product-manager",
  "/jobs/data-analyst",
  "/jobs/customer-success"
] as const;

const menuCopy = {
  en: {
    popular: "Popular searches",
    countries: "Countries",
    browse: "Browse jobs",
    popularDescription: "Start with the roles job seekers visit most.",
    countriesDescription: "Explore jobs connected to a specific country.",
    allJobs: "View all jobs"
  },
  de: {
    popular: "Beliebte Suchen",
    countries: "Länder",
    browse: "Jobs durchsuchen",
    popularDescription: "Beginnen Sie mit den am häufigsten besuchten Stellenbereichen.",
    countriesDescription: "Entdecken Sie Stellen in einem bestimmten Land.",
    allJobs: "Alle Jobs ansehen"
  },
  sv: {
    popular: "Populära sökningar",
    countries: "Länder",
    browse: "Utforska jobb",
    popularDescription: "Börja med de jobbområden som besöks mest.",
    countriesDescription: "Utforska jobb som är kopplade till ett visst land.",
    allJobs: "Visa alla jobb"
  }
} as const;

function useMenuContent(language: SupportedLanguage) {
  const landingCopy = getLandingCopy(language);
  const siteCopy = getSiteCopy(language);

  return {
    labels: menuCopy[language],
    findJobsLabel: siteCopy.navigation.findJobs,
    popularSearches: popularSearchHrefs.map((href, index) => ({
      href,
      label: landingCopy.discoveryLinks[index].label,
      description: landingCopy.discoveryLinks[index].description
    }))
  };
}

function closeParentDetails(event: React.MouseEvent<HTMLAnchorElement>) {
  event.currentTarget.closest("details")?.removeAttribute("open");
}

export function DesktopDiscoveryMenus({ language }: { language: SupportedLanguage }) {
  const { labels, popularSearches } = useMenuContent(language);

  return (
    <>
      <details className="group relative">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 py-5 transition hover:text-ink-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 [&::-webkit-details-marker]:hidden">
          {labels.popular}
          <ChevronDown
            aria-hidden="true"
            className="h-3.5 w-3.5 transition group-open:rotate-180"
          />
        </summary>
        <div className="absolute left-1/2 top-full z-50 mt-1 w-80 -translate-x-1/2 rounded-xl border border-gray-200 bg-white p-2 shadow-2xl">
          <div className="flex items-start gap-3 px-3 pb-3 pt-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">{labels.popular}</p>
              <p className="mt-1 text-xs leading-5 text-ink-500">{labels.popularDescription}</p>
            </div>
          </div>
          <div className="grid gap-1">
            {popularSearches.map((item) => (
              <Link
                className="rounded-lg px-3 py-2.5 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                href={item.href}
                key={item.href}
                onClick={closeParentDetails}
              >
                <span className="block text-sm font-semibold text-ink-900">{item.label}</span>
                <span className="mt-0.5 block line-clamp-1 text-xs text-ink-500">
                  {item.description}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </details>

      <details className="group relative">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 py-5 transition hover:text-ink-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 [&::-webkit-details-marker]:hidden">
          {labels.countries}
          <ChevronDown
            aria-hidden="true"
            className="h-3.5 w-3.5 transition group-open:rotate-180"
          />
        </summary>
        <div className="absolute right-0 top-full z-50 mt-1 w-[34rem] rounded-xl border border-gray-200 bg-white p-3 shadow-2xl">
          <div className="flex items-start gap-3 px-2 pb-3 pt-1">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Globe2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">{labels.countries}</p>
              <p className="mt-1 text-xs leading-5 text-ink-500">{labels.countriesDescription}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {jobCountries.map((country) => (
              <Link
                className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-gray-50 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
                href={country.path}
                key={country.code}
                onClick={closeParentDetails}
              >
                {country.name}
              </Link>
            ))}
          </div>
          <Link
            className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2.5 text-sm font-semibold text-brand-700 transition hover:border-brand-200 hover:bg-brand-50"
            href="/jobs?country=all"
            onClick={closeParentDetails}
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            {labels.allJobs}
          </Link>
        </div>
      </details>
    </>
  );
}

export function MobileDiscoveryMenu({ language }: { language: SupportedLanguage }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { findJobsLabel, labels, popularSearches } = useMenuContent(language);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="md:hidden" ref={menuRef}>
      <button
        aria-controls="mobile-discovery-menu"
        aria-expanded={open}
        aria-label={labels.browse}
        className="inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
      </button>

      {open ? (
        <div
          className="fixed inset-x-3 top-20 z-50 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-xl border border-gray-200 bg-white p-4 shadow-2xl"
          id="mobile-discovery-menu"
        >
          <Link
            className="flex items-center gap-2 rounded-lg bg-ink-900 px-4 py-3 text-sm font-semibold text-white"
            href="/jobs#results"
            onClick={() => setOpen(false)}
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            {findJobsLabel}
          </Link>

          <section aria-labelledby="mobile-popular-searches" className="mt-5">
            <h2
              className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500"
              id="mobile-popular-searches"
            >
              {labels.popular}
            </h2>
            <div className="mt-2 grid gap-1 sm:grid-cols-2">
              {popularSearches.map((item) => (
                <Link
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-gray-50"
                  href={item.href}
                  key={item.href}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </section>

          <section aria-labelledby="mobile-country-searches" className="mt-5 border-t border-gray-100 pt-5">
            <h2
              className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500"
              id="mobile-country-searches"
            >
              {labels.countries}
            </h2>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {jobCountries.map((country) => (
                <Link
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-gray-50"
                  href={country.path}
                  key={country.code}
                  onClick={() => setOpen(false)}
                >
                  {country.name}
                </Link>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
