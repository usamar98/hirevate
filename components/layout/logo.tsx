import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-semibold text-ink-900">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ink-900 text-white shadow-soft">
        <BriefcaseBusiness className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <span>Hirevate</span>
    </Link>
  );
}
