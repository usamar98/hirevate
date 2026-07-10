"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { updatePasswordAction } from "@/app/actions/auth";
import {
  AuthStatusMessage,
  type AuthMessage
} from "@/components/auth/auth-status-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { passwordUpdateSchema, type PasswordUpdateValues } from "@/lib/validators/auth";

export function ResetPasswordForm() {
  const [message, setMessage] = useState<AuthMessage | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const {
    formState: { errors },
    handleSubmit,
    register
  } = useForm<PasswordUpdateValues>({
    resolver: zodResolver(passwordUpdateSchema),
    defaultValues: { password: "", confirmPassword: "" }
  });

  async function onSubmit(values: PasswordUpdateValues) {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const result = await updatePasswordAction(values);
      if (!result.ok) {
        setMessage({ text: result.error, tone: "error" });
        return;
      }

      setIsComplete(true);
      setMessage({
        text:
          result.message ??
          "Your password has been updated. You can now log in with your new password.",
        tone: "success"
      });
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Unable to update your password.",
        tone: "error"
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isComplete) {
    return (
      <div className="space-y-4">
        <AuthStatusMessage message={message} />
        <Button asChild className="w-full" href="/login?password=updated" size="lg">
          Log in
        </Button>
      </div>
    );
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink-700">New password</span>
        <Input
          aria-invalid={Boolean(errors.password)}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          type="password"
          {...register("password")}
        />
        {errors.password ? (
          <span className="text-sm text-red-600">{errors.password.message}</span>
        ) : null}
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink-700">Confirm new password</span>
        <Input
          aria-invalid={Boolean(errors.confirmPassword)}
          autoComplete="new-password"
          placeholder="Enter the password again"
          type="password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <span className="text-sm text-red-600">{errors.confirmPassword.message}</span>
        ) : null}
      </label>
      <AuthStatusMessage message={message} />
      <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
        {isSubmitting ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
        Update password
      </Button>
    </form>
  );
}
