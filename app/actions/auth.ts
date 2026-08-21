"use server";

import type Stripe from "stripe";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  isSuperLoginIdentifier,
  isValidSuperLoginPassword,
  resolveLoginEmail
} from "@/lib/auth/super-login";
import { ensureUserProfile } from "@/lib/auth/ensure-profile";
import { isAdminProfile } from "@/lib/auth/session";
import { triggerWelcomeAutomationSafely } from "@/lib/email/welcome";
import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  accountPasswordSchema,
  accountProfileSchema,
  deactivateAccountSchema,
  deleteAccountSchema,
  passwordResetRequestSchema,
  passwordUpdateSchema,
  signInSchema,
  signUpSchema,
  type AccountClosureValues,
  type AccountPasswordValues,
  type AccountProfileValues,
  type AuthFormValues,
  type PasswordResetRequestValues,
  type PasswordUpdateValues
} from "@/lib/validators/auth";
import type { Profile } from "@/types/database";

type AuthResult =
  | { ok: true; needsConfirmation?: boolean; message?: string }
  | { ok: false; error: string };

type AccountClosureProfile = Pick<
  Profile,
  "role" | "stripe_customer_id" | "stripe_subscription_id"
>;

const terminalSubscriptionStatuses = new Set(["canceled", "incomplete_expired"]);

function getSafeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/jobs";
  }

  return value;
}

async function findLoginEmailByUsername(username: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("profiles")
    .select("email")
    .eq("username", username.trim().toLowerCase())
    .maybeSingle();

  if (error || !data?.email) return null;
  return data.email;
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

  const loginEmail =
    resolveLoginEmail(parsed.data.email) ??
    (await findLoginEmailByUsername(parsed.data.email));
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
    await ensureUserProfile(data.user, await getRequestGeo()).catch(() => false);
    await triggerWelcomeAutomationSafely(data.user);
  }

  return { ok: true };
}

export async function signUpAction(
  values: AuthFormValues,
  redirectTo: string
): Promise<AuthResult> {
  if (values.website?.trim()) {
    return {
      ok: true,
      needsConfirmation: true,
      message: "Check your email to confirm your account, then log in."
    };
  }

  // Continue with normal validation for human submissions.
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
    await ensureUserProfile(data.user, geo).catch(() => false);
    await triggerWelcomeAutomationSafely(data.user);
  }

  return { ok: true };
}

