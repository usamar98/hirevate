"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSuperLoginProfile } from "@/lib/auth/super-login";
import { getProfile, requireUser } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const allowedStatuses = new Set(["free", "active"]);

export async function updateSuperLoginPlanAction(formData: FormData) {
  const user = await requireUser("/dashboard");
  const profile = await getProfile(user.id);

  if (!isSuperLoginProfile(profile)) {
    redirect("/dashboard");
  }

  const requestedStatus = String(formData.get("subscriptionStatus") ?? "");
  const subscriptionStatus = allowedStatuses.has(requestedStatus) ? requestedStatus : "free";
  const admin = createSupabaseAdminClient();

  if (!admin) {
    redirect("/dashboard?superLoginError=not-configured");
  }

  await admin
    .from("profiles")
    .update({
      subscription_status: subscriptionStatus,
      stripe_customer_id: null,
      stripe_subscription_id: null
    })
    .eq("id", user.id);

  revalidatePath("/dashboard");
  revalidatePath("/jobs");
  redirect(`/dashboard?superLoginPlan=${subscriptionStatus}`);
}
