import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-black text-white shadow-soft hover:bg-gray-800 focus-visible:outline-black",
  secondary:
    "bg-ink-900 text-white shadow-soft hover:bg-ink-700 focus-visible:outline-ink-900",
  outline:
    "border border-gray-200 bg-white text-ink-900 hover:border-gray-300 hover:bg-gray-50 focus-visible:outline-brand-600",
  ghost: "bg-transparent text-ink-700 hover:bg-gray-100 focus-visible:outline-brand-600",
  danger:
    "bg-red-600 text-white shadow-soft hover:bg-red-700 focus-visible:outline-red-600"
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-base",
  icon: "h-10 w-10 p-0"
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  children: ReactNode;
  className?: string;
  href?: string;
  rel?: string;
  size?: ButtonSize;
  target?: string;
  variant?: ButtonVariant;
};

export function Button({
  asChild,
  children,
  className,
  href = "#",
  rel,
  size = "md",
  target,
  variant = "primary",
  ...props
}: ButtonProps) {
  const classes = cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  );

  if (asChild) {
    return (
      <Link className={classes} href={href} rel={rel} target={target}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
