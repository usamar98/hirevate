import Link from "next/link";
import { LogOut } from "lucide-react";
import { getCurrentUser, getProfile } from "@/lib/auth/session";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/logo";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : null;
  const isAdmin = profile?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/92 backdrop-blur">
      <div className="container-shell flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-ink-700 md:flex">
          <Link className="transition hover:text-ink-900" href="/jobs">
            Jobs
          </Link>
          <Link className="transition hover:text-ink-900" href="/resume-builder">
            Resume Builder
          </Link>
          <Link className="transition hover:text-ink-900" href="/pricing">
            Pricing
          </Link>
          {user ? (
            <Link className="transition hover:text-ink-900" href="/dashboard">
              Dashboard
            </Link>
          ) : null}
          {isAdmin ? (
            <>
              <Link className="transition hover:text-ink-900" href="/admin/users">
                Users
              </Link>
              <Link className="transition hover:text-ink-900" href="/admin/jobs-sync">
                Admin
              </Link>
            </>
          ) : null}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <form action={signOutAction}>
              <Button aria-label="Sign out" size="icon" type="submit" variant="ghost">
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </Button>
            </form>
          ) : (
            <>
              <Button asChild href="/login" variant="ghost">
                Log in
              </Button>
              <Button asChild href="/signup" className="hidden sm:inline-flex">
                Start Free
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
