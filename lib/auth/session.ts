import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentUserIfSessionPresent() {
  const cookieStore = await cookies();
  const hasSessionCookie = cookieStore
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));

  return hasSessionCookie ? getCurrentUser() : null;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data;
}

function getSafeRedirectPath(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  return value;
}

export async function requireUser(redirectTo?: string) {
  const user = await getCurrentUser();
  const safeRedirectTo = getSafeRedirectPath(redirectTo);

  if (!user) {
    redirect(safeRedirectTo ? `/login?redirect=${encodeURIComponent(safeRedirectTo)}` : "/login");
  }

  return user;
}

export async function requireAdmin(redirectTo = "/admin") {
  const safeRedirectTo = getSafeRedirectPath(redirectTo) ?? "/admin";
  const user = await requireUser(safeRedirectTo);
  const profile = await getProfile(user.id);

  if (!isAdminProfile(profile)) {
    redirect(`/admin/no-access?from=${encodeURIComponent(safeRedirectTo)}`);
  }

  return { user, profile };
}

export function isPaidSubscription(status: string | null | undefined) {
  return ["active", "trialing", "pro", "annual", "starter", "silver", "gold", "platinum"].includes(status ?? "");
}

export function isAdminProfile(profile: Pick<Profile, "role"> | null | undefined) {
  const role = profile?.role.trim().toLowerCase();
  return role === "admin" || role === "superadmin" || role === "super_admin";
}

export function hasPremiumAccess(
  profile:
    | Pick<Profile, "role" | "subscription_status" | "stripe_subscription_status">
    | null
    | undefined
) {
  if (isAdminProfile(profile)) return true;

  const stripeStatus = profile?.stripe_subscription_status?.trim().toLowerCase();
  if (stripeStatus === "trialing") return false;
  if (stripeStatus) return stripeStatus === "active";

  return isPaidSubscription(profile?.subscription_status);
}

export function getFreeTrialEndsAt(
  profile: Pick<Profile, "free_trial_started_at"> | null | undefined
) {
  const trialStartedAt = Date.parse(profile?.free_trial_started_at ?? "");
  return Number.isFinite(trialStartedAt)
    ? new Date(trialStartedAt + 3 * 24 * 60 * 60 * 1000)
    : null;
}

export function hasActiveFreeTrial(
  profile: Pick<Profile, "free_trial_started_at"> | null | undefined,
  now = new Date()
) {
  const trialEndsAt = getFreeTrialEndsAt(profile);
  return Boolean(trialEndsAt && trialEndsAt.getTime() > now.getTime());
}

export function hasProductAccess(
  profile:
    | Pick<
        Profile,
        "free_trial_started_at" | "role" | "subscription_status" | "stripe_subscription_status"
      >
    | null
    | undefined,
  now = new Date()
) {
  return hasPremiumAccess(profile) || hasActiveFreeTrial(profile, now);
}
