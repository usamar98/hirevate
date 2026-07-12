"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ConsentChoice = "essential" | "optional";
const consentKey = "hirevate-cookie-consent-v1";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!window.localStorage.getItem(consentKey));
  }, []);

  function saveChoice(choice: ConsentChoice) {
    window.localStorage.setItem(consentKey, choice);
    document.cookie = `${consentKey}=${choice}; Max-Age=15552000; Path=/; SameSite=Lax; Secure`;
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
          Hirevate uses essential cookies for sign-in and security. Optional measurement cookies are not currently enabled and require permission if introduced.{" "}
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
