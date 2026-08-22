import type { Metadata } from "next";
import Link from "next/link";
import { redirect as redirectTo } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Card } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { trialCheckoutPath } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Create Account",
  robots: {
    index: false,
    follow: false
  }
};

type SignupSearchParams = Record<string, string | string[] | undefined>;

type SignupPageProps = {
  searchParams?: Promise<SignupSearchParams>;
};

function getSafeRedirect(value: string | string[] | undefined) {
  const redirect = Array.isArray(value) ? value[0] : value;
  if (!redirect?.startsWith("/") || redirect.startsWith("//")) return "/jobs";

  const pathname = redirect.split(/[?#]/, 1)[0];
  const authPaths = ["/signup", "/login", "/forgot-password", "/reset-password", "/auth"];
  return authPaths.some((path) => pathname === path || pathname?.startsWith(`${path}/`))
    ? "/jobs"
    : redirect;
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const [params, user] = await Promise.all([
    searchParams ?? Promise.resolve<SignupSearchParams>({}),
    getCurrentUser()
  ]);
  const redirect = getSafeRedirect(params.redirect);
  const startsTrial = redirect === trialCheckoutPath;

  if (user) {
    redirectTo(redirect);
  }

  const loginHref = `/login?redirect=${encodeURIComponent(redirect)}`;
  return (
    <section className="bg-gray-50 py-14">
      <div className="container-shell max-w-md">
        <Card className="p-6">
          <h1 className="text-3xl font-semibold text-ink-900">Create account</h1>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            {startsTrial
              ? "Create your account, then enter payment details securely in Stripe. Your card is not charged until the 3-day trial ends."
              : "Create your Hirevate account to save your progress and continue your job search."}
          </p>
          <div className="mt-6">
            <Suspense>
              <AuthForm mode="signup" />
            </Suspense>
          </div>
          <p className="mt-5 text-center text-sm text-ink-500">
            Already have an account?{" "}
            <Link className="font-semibold text-brand-600" href={loginHref}>
              Log in
            </Link>
          </p>
        </Card>
      </div>
    </section>
  );
}
