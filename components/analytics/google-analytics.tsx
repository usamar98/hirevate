"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import {
  cookieConsentEvent,
  cookieConsentKey,
  type CookieConsentChoice
} from "@/lib/analytics/consent";

const googleAnalyticsId = "G-5SHGLEP5RX";

export function GoogleAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    function applyConsent(choice: CookieConsentChoice | null) {
      setEnabled(choice === "optional");
    }

    applyConsent(window.localStorage.getItem(cookieConsentKey) as CookieConsentChoice | null);

    function handleConsent(event: Event) {
      applyConsent((event as CustomEvent<CookieConsentChoice>).detail);
    }

    window.addEventListener(cookieConsentEvent, handleConsent);
    return () => window.removeEventListener(cookieConsentEvent, handleConsent);
  }, []);

  if (!enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
        strategy="afterInteractive"
      />
      <Script id="google-tag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${googleAnalyticsId}');
        `}
      </Script>
    </>
  );
}
