"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  cookieConsentEvent,
  cookieConsentKey,
  type CookieConsentChoice
} from "@/lib/analytics/consent";


export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!window.localStorage.getItem(cookieConsentKey));
  }, []);

  function saveChoice(choice: CookieConsentChoice) {
    const secureSuffix = window.location.protocol === "https:" ? "; Secure" : "";
    window.localStorage.setItem(cookieConsentKey, choice);
    document.cookie = `${cookieConsentKey}=${choice}; Max-Age=15552000; Path=/; SameSite=Lax${secureSuffix}`;
    window.dispatchEvent(new CustomEvent(cookieConsentEvent, { detail: choice }));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      aria-label="Cookie preferences"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-4 shadow-soft"
      role="region"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm leading-6 text-ink-600">
          Hirevate uses essential cookies for sign-in and security. With permission, optional
          measurement helps count daily visitors and page views.{" "}
          <Link className="font-semibold text-brand-700" href="/legal/cookie-policy">
            Cookie policy
          </Link>
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button onClick={() => saveChoice("essential")} size="sm" type="button" variant="outline">
            Essential only
          </Button>
          <Button onClick={() => saveChoice("optional")} size="sm" type="button">
            Allow optional
          </Button>
        </div>
      </div>
    </div>
  );
}
