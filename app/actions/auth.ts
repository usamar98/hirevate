"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { authSchema, type AuthFormValues } from "@/lib/validators/auth";

type AuthResult =
  | { ok: true; needsConfirmation?: boolean; message?: string }
  | { ok: false; error: string };

function getSafeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

async function getRequestOrigin() {
  const headerStore = await headers();
  return headerStore.get("origin") ?? env.appUrl;
}

export async function signInAction(values: AuthFormValues): Promise<AuthResult> {
  const parsed = authSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email and password." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function signUpAction(
  values: AuthFormValues,
  redirectTo: string
): Promise<AuthResult> {
  const parsed = authSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid name, email, and password." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const origin = await getRequestOrigin();
  const nextPath = getSafeNextPath(redirectTo);
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      data: {
        full_name: parsed.data.fullName
      }
    }
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data.session) {
    return {
      ok: true,
      needsConfirmation: true,
      message: "Check your email to confirm your account, then log in."
    };
  }

  return { ok: true };
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/");
}
