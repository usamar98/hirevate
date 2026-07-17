"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AccountMenu } from "@/components/layout/account-menu";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";
import { AUTH_STATUS_CHANGED_EVENT } from "@/lib/auth/client-events";

type AuthStatus = {
  authenticated: boolean;
  isAdmin: boolean;
};

const anonymousStatus: AuthStatus = {
  authenticated: false,
  isAdmin: false
};

export function SiteHeader() {
  const pathname = usePathname();
  const [authStatus, setAuthStatus] = useState<AuthStatus>(anonymousStatus);

  const refreshAuthStatus = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/auth/status", {
        cache: "no-store",
        signal
      });
      const nextStatus = response.ok
        ? ((await response.json()) as AuthStatus)
        : anonymousStatus;

      setAuthStatus(nextStatus);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setAuthStatus(anonymousStatus);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const handleAuthChange = () => {
      void refreshAuthStatus();
    };

    void refreshAuthStatus(controller.signal);
    window.addEventListener(AUTH_STATUS_CHANGED_EVENT, handleAuthChange);

    return () => {
      controller.abort();
      window.removeEventListener(AUTH_STATUS_CHANGED_EVENT, handleAuthChange);
    };
  }, [pathname, refreshAuthStatus]);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/92 backdrop-blur">
      <div className="container-shell flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-700 md:flex">
          <Link className="transition hover:text-ink-900" href="/jobs#results">
            Find Jobs
          </Link>
          <Link className="transition hover:text-ink-900" href="/resume-builder">
            Resume
          </Link>
          <Link className="transition hover:text-ink-900" href="/about">
            About
          </Link>
          <Link className="transition hover:text-ink-900" href="/guides">
            Guides
          </Link>
          {authStatus.authenticated ? (
            <Link className="transition hover:text-ink-900" href="/dashboard">
              Dashboard
            </Link>
          ) : null}
          {authStatus.isAdmin ? (
            <>
              <Link className="transition hover:text-ink-900" href="/admin/users">
                Users
              </Link>
              <Link className="transition hover:text-ink-900" href="/admin/stripe">
                Stripe
              </Link>
              <Link className="transition hover:text-ink-900" href="/admin/jobs-sync">
                Admin
              </Link>
            </>
          ) : null}
        </nav>
        <div className="flex items-center gap-2">
          {!authStatus.authenticated ? (
            <Button asChild href="/login" variant="ghost">
              Log in
            </Button>
          ) : null}
          <Button
            asChild
            className="bg-black text-white hover:bg-gray-800 focus-visible:outline-black"
            href="/pricing"
            variant="secondary"
          >
            Pricing
          </Button>
          {authStatus.authenticated ? <AccountMenu /> : null}
        </div>
      </div>
    </header>
  );
}
