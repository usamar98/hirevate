import { redirect } from "next/navigation";
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

  if (profile?.role !== "admin") {
    redirect(`/admin/no-access?from=${encodeURIComponent(safeRedirectTo)}`);
  }

  return { user, profile };
}

export function isPaidSubscription(status: string | null | undefined) {
  return ["active", "trialing", "pro", "annual", "silver", "gold", "platinum"].includes(status ?? "");
}
