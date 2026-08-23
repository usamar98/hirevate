"use client";

import Link from "next/link";
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
          <Link className="transition hover:text-ink-900" href="/resume-builder">
            {copy.resume}
          </Link>
          <Link className="transition hover:text-ink-900" href="/account/job-tracker">
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
