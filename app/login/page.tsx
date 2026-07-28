import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Log in",
  robots: {
    index: false,
    follow: false
  }
};

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSafeRedirect(value: string | string[] | undefined) {
  const redirect = Array.isArray(value) ? value[0] : value;
  return redirect?.startsWith("/") && !redirect.startsWith("//") ? redirect : "/dashboard";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const redirect = getSafeRedirect(params.redirect);
  const signupHref = `/signup?redirect=${encodeURIComponent(redirect)}`;
  return (
    <section className="bg-gray-50 py-14">
      <div className="container-shell max-w-md">
        <Card className="p-6">
          <h1 className="text-3xl font-semibold text-ink-900">Log in</h1>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Continue finding fresh roles from public hiring sources.
          </p>
          <div className="mt-6">
            <Suspense>
              <AuthForm mode="login" />
            </Suspense>
          </div>
          <p className="mt-5 text-center text-sm text-ink-500">
            Need an account?{" "}
            <Link className="font-semibold text-brand-600" href={signupHref}>
              Create account
            </Link>
          </p>
        </Card>
      </div>
    </section>
  );
}