export async function requestPasswordResetAction(
  values: PasswordResetRequestValues
): Promise<AuthResult> {
  const parsed = passwordResetRequestSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const origin = await getRequestOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`
  });

  if (error) {
    return {
      ok: false,
      error: "We could not send a reset email right now. Please try again shortly."
    };
  }

  return {
    ok: true,
    message: "If an account exists for that email, a password reset link is on its way."
  };
}

export async function updatePasswordAction(values: PasswordUpdateValues): Promise<AuthResult> {
  const parsed = passwordUpdateSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid password." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return { ok: false, error: "Supabase is not configured." };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return {
      ok: false,
      error: "This password reset link is invalid or has expired. Request a new one."
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { ok: false, error: error.message };
  }

  await supabase.auth.signOut();

  return {
    ok: true,
    message: "Your password has been updated. You can now log in with your new password."
  };
}

export async function updateAccountProfileAction(
  values: AccountProfileValues
): Promise<AuthResult> {
  const parsed = accountProfileSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter valid profile details." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured." };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) return { ok: false, error: "Log in again to update your profile." };

  const username = parsed.data.username.toLowerCase();
  const countryName = parsed.data.countryName || null;
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      username,
      country_name: countryName
    })
    .eq("id", user.id);

  if (profileError) {
    const duplicateUsername = profileError.code === "23505";
    return {
      ok: false,
      error: duplicateUsername
        ? "That username is already taken. Choose another one."
        : profileError.message
    };
  }

  const emailChanged = parsed.data.email.toLowerCase() !== user.email?.toLowerCase();
  const { data: updatedUserData, error: authError } = await supabase.auth.updateUser({
    ...(emailChanged ? { email: parsed.data.email } : {}),
    data: {
      ...user.user_metadata,
      full_name: parsed.data.fullName,
      username,
      country_name: countryName
    }
  });

  if (authError) return { ok: false, error: authError.message };

  if (updatedUserData.user.email?.toLowerCase() === parsed.data.email.toLowerCase()) {
    await ensureUserProfile(updatedUserData.user).catch(() => false);
  }

  revalidatePath("/account/profile");
  return {
    ok: true,
    message: emailChanged
      ? "Profile saved. Check your inbox to confirm the new email address."
      : "Your profile has been updated."
  };
}

export async function updateAccountPasswordAction(
  values: AccountPasswordValues
): Promise<AuthResult> {
  const parsed = accountPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Enter a valid password." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured." };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { ok: false, error: "Log in again to update your password." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: error.message };

  return { ok: true, message: "Your password has been updated." };
}

async function getAccountClosureContext(userId: string) {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return { ok: false as const, error: "Account management is not configured." };
  }

  const { data: profile, error } = await admin
    .from("profiles")
    .select("role, stripe_customer_id, stripe_subscription_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false as const, error: "Unable to verify your account details." };
  }

  return { ok: true as const, admin, profile };
}

function isProtectedAdminAccount(
  user: { app_metadata?: Record<string, unknown>; email?: string },
  profile: AccountClosureProfile | null
) {
  const appRole =
    typeof user.app_metadata?.role === "string" ? user.app_metadata.role : "";
  const isConfiguredSuperLogin =
    Boolean(env.superLoginEmail) && user.email?.toLowerCase() === env.superLoginEmail.toLowerCase();

  return isAdminProfile(profile) || isAdminProfile({ role: appRole }) || isConfiguredSuperLogin;
}

function getSubscriptionCustomerId(customer: string | { id: string }) {
  return typeof customer === "string" ? customer : customer.id;
}

async function getAccountSubscriptions(
  user: { email?: string; id: string },
  profile: AccountClosureProfile | null
) {
  const stripe = getStripe();
  const hasBillingReference = Boolean(
    profile?.stripe_subscription_id || profile?.stripe_customer_id
  );

  if (!stripe) {
    return hasBillingReference
      ? { ok: false as const, error: "Billing is temporarily unavailable. No account change was made." }
      : { ok: true as const, stripe: null, subscriptions: [] };
  }

  try {
    const subscriptions = new Map<string, Stripe.Subscription>();
    const customerIds = new Set<string>();
    if (profile?.stripe_customer_id) customerIds.add(profile.stripe_customer_id);

    if (profile?.stripe_subscription_id) {
      try {
        const directSubscription = await stripe.subscriptions.retrieve(
          profile.stripe_subscription_id
        );
        const directCustomerId = getSubscriptionCustomerId(directSubscription.customer);
        const hasWrongCustomer =
          Boolean(profile.stripe_customer_id) && directCustomerId !== profile.stripe_customer_id;
        const hasWrongOwner =
          Boolean(directSubscription.metadata.userId) &&
          directSubscription.metadata.userId !== user.id;

        if (hasWrongCustomer || hasWrongOwner) {
          return { ok: false as const, error: "Subscription ownership could not be verified." };
        }

        subscriptions.set(directSubscription.id, directSubscription);
        customerIds.add(directCustomerId);
      } catch (error) {
        const stripeError = error as { statusCode?: number };
        if (stripeError.statusCode !== 404) throw error;
      }
    }

    if (user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 10 });
      for (const customer of customers.data) customerIds.add(customer.id);
    }

    for (const customerId of customerIds) {
      try {
        const result = await stripe.subscriptions.list({
          customer: customerId,
          status: "all",
          limit: 10
        });

        for (const subscription of result.data) {
          if (
            subscription.metadata.userId === user.id ||
            subscription.id === profile?.stripe_subscription_id
          ) {
            subscriptions.set(subscription.id, subscription);
          }
        }
      } catch (error) {
        const stripeError = error as { statusCode?: number };
        if (stripeError.statusCode !== 404) throw error;
      }
    }

    return { ok: true as const, stripe, subscriptions: [...subscriptions.values()] };
  } catch {
    return {
      ok: false as const,
      error: "Unable to verify your billing status. No account change was made."
    };
  }
}

export async function deactivateAccountAction(
  values: AccountClosureValues
): Promise<AuthResult> {
  const parsed = deactivateAccountSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Confirm deactivation." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured." };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) return { ok: false, error: "Log in again to deactivate your account." };

  const context = await getAccountClosureContext(user.id);
  if (!context.ok) return { ok: false, error: context.error };
  if (isProtectedAdminAccount(user, context.profile)) {
    return { ok: false, error: "Administrator accounts cannot be deactivated here." };
  }

  const billing = await getAccountSubscriptions(user, context.profile);
  if (!billing.ok) return { ok: false, error: billing.error };

  const renewingSubscription = billing.subscriptions.find(
    (subscription) =>
      !terminalSubscriptionStatuses.has(subscription.status) &&
      !subscription.cancel_at_period_end
  );
  if (renewingSubscription) {
    return {
      ok: false,
      error: "Cancel your membership before deactivating so billing does not continue while you cannot log in."
    };
  }

  const { error: banError } = await context.admin.auth.admin.updateUserById(user.id, {
    ban_duration: "876000h"
  });
  if (banError) return { ok: false, error: "Unable to deactivate your account right now." };

  const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
  if (signOutError) {
    console.error("Hirevate account was deactivated but global sign-out failed", {
      userId: user.id,
      error: signOutError.message
    });
  }

  return { ok: true, message: "Your account has been deactivated." };
}

export async function deleteAccountAction(
  values: AccountClosureValues
): Promise<AuthResult> {
  const parsed = deleteAccountSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Confirm account deletion." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured." };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) return { ok: false, error: "Log in again to delete your account." };

  const context = await getAccountClosureContext(user.id);
  if (!context.ok) return { ok: false, error: context.error };
  if (isProtectedAdminAccount(user, context.profile)) {
    return { ok: false, error: "Administrator accounts cannot be deleted here." };
  }

  const billing = await getAccountSubscriptions(user, context.profile);
  if (!billing.ok) return { ok: false, error: billing.error };

  const subscriptionsToCancel = billing.subscriptions.filter(
    (subscription) => !terminalSubscriptionStatuses.has(subscription.status)
  );
  const stripe = billing.stripe;
  if (stripe && subscriptionsToCancel.length > 0) {
    try {
      await Promise.all(
        subscriptionsToCancel.map((subscription) => stripe.subscriptions.cancel(subscription.id))
      );
    } catch {
      return {
        ok: false,
        error: "Your membership could not be canceled, so your account was not deleted. Contact support."
      };
    }
  }

  const { error: signOutError } = await supabase.auth.signOut({ scope: "global" });
  if (signOutError) {
    console.error("Global sign-out failed before Hirevate account deletion", {
      userId: user.id,
      error: signOutError.message
    });
  }

  const { error: deleteError } = await context.admin.auth.admin.deleteUser(user.id, false);
  if (deleteError) {
    return {
      ok: false,
      error:
        subscriptionsToCancel.length > 0
          ? "Your membership was canceled, but account deletion did not complete. Contact support."
          : "Unable to delete your account right now. Contact support."
    };
  }

  return { ok: true, message: "Your account has been permanently deleted." };
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/");
}
