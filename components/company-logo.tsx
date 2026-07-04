"use client";
/* eslint-disable @next/next/no-img-element */
import { useMemo, useState } from "react";
import { Building2 } from "lucide-react";
import {
  getCompanyInitials,
  getCompanyLogoDomain,
  getCompanyLogoUrl
} from "@/lib/companies/logos";
import { cn } from "@/lib/utils";

const sizes = {
  md: "h-10 w-10",
  lg: "h-12 w-12"
};

export function CompanyLogo({
  className,
  companyName,
  size = "md",
  website
}: {
  className?: string;
  companyName: string;
  size?: keyof typeof sizes;
  website?: string | null;
}) {
  const domain = useMemo(
    () => getCompanyLogoDomain(companyName, website),
    [companyName, website]
  );
  const [hasImageError, setHasImageError] = useState(false);
  const initials = getCompanyInitials(companyName);
  const showImage = Boolean(domain && !hasImageError);

  return (
    <span
      aria-label={`${companyName} logo`}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white text-xs font-semibold text-ink-700 shadow-sm",
        sizes[size],
        className
      )}
      title={companyName}
    >
      {showImage && domain ? (
        <img
          alt=""
          className="h-full w-full object-contain p-1.5"
          decoding="async"
          loading="lazy"
          onError={() => setHasImageError(true)}
          referrerPolicy="no-referrer"
          src={getCompanyLogoUrl(domain)}
        />
      ) : initials ? (
        <span>{initials}</span>
      ) : (
        <Building2 className="h-4 w-4" aria-hidden="true" />
      )}
    </span>
  );
}
