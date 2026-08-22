import { NextResponse } from "next/server";
import { ensureUserProfile } from "@/lib/auth/ensure-profile";
import { scheduleTrialEndingReminderSafely } from "@/lib/email/trial-reminder";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { startFreeTrial } from "@/lib/trial/usage";

export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, error: "Trial activation is temporarily unavailable." },
      { status: 503 }
    );
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;
  if (userError || !user) {
    return NextResponse.json(
      { ok: false, error: "Log in to start your free trial." },
      { status: 401 }
    );
  }

  await ensureUserProfile(user).catch(() => false);
  const activation = await startFreeTrial();
  if (!activation.ok) {
    return NextResponse.json(
      { ok: false, error: "We could not start your free trial. Please try again." },
      { status: 500 }
    );
  }

  if (activation.status === "active") {
    await scheduleTrialEndingReminderSafely(user);
  }

  return NextResponse.json({
    ok: true,
    status: activation.status,
    trialEndsAt: activation.trialEndsAt
  });
}
