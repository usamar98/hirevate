import "server-only";

import type Stripe from "stripe";
import { Resend } from "resend";
import { env } from "@/lib/env";
import { getPricingOption } from "@/lib/pricing";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const trialReminderTemplateAlias = "hirevate-trial-ending-reminder";
const trialReminderHoursBeforeEnd = 12;
const trialReminderLeadMs = trialReminderHoursBeforeEnd * 60 * 60 * 1000;
const minimumSchedulingLeadMs = 60 * 1000;

let resendClient: Resend | null = null;

function getResendClient() {
  if (!env.resendApiKey) return null;
  resendClient ??= new Resend(env.resendApiKey);
  return resendClient;
}

function metadataText(metadata: Record<string, unknown> | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getFirstName(metadata: Record<string, unknown> | undefined) {
  const fullName = metadataText(metadata, "full_name") ?? metadataText(metadata, "name");
  if (fullName) return fullName.split(/\s+/)[0];

  return metadataText(metadata, "username") ?? "there";
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
  }).format(new Date(timestamp * 1000));
}

async function cancelScheduledEmail(resend: Resend, emailId: string) {
  const { error } = await resend.emails.cancel(emailId);
  if (error) throw new Error(error.message);
}

async function scheduleTrialEndingReminder(subscription: Stripe.Subscription) {
  const admin = createSupabaseAdminClient();
  const resend = getResendClient();
  const userId = subscription.metadata.userId;
  const trialEnd = subscription.trial_end;

  if (!admin || !resend || !userId || !trialEnd || subscription.status !== "trialing") {
    return false;
  }

  if (subscription.cancel_at_period_end) return false;

  const reminderAt = new Date(trialEnd * 1000 - trialReminderLeadMs);
  if (reminderAt.getTime() <= Date.now() + minimumSchedulingLeadMs) return false;

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("trial_reminder_email_id, trial_reminder_scheduled_for")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile || profile.trial_reminder_email_id) return Boolean(profile);

  const { data: authData, error: authError } = await admin.auth.admin.getUserById(userId);
  if (authError) throw authError;
  if (!authData.user?.email) return false;

  const monthlyPlan = getPricingOption("gold_monthly");
  const { data: email, error: emailError } = await resend.emails.send(
    {
      from: env.trialReminderEmailFrom,
      to: authData.user.email,
      subject: "Your Hirevate trial ends soon",
      replyTo: "support@hirevate.com",
      scheduledAt: reminderAt.toISOString(),
      template: {
        id: trialReminderTemplateAlias,
        variables: {
          RECIPIENT_FIRST_NAME: getFirstName(authData.user.user_metadata),
          TRIAL_ENDS_AT: formatTrialEnd(trialEnd),
          PLAN_PRICE: `USD $${monthlyPlan.priceValue} per month`,
          MANAGE_SUBSCRIPTION_URL: new URL("/account/subscription", env.appUrl).toString()
        }
      },
      tags: [
        { name: "email_type", value: "trial_ending_reminder" },
        { name: "subscription_id", value: subscription.id }
      ]
    },
    { idempotencyKey: `hirevate-trial-reminder-${subscription.id}` }
  );

  if (emailError) throw new Error(emailError.message);
  if (!email?.id) throw new Error("Resend did not return a scheduled email ID.");

  const { data: claimedProfile, error: claimError } = await admin
    .from("profiles")
    .update({
      trial_reminder_email_id: email.id,
      trial_reminder_scheduled_for: reminderAt.toISOString()
    })
    .eq("id", userId)
    .eq("stripe_subscription_id", subscription.id)
    .is("trial_reminder_email_id", null)
    .select("id")
    .maybeSingle();

  if (!claimError && claimedProfile) return true;

  if (!claimError) {
    const { data: currentProfile, error: currentProfileError } = await admin
      .from("profiles")
      .select("trial_reminder_email_id")
      .eq("id", userId)
      .maybeSingle();

    if (!currentProfileError && currentProfile?.trial_reminder_email_id === email.id) return true;
  }

  try {
    await cancelScheduledEmail(resend, email.id);
  } catch (cancelError) {
    console.error("Failed to cancel an unclaimed Hirevate trial reminder", {
      emailId: email.id,
      subscriptionId: subscription.id,
      error: cancelError
    });
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
    .select("trial_reminder_email_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profile?.trial_reminder_email_id) return false;

  await cancelScheduledEmail(resend, profile.trial_reminder_email_id);

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

export async function scheduleTrialEndingReminderSafely(subscription: Stripe.Subscription) {
  try {
    return await scheduleTrialEndingReminder(subscription);
  } catch (error) {
    console.error("Failed to schedule the Hirevate trial reminder", {
      subscriptionId: subscription.id,
      userId: subscription.metadata.userId,
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
