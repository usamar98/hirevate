import "server-only";

import { Resend } from "resend";
import type { User } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const welcomeTemplateAlias = "hirevate-new-user-welcome";
const welcomeSubject = "Welcome to Hirevate — find fresh jobs faster";

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

  const username = metadataText(user, "username");
  if (username) return username;

  return "there";
}

function productUrl(path: string) {
  return new URL(path, env.appUrl).toString();
}

async function triggerWelcomeAutomation(user: User) {
  const admin = createSupabaseAdminClient();
  const resend = getResendClient();
  if (!admin || !resend || !user.email) return false;

  const claimedAt = new Date().toISOString();
  const { data: claimedProfile, error: claimError } = await admin
    .from("profiles")
    .update({ welcome_email_triggered_at: claimedAt })
    .eq("id", user.id)
    .is("welcome_email_triggered_at", null)
    .select("id")
    .maybeSingle();

  if (claimError) throw claimError;
  if (!claimedProfile) return false;

  const { error: emailError } = await resend.emails.send(
    {
      from: env.welcomeEmailFrom,
      to: user.email,
      subject: welcomeSubject,
      replyTo: "support@hirevate.com",
      template: {
        id: welcomeTemplateAlias,
        variables: {
          RECIPIENT_FIRST_NAME: getFirstName(user),
          BROWSE_JOBS_URL: productUrl("/jobs#results"),
          PRICING_URL: productUrl("/pricing")
        }
      },
      tags: [{ name: "email_type", value: "new_user_welcome" }]
    },
    { idempotencyKey: `hirevate-welcome-${user.id}` }
  );

  if (!emailError) return true;

  const { error: rollbackError } = await admin
    .from("profiles")
    .update({ welcome_email_triggered_at: null })
    .eq("id", user.id)
    .eq("welcome_email_triggered_at", claimedAt);

  if (rollbackError) {
    console.error("Failed to release the Hirevate welcome email claim", {
      userId: user.id,
      error: rollbackError.message
    });
  }

  throw new Error(emailError.message);
}

export async function triggerWelcomeAutomationSafely(user: User) {
  try {
    return await triggerWelcomeAutomation(user);
  } catch (error) {
    console.error("Failed to trigger the Hirevate welcome email automation", {
      userId: user.id,
      error
    });
    return false;
  }
}
