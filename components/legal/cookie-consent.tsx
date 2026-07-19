"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  cookieConsentEvent,
  cookieConsentKey,
  type CookieConsentChoice
} from "@/lib/analytics/consent";
import { getSiteCopy } from "@/lib/i18n/content";
import type { SupportedLanguage } from "@/lib/i18n/config";


export function CookieConsent({ language }: { language: SupportedLanguage }) {
  const [visible, setVisible] = useState(false);
  const copy = getSiteCopy(language).cookies;

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
      aria-label={copy.label}
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-4 shadow-soft"
      role="region"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <p className="text-sm leading-6 text-ink-600">
          {copy.message}{" "}
          <Link className="font-semibold text-brand-700" href="/legal/cookie-policy">
            {copy.policy}
          </Link>
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button onClick={() => saveChoice("essential")} size="sm" type="button" variant="outline">
            {copy.essential}
          </Button>
          <Button onClick={() => saveChoice("optional")} size="sm" type="button">
            {copy.optional}
          </Button>
        </div>
      </div>
    </div>
  );
}
