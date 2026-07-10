"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { requestPasswordResetAction } from "@/app/actions/auth";
import {
  AuthStatusMessage,
  type AuthMessage
} from "@/components/auth/auth-status-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  passwordResetRequestSchema,
  type PasswordResetRequestValues
} from "@/lib/validators/auth";

export function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<AuthMessage | null>(
    searchParams.get("error") === "invalid-reset-link"
      ? {
          text: "That password reset link is invalid or has expired. Request a new one.",
          tone: "error"
        }
      : null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset
  } = useForm<PasswordResetRequestValues>({
    resolver: zodResolver(passwordResetRequestSchema),
    defaultValues: { email: "" }
  });

  async function onSubmit(values: PasswordResetRequestValues) {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await requestPasswordResetAction(values);
      if (!result.ok) {
        setMessage({ text: result.error, tone: "error" });
        return;
      }

      setMessage({
        text:
          result.message ??
          "If an account exists for that email, a password reset link is on its way.",
        tone: "success"
      });
      reset();
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Unable to request a password reset.",
        tone: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink-700">Email</span>
        <Input
          aria-invalid={Boolean(errors.email)}
          autoComplete="email"
          placeholder="you@example.com"
          type="email"
          {...register("email")}
        />
        {errors.email ? <span className="text-sm text-red-600">{errors.email.message}</span> : null}
      </label>
      <AuthStatusMessage message={message} />
      <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
        {isSubmitting ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
        Send reset link
      </Button>
    </form>
  );
}
