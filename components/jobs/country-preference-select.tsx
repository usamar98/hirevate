"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { jobCountryPreferenceCookie } from "@/lib/jobs/countries";

const preferenceMaxAge = 60 * 60 * 24 * 180;

function saveCountryPreference(slug: string) {
  const secureSuffix = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${jobCountryPreferenceCookie}=${slug}; Max-Age=${preferenceMaxAge}; Path=/; SameSite=Lax${secureSuffix}`;
}

export function CountryPreferenceSelect({
  className,
  defaultValue,
  children
}: {
  className: string;
  defaultValue: string;
  children: ReactNode;
}) {
  return (
    <select
      className={className}
      defaultValue={defaultValue}
      name="country"
      onChange={(event) => saveCountryPreference(event.currentTarget.value)}
    >
      {children}
    </select>
  );
}

export function CountryPreferenceLink({
  children,
  className,
  href,
  slug
}: {
  children: ReactNode;
  className: string;
  href: string;
  slug: string;
}) {
  return (
    <Link className={className} href={href} onClick={() => saveCountryPreference(slug)}>
      {children}
    </Link>
  );
}
