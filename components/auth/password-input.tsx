"use client";

import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const PasswordInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type">
>(({ className, disabled, ...props }, ref) => {
  const [visible, setVisible] = useState(false);
  const VisibilityIcon = visible ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input
        className={cn("pr-11", className)}
        disabled={disabled}
        ref={ref}
        type={visible ? "text" : "password"}
        {...props}
      />
      <button
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-md text-ink-500 transition hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
        type="button"
      >
        <VisibilityIcon aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";
