import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: {
    index: false,
    follow: false
  }
};

export default function ResetPasswordPage() {
  return (
    <section className="bg-gray-50 py-14">
      <div className="container-shell max-w-md">
        <Card className="p-6">
          <h1 className="text-3xl font-semibold text-ink-900">Choose a new password</h1>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Use at least eight characters and choose a password you do not use elsewhere.
          </p>
          <div className="mt-6">
            <ResetPasswordForm />
          </div>
          <p className="mt-5 text-center text-sm text-ink-500">
            Need a new reset link?{" "}
            <Link className="font-semibold text-brand-600" href="/forgot-password">
              Request another
            </Link>
          </p>
        </Card>
      </div>
    </section>
  );
}
