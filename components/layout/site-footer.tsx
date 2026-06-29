import Link from "next/link";
import { Logo } from "@/components/layout/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="container-shell grid gap-8 py-10 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <Logo />
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-500">
            Direct-apply roles from official hiring sources. No LinkedIn scraping, no auto-apply,
            no noisy boards.
          </p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm font-medium text-ink-500">
          <Link href="/jobs" className="hover:text-ink-900">
            Jobs
          </Link>
          <Link href="/jobs/latest" className="hover:text-ink-900">
            Latest Jobs
          </Link>
          <Link href="/jobs/remote" className="hover:text-ink-900">
            Remote Jobs
          </Link>
          <Link href="/jobs/london" className="hover:text-ink-900">
            London Jobs
          </Link>
          <Link href="/jobs/engineering" className="hover:text-ink-900">
            Engineering Jobs
          </Link>
          <Link href="/jobs/software-engineer" className="hover:text-ink-900">
            Software Engineer Jobs
          </Link>
          <Link href="/jobs/product-manager" className="hover:text-ink-900">
            Product Manager Jobs
          </Link>
          <Link href="/jobs/data-analyst" className="hover:text-ink-900">
            Data Analyst Jobs
          </Link>
          <Link href="/resume-builder" className="hover:text-ink-900">
            Resume Builder
          </Link>
          <Link href="/cover-letter" className="hover:text-ink-900">
            Cover Letter
          </Link>
          <Link href="/about" className="hover:text-ink-900">
            About
          </Link>
          <Link href="/pricing" className="hover:text-ink-900">
            Pricing
          </Link>
          <Link href="/llms.txt" className="hover:text-ink-900">
            LLMs
          </Link>
          <Link href="/login" className="hover:text-ink-900">
            Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
