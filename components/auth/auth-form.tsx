"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { signInAction, signUpAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInSchema, signUpSchema, type AuthFormValues } from "@/lib/validators/auth";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") ?? "/dashboard";
  const redirectTo =
    redirectParam.startsWith("/") && !redirectParam.startsWith("//") ? redirectParam : "/dashboard";
  const passwordWasUpdated = mode === "login" && searchParams.get("password") === "updated";
  const [message, setMessage] = useState<string | null>(
    passwordWasUpdated ? "Your password was updated. Log in with your new password." : null
  );
  const [messageTone, setMessageTone] = useState<"error" | "success">(
    passwordWasUpdated ? "success" : "error"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    formState: { errors },
    handleSubmit,
    register
  } = useForm<AuthFormValues>({
    resolver: zodResolver(mode === "signup" ? signUpSchema : signInSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: ""
    }
  });

  async function onSubmit(values: AuthFormValues) {
    setIsSubmitting(true);
    setMessage(null);
    setMessageTone("error");

    try {
      const result =
        mode === "signup"
          ? await signUpAction(values, redirectTo)
          : await signInAction(values);

      if (!result.ok) {
        setMessage(result.error);
        return;
      }

      if (result.needsConfirmation) {
        setMessageTone("success");
        setMessage(result.message ?? "Check your email to confirm your account, then log in.");
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {mode === "signup" ? (
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-ink-700">Full name</span>
          <Input autoComplete="name" placeholder="Ada Lovelace" {...register("fullName")} />
          {errors.fullName ? (
            <span className="text-sm text-red-600">{errors.fullName.message}</span>
          ) : null}
        </label>
      ) : null}
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink-700">
          {mode === "signup" ? "Email" : "Email or username"}
        </span>
        <Input
          autoComplete={mode === "signup" ? "email" : "username"}
          placeholder={mode === "signup" ? "you@example.com" : "you@example.com or username"}
          type={mode === "signup" ? "email" : "text"}
          {...register("email")}
        />
        {errors.email ? <span className="text-sm text-red-600">{errors.email.message}</span> : null}
      </label>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3 text-sm font-semibold text-ink-700">
          <label htmlFor={`${mode}-password`}>Password</label>
          {mode === "login" ? (
            <Link
              className="font-semibold text-brand-600 hover:text-brand-700"
              href="/forgot-password"
            >
              Forgot password?
            </Link>
          ) : null}
        </div>
        <Input
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          id={`${mode}-password`}
          placeholder="At least 8 characters"
          type="password"
          {...register("password")}
        />
        {errors.password ? (
          <span className="text-sm text-red-600">{errors.password.message}</span>
        ) : null}
      </div>
      {message ? (
        <div
          className={
            messageTone === "success"
              ? "rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
              : "rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700"
          }
        >
          {message}
        </div>
      ) : null}
      <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {mode === "signup" ? "Create account" : "Log in"}
      </Button>
    </form>
  );
}
