"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookmarkCheck,
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileText,
  LogOut,
  UserCircle
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { signOutAction } from "@/app/actions/auth";

const accountMenuItems = [
  { href: "/account/subscription", label: "Subscription", icon: CreditCard },
  { href: "/account/saved-jobs", label: "Saved jobs", icon: BookmarkCheck },
  { href: "/account/job-tracker", label: "Job tracker", icon: ClipboardList },
  { href: "/account/cover-letters", label: "Cover letters", icon: FileText }
] as const;

export function AccountMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-controls="account-menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold text-ink-700 transition hover:bg-gray-100 hover:text-ink-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100"
        onClick={() => setOpen((current) => !current)}
        ref={triggerRef}
        type="button"
      >
        <UserCircle className="h-5 w-5" aria-hidden="true" />
        <span>Account</span>
        <ChevronDown
          className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div
          aria-label="Account menu"
          className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-lg border border-gray-200 bg-white p-2 shadow-xl"
          id="account-menu"
          role="menu"
        >
          {accountMenuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-700 hover:bg-gray-50 hover:text-ink-900"
                }`}
                href={item.href}
                key={item.href}
                onClick={() => setOpen(false)}
                role="menuitem"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}

          <div className="my-2 border-t border-gray-100" role="separator" />

          <form action={signOutAction}>
            <button
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100"
              role="menuitem"
              type="submit"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Log out
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
