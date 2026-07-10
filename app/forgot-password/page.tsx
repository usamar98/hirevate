import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Reset password",
  robots: {
    index: false,
    follow: false
  }
};

export default function ForgotPasswordPage() {
  return (
    <section className="bg-gray-50 py-14">
      <div className="container-shell max-w-md">
        <Card className="p-6">
          <h1 className="text-3xl font-semibold text-ink-900">Reset your password</h1>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Enter the email linked to your account and we will send you a secure reset link.
          </p>
          <div className="mt-6">
            <Suspense>
              <ForgotPasswordForm />
            </Suspense>
          </div>
          <p className="mt-5 text-center text-sm text-ink-500">
            Remembered your password?{" "}
            <Link className="font-semibold text-brand-600" href="/login">
              Back to log in
            </Link>
          </p>
        </Card>
      </div>
    </section>
  );
}
