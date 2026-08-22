import "server-only";

import type { User } from "@supabase/supabase-js";
import { Resend } from "resend";
import { hasPremiumAccess } from "@/lib/auth/session";
import { env } from "@/lib/env";
import {
  getPricingOption,
  trialDurationDays,
  trialReminderHoursBeforeEnd
} from "@/lib/pricing";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const trialReminderTemplateAlias = "hirevate-trial-ending-reminder";
const hourMs = 60 * 60 * 1000;
const trialDurationMs = trialDurationDays * 24 * hourMs;
const trialReminderLeadMs = trialReminderHoursBeforeEnd * hourMs;
const minimumSchedulingLeadMs = 60 * 1000;

let resendClient: Resend | null = null;

function getResendClient() {
  if (!env.resendApiKey) return null;
  resendClient ??= new Resend(env.resendApiKey);
  return resendClient;
}

function metadataText(user: User, key: string) {
  const value = user.user_metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getFirstName(user: User) {
  const fullName = metadataText(user, "full_name") ?? metadataText(user, "name");
  if (fullName) return fullName.split(/\s+/)[0];

  return metadataText(user, "username") ?? "there";
}

function formatTrialEnd(timestamp: number) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short"
  }).format(new Date(timestamp));
}

async function cancelScheduledEmail(resend: Resend, emailId: string) {
  const { error } = await resend.emails.cancel(emailId);
  if (error) throw new Error(error.message);
}

async function scheduleTrialEndingReminder(user: User) {
  const admin = createSupabaseAdminClient();
  const resend = getResendClient();
  if (!admin || !resend || !user.email) return false;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select(
      "created_at,role,subscription_status,stripe_subscription_status,trial_reminder_email_id,trial_reminder_scheduled_for"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile || profile.trial_reminder_email_id || hasPremiumAccess(profile)) {
    return Boolean(profile);
  }

  const accountCreatedAt = Date.parse(profile.created_at || user.created_at);
  if (!Number.isFinite(accountCreatedAt)) return false;

  const trialEndsAt = accountCreatedAt + trialDurationMs;
  const now = Date.now();
  if (now >= trialEndsAt) return false;

  const preferredReminderAt = trialEndsAt - trialReminderLeadMs;
  const shouldSchedule = preferredReminderAt > now + minimumSchedulingLeadMs;
  const deliveryAt = shouldSchedule ? preferredReminderAt : now;
  const monthlyPlan = getPricingOption("gold_monthly");
  const { data: email, error: emailError } = await resend.emails.send(
    {
      from: env.trialReminderEmailFrom,
      to: user.email,
      subject: "Your Hirevate trial ends in about 24 hours",
      replyTo: "support@hirevate.com",
      ...(shouldSchedule ? { scheduledAt: new Date(deliveryAt).toISOString() } : {}),
      template: {
        id: trialReminderTemplateAlias,
        variables: {
          RECIPIENT_FIRST_NAME: getFirstName(user),
          TRIAL_ENDS_AT: formatTrialEnd(trialEndsAt),
          PLAN_PRICE: `USD $${monthlyPlan.priceValue} per month`,
          MANAGE_SUBSCRIPTION_URL: new URL("/pricing", env.appUrl).toString()
        }
      },
      tags: [
        { name: "email_type", value: "trial_ending_reminder" },
        { name: "user_id", value: user.id }
      ]
    },
    { idempotencyKey: `hirevate-trial-reminder-${user.id}` }
  );

  if (emailError) throw new Error(emailError.message);
  if (!email?.id) throw new Error("Resend did not return a trial reminder email ID.");

  const { data: claimedProfile, error: claimError } = await admin
    .from("profiles")
    .update({
      trial_reminder_email_id: email.id,
      trial_reminder_scheduled_for: new Date(deliveryAt).toISOString()
    })
    .eq("id", user.id)
    .is("trial_reminder_email_id", null)
    .select("id")
    .maybeSingle();

  if (!claimError && claimedProfile) return true;

  if (!claimError) {
    const { data: currentProfile } = await admin
      .from("profiles")
      .select("trial_reminder_email_id")
      .eq("id", user.id)
      .maybeSingle();

    if (currentProfile?.trial_reminder_email_id === email.id) return true;
  }

  if (shouldSchedule) {
    try {
      await cancelScheduledEmail(resend, email.id);
    } catch (cancelError) {
      console.error("Failed to cancel an unclaimed Hirevate trial reminder", {
        emailId: email.id,
        userId: user.id,
        error: cancelError
      });
    }
  }

  if (claimError) throw claimError;
  return false;
}

async function cancelTrialEndingReminder(userId: string) {
  const admin = createSupabaseAdminClient();
  const resend = getResendClient();
  if (!admin || !resend) return false;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("trial_reminder_email_id,trial_reminder_scheduled_for")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile?.trial_reminder_email_id) return false;

  const scheduledFor = Date.parse(profile.trial_reminder_scheduled_for ?? "");
  if (Number.isFinite(scheduledFor) && scheduledFor > Date.now()) {
    await cancelScheduledEmail(resend, profile.trial_reminder_email_id);
  }

  const { error: clearError } = await admin
    .from("profiles")
    .update({
      trial_reminder_email_id: null,
      trial_reminder_scheduled_for: null
    })
    .eq("id", userId)
    .eq("trial_reminder_email_id", profile.trial_reminder_email_id);

  if (clearError) throw clearError;
  return true;
}

export async function scheduleTrialEndingReminderSafely(user: User) {
  try {
    return await scheduleTrialEndingReminder(user);
  } catch (error) {
    console.error("Failed to schedule the Hirevate trial reminder", {
      userId: user.id,
      error
    });
    return false;
  }
}

export async function cancelTrialEndingReminderSafely(userId: string) {
  try {
    return await cancelTrialEndingReminder(userId);
  } catch (error) {
    console.error("Failed to cancel the Hirevate trial reminder", { userId, error });
    return false;
  }
}
