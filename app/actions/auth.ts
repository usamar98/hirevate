"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

async function getRequestGeo() {
  const headerStore = await headers();
  const countryCode =
    headerStore.get("x-vercel-ip-country") ||
    headerStore.get("cf-ipcountry") ||
    headerStore.get("x-country-code");
  const countryName =
    headerStore.get("x-vercel-ip-country-name") ||
    headerStore.get("x-country-name") ||
    countryCode;

  return {
    countryCode: countryCode?.toUpperCase() ?? null,
    countryName: countryName || null
  };
}

async function updateProfilePresence(userId: string, geo: Awaited<ReturnType<typeof getRequestGeo>>) {
  const admin = createSupabaseAdminClient();
  if (!admin) return;

  const updates: {
    country_code?: string | null;
    country_name?: string | null;
    last_seen_at: string;
  } = {
    last_seen_at: new Date().toISOString()
  };

  if (geo.countryCode) {
    updates.country_code = geo.countryCode;
    updates.country_name = geo.countryName;
  }

  await admin
    .from("profiles")
    .update(updates)
    .eq("id", userId);
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (data.user) {
    await updateProfilePresence(data.user.id, await getRequestGeo());
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
  const geo = await getRequestGeo();
  const nextPath = getSafeNextPath(redirectTo);
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      data: {
        full_name: parsed.data.fullName,
        country_code: geo.countryCode,
        country_name: geo.countryName
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

  if (data.user) {
    await updateProfilePresence(data.user.id, geo);
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
