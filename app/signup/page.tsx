import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Create Account",
  robots: {
    index: false,
    follow: false
  }
};

type SignupPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSafeRedirect(value: string | string[] | undefined) {
  const redirect = Array.isArray(value) ? value[0] : value;
  return redirect?.startsWith("/") && !redirect.startsWith("//") ? redirect : "/pricing";
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = searchParams ? await searchParams : {};
  const redirect = getSafeRedirect(params.redirect);
  const loginHref = `/login?redirect=${encodeURIComponent(redirect)}`;
  return (
    <section className="bg-gray-50 py-14">
      <div className="container-shell max-w-md">
        <Card className="p-6">
          <h1 className="text-3xl font-semibold text-ink-900">Create account</h1>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Create a free account with no card required. Choose paid access only when you are ready.
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
