import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { legalFooterLinks } from "@/lib/legal";

const productLinks = [
  { href: "/jobs#results", label: "Find Jobs" },
  { href: "/jobs/latest", label: "Latest Jobs" },
  { href: "/jobs/remote", label: "Remote Jobs" },
  { href: "/jobs/uk", label: "UK Jobs" },
  { href: "/jobs/engineering", label: "Engineering Jobs" },
  { href: "/resume-builder", label: "Resume" },
  { href: "/cover-letter", label: "Cover Letter" },
  { href: "/pricing", label: "Pricing" },
  { href: "/guides", label: "Guides" },
  { href: "/about", label: "About" },
  { href: "/login", label: "Login" }
];

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="container-shell grid gap-8 py-10 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <Logo />
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-500">
            Roles from company career pages, public ATS boards, and trusted hiring sources. No LinkedIn
            scraping, no auto-apply, no noisy boards.
          </p>
        </div>
        <nav aria-label="Product links" className="flex max-w-2xl flex-wrap gap-x-5 gap-y-3 text-sm font-medium text-ink-500">
          {productLinks.map((item) => (
            <Link className="hover:text-ink-900" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-gray-100">
        <div className="container-shell flex flex-col gap-3 py-5 text-xs text-ink-400 md:flex-row md:items-center md:justify-between">
          <p>&copy; 2026 Hirevate</p>
          <nav aria-label="Legal links" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link className="hover:text-ink-700" href="/legal">
              Legal
            </Link>
            {legalFooterLinks.map((item) => (
              <Link className="hover:text-ink-700" href={item.href} key={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
