"use client";

import Link from "next/link";
import { ChevronDown, FilePenLine, WandSparkles } from "lucide-react";
import { useAuthStatus } from "@/components/auth/auth-status-provider";
import { AccountMenu } from "@/components/layout/account-menu";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { getSiteCopy } from "@/lib/i18n/content";
import type { SupportedLanguage } from "@/lib/i18n/config";

export function SiteHeader({ language }: { language: SupportedLanguage }) {
  const authStatus = useAuthStatus();
  const copy = getSiteCopy(language).navigation;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/92 backdrop-blur">
      <div className="container-shell flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-700 md:flex">
          <Link className="transition hover:text-ink-900" href="/jobs#results">
            {copy.findJobs}
          </Link>
          <div className="group relative">
            <button
              aria-haspopup="menu"
              className="inline-flex h-10 items-center gap-1.5 transition hover:text-ink-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-600"
              type="button"
            >
              {copy.resume}
              <ChevronDown
                aria-hidden="true"
                className="h-3.5 w-3.5 transition-transform group-hover:rotate-180 group-focus-within:rotate-180"
              />
            </button>
            <div className="pointer-events-none invisible absolute left-1/2 top-full z-50 w-80 -translate-x-1/2 pt-3 opacity-0 transition group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100">
              <div className="rounded-md border border-gray-200 bg-white p-2 shadow-xl" role="menu">
                <Link
                  className="flex items-start gap-3 rounded-md p-3 transition hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                  href="/resume-builder"
                  role="menuitem"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-blue-50 text-brand-700">
                    <WandSparkles aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-semibold text-ink-900">AI Resume From a Job</span>
                    <span className="mt-1 block text-xs font-normal leading-5 text-ink-500">
                      Tailor your saved draft to a job link or description.
                    </span>
                  </span>
                </Link>
                <Link
                  className="mt-1 flex items-start gap-3 rounded-md p-3 transition hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none"
                  href="/resume-builder/manual"
                  role="menuitem"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700">
                    <FilePenLine aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-semibold text-ink-900">Build Resume Manually</span>
                    <span className="mt-1 block text-xs font-normal leading-5 text-ink-500">
                      Write and organize every section yourself.
                    </span>
                  </span>
                </Link>
              </div>
            </div>
          </div>
          <Link className="transition hover:text-ink-900" href="/job-application-tracker">
            {copy.jobTracker}
          </Link>
          <Link className="transition hover:text-ink-900" href="/account/cover-letters">
            {copy.coverLetter}
          </Link>
          {authStatus.isAdmin ? (
            <>
              <Link className="transition hover:text-ink-900" href="/admin/users">
                {copy.users}
              </Link>
              <Link className="transition hover:text-ink-900" href="/admin/stripe">
                Stripe
              </Link>
              <Link className="transition hover:text-ink-900" href="/admin/jobs-sync">
                {copy.admin}
              </Link>
            </>
          ) : null}
        </nav>
        <div className="flex items-center gap-2">
          {!authStatus.authenticated ? (
            <Button asChild className="min-h-12" href="/login" variant="ghost">
              {copy.login}
            </Button>
          ) : null}
          <Button
            asChild
            className="min-h-12 bg-black text-white hover:bg-gray-800 focus-visible:outline-black"
            href="/pricing"
            variant="secondary"
          >
            {copy.pricing}
          </Button>
          {authStatus.authenticated ? <AccountMenu language={language} /> : null}
        </div>
      </div>
    </header>
  );
}
