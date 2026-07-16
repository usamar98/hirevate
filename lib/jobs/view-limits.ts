import { startOfUtcDay } from "@/lib/time";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isPaidSubscription } from "@/lib/auth/session";

export const FREE_DAILY_JOB_VIEW_LIMIT = 10;

async function getLimitClient() {
  return createSupabaseAdminClient() ?? (await createSupabaseServerClient());
}

export async function canViewJob(userId: string, jobId?: string) {
  const supabase = await getLimitClient();
  if (!supabase) {
    return {
      allowed: false,
      remaining: 0,
      reason: "Supabase is not configured."
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .maybeSingle();

  if (isPaidSubscription(profile?.subscription_status)) {
    return { allowed: true, remaining: Number.POSITIVE_INFINITY, reason: null };
  }

  const since = startOfUtcDay(new Date()).toISOString();

  if (jobId) {
    const { data: existingView } = await supabase
      .from("job_views")
      .select("id")
      .eq("user_id", userId)
      .eq("job_id", jobId)
      .gte("viewed_at", since)
      .maybeSingle();

    if (existingView) {
      return { allowed: true, remaining: 0, reason: null };
    }
  }

  const { count } = await supabase
    .from("job_views")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("viewed_at", since);

  const used = count ?? 0;
  const remaining = Math.max(FREE_DAILY_JOB_VIEW_LIMIT - used, 0);

  if (used >= FREE_DAILY_JOB_VIEW_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      reason: "Public preview daily job detail limit reached."
    };
  }

  return { allowed: true, remaining, reason: null };
}

export async function recordJobView(userId: string, jobId: string) {
  const supabase = await getLimitClient();
  if (!supabase) return;

  const since = startOfUtcDay(new Date()).toISOString();

  const { data: existingView } = await supabase
    .from("job_views")
    .select("id")
    .eq("user_id", userId)
    .eq("job_id", jobId)
    .gte("viewed_at", since)
    .maybeSingle();

  if (existingView) return;

  const { error } = await supabase.from("job_views").insert({
    user_id: userId,
    job_id: jobId
  });

  if (error) {
    console.error("Failed to record job view", error);
  }
}
