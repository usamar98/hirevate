"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { authSchema, type AuthFormValues } from "@/lib/validators/auth";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/dashboard";
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    formState: { errors },
    handleSubmit,
    register
  } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: ""
    }
  });

  async function onSubmit(values: AuthFormValues) {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const result =
        mode === "signup"
          ? await supabase.auth.signUp({
              email: values.email,
              password: values.password,
              options: {
                data: {
                  full_name: values.fullName
                }
              }
            })
          : await supabase.auth.signInWithPassword({
              email: values.email,
              password: values.password
            });

      if (result.error) {
        setMessage(result.error.message);
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
        <span className="text-sm font-semibold text-ink-700">Email</span>
        <Input autoComplete="email" placeholder="you@example.com" type="email" {...register("email")} />
        {errors.email ? <span className="text-sm text-red-600">{errors.email.message}</span> : null}
      </label>
      <label className="block space-y-1.5">
        <span className="text-sm font-semibold text-ink-700">Password</span>
        <Input
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          placeholder="At least 8 characters"
          type="password"
          {...register("password")}
        />
        {errors.password ? (
          <span className="text-sm text-red-600">{errors.password.message}</span>
        ) : null}
      </label>
      {message ? (
        <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
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
