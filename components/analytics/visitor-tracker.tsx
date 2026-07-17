"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  cookieConsentEvent,
  cookieConsentKey,
  type CookieConsentChoice
} from "@/lib/analytics/consent";

const excludedPathPrefixes = ["/admin", "/adminhirevate01", "/api", "/auth"];

function isTrackablePath(pathname: string) {
  return !excludedPathPrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isTrackablePath(pathname)) return;

    let tracked = false;

    function trackVisit(choice: CookieConsentChoice | null) {
      if (choice !== "optional" || tracked) return;
      tracked = true;

      void fetch("/api/analytics/visit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: pathname }),
        credentials: "same-origin",
        keepalive: true
      }).catch(() => undefined);
    }

    trackVisit(window.localStorage.getItem(cookieConsentKey) as CookieConsentChoice | null);

    function handleConsent(event: Event) {
      const choice = (event as CustomEvent<CookieConsentChoice>).detail;
      trackVisit(choice);
    }

    window.addEventListener(cookieConsentEvent, handleConsent);
    return () => window.removeEventListener(cookieConsentEvent, handleConsent);
  }, [pathname]);

  return null;
}