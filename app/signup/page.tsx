import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Start Free",
  robots: {
    index: false,
    follow: false
  }
};

export default function SignupPage() {
  return (
    <section className="bg-gray-50 py-14">
      <div className="container-shell max-w-md">
        <Card className="p-6">
          <h1 className="text-3xl font-semibold text-ink-900">Start Free</h1>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Browse fresh direct-apply roles and save your first five jobs.
          </p>
          <div className="mt-6">
            <Suspense>
              <AuthForm mode="signup" />
            </Suspense>
          </div>
          <p className="mt-5 text-center text-sm text-ink-500">
            Already have an account?{" "}
            <Link className="font-semibold text-brand-600" href="/login">
              Log in
            </Link>
          </p>
        </Card>
      </div>
    </section>
  );
}
