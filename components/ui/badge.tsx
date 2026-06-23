import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "gray" | "blue" | "green" | "amber" | "red";

const tones: Record<BadgeTone, string> = {
  gray: "border-gray-200 bg-gray-50 text-ink-700",
  blue: "border-blue-100 bg-blue-50 text-blue-700",
  green: "border-emerald-100 bg-emerald-50 text-emerald-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  red: "border-red-100 bg-red-50 text-red-700"
};

export function Badge({
  children,
  className,
  tone = "gray"
}: {
  children: ReactNode;
  className?: string;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
