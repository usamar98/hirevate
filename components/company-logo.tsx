import { getCompanyInitials } from "@/lib/companies/logos";
import { cn } from "@/lib/utils";

const sizes = {
  md: "h-10 w-10",
  lg: "h-12 w-12"
};

export function CompanyLogo({
  className,
  companyName,
  size = "md"
}: {
  className?: string;
  companyName: string;
  size?: keyof typeof sizes;
  website?: string | null;
}) {
  const initials = getCompanyInitials(companyName);

  return (
    <span
      aria-label={`${companyName} logo`}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white text-xs font-semibold text-ink-700 shadow-sm",
        sizes[size],
        className
      )}
      role="img"
      title={companyName}
    >
      <span aria-hidden="true">{initials}</span>
    </span>
  );
}
