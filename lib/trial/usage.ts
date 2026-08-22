import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { TrialFeature } from "@/types/database";

export type TrialReservation = {
  allowed: boolean;
  denialReason: string | null;
  remaining: number | null;
  trialEndsAt: string | null;
};

export type TrialActivation = {
  ok: boolean;
  started: boolean;
  status: string;
  trialEndsAt: string | null;
  trialStartedAt: string | null;
};

export async function startFreeTrial(): Promise<TrialActivation> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      started: false,
      status: "setup_required",
      trialEndsAt: null,
      trialStartedAt: null
    };
  }

  const { data, error } = await supabase.rpc("start_account_trial");
  if (error) {
    console.error("Failed to start account trial", { code: error.code });
    return {
      ok: false,
      started: false,
      status: "activation_failed",
      trialEndsAt: null,
      trialStartedAt: null
    };
  }

  const activation = data?.[0];
  return {
    ok: Boolean(activation?.trial_started_at),
    started: Boolean(activation?.started),
    status: activation?.trial_status ?? "activation_failed",
    trialEndsAt: activation?.trial_ends_at ?? null,
    trialStartedAt: activation?.trial_started_at ?? null
  };
}

export async function reserveTrialFeature(feature: TrialFeature): Promise<TrialReservation> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      allowed: false,
      denialReason: "setup_required",
      remaining: 0,
      trialEndsAt: null
    };
  }

  const { data, error } = await supabase.rpc("reserve_trial_feature", {
    p_feature: feature
  });

  if (error) {
    console.error("Failed to reserve trial feature", { code: error.code, feature });
    return {
      allowed: false,
      denialReason: "reservation_failed",
      remaining: 0,
      trialEndsAt: null
    };
  }

  const reservation = data?.[0];
  return {
    allowed: Boolean(reservation?.allowed),
    denialReason: reservation?.denial_reason ?? "reservation_failed",
    remaining: reservation?.remaining ?? null,
    trialEndsAt: reservation?.trial_ends_at ?? null
  };
}

export async function releaseTrialFeature(userId: string, feature: TrialFeature) {
  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    console.error("Could not release trial feature because the admin client is unavailable", {
      feature
    });
    return;
  }

  const { error } = await supabase.rpc("release_trial_feature", {
    p_feature: feature,
    p_user_id: userId
  });

  if (error) {
    console.error("Failed to release trial feature", { code: error.code, feature });
  }
}
