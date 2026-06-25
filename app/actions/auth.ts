"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  isSuperLoginIdentifier,
  isValidSuperLoginPassword,
  resolveLoginEmail
} from "@/lib/auth/super-login";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema, type AuthFormValues } from "@/lib/validators/auth";

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

async function findAuthUserByEmail(email: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return null;

    const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
    if (user) return user;
    if (data.users.length < 1000) return null;
  }

  return null;
}

async function ensureSuperLoginAccount(password: string): Promise<AuthResult> {
  if (!env.superLoginEmail || !env.superLoginUsername || !env.superLoginPassword) {
    return { ok: false, error: "Test login is not configured yet." };
  }

  if (!isValidSuperLoginPassword(password)) {
    return { ok: false, error: "Invalid login credentials." };
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { ok: false, error: "Supabase admin is not configured." };
  }

  const userMetadata = {
    full_name: "Super Test User",
    super_login_username: env.superLoginUsername
  };
  const existingUser = await findAuthUserByEmail(env.superLoginEmail);
  const userResult = existingUser
    ? await admin.auth.admin.updateUserById(existingUser.id, {
        email: env.superLoginEmail,
        password,
        email_confirm: true,
        user_metadata: userMetadata
      })
    : await admin.auth.admin.createUser({
        email: env.superLoginEmail,
        password,
        email_confirm: true,
        user_metadata: userMetadata
      });

  if (userResult.error) {
    return { ok: false, error: userResult.error.message };
  }

  const { error } = await admin.from("profiles").upsert(
    {
      id: userResult.data.user.id,
      email: env.superLoginEmail,
      full_name: "Super Test User",
      role: "admin",
      subscription_status: "active",
      stripe_customer_id: null,
      stripe_subscription_id: null,
      last_seen_at: new Date().toISOString()
    },
    { onConflict: "id" }
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function signInAction(values: AuthFormValues): Promise<AuthResult> {
  const parsed = signInSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email or username and password." };
  }

  if (isSuperLoginIdentifier(parsed.data.email)) {
    const ensured = await ensureSuperLoginAccount(parsed.data.password);
    if (!ensured.ok) return ensured;
  }

  const loginEmail = resolveLoginEmail(parsed.data.email);
  if (!loginEmail) {
    return { ok: false, error: "Enter a valid email address or username." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: loginEmail,
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
  const parsed = signUpSchema.safeParse(values);
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
