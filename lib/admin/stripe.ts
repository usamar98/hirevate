import { env } from "@/lib/env";
import { getStripe } from "@/lib/stripe/server";

function getStripeKeyMode(value: string) {
  if (value.startsWith("sk_live_") || value.startsWith("pk_live_")) return "live";
  if (value.startsWith("sk_test_") || value.startsWith("pk_test_")) return "test";
  return value ? "unknown" : "missing";
}

export async function getStripeAccountStatus() {
  const stripe = getStripe();

  const status = {
    configured: Boolean(stripe),
    secretKeyMode: getStripeKeyMode(env.stripeSecretKey),
    publishableKeyMode: getStripeKeyMode(env.stripePublishableKey),
    webhookConfigured: Boolean(env.stripeWebhookSecret),
    account: null as
      | {
          id: string;
          country: string | null;
          businessName: string | null;
          dashboardName: string | null;
          statementDescriptor: string | null;
          chargesEnabled: boolean;
          payoutsEnabled: boolean;
        }
      | null,
    error: null as string | null
  };

  if (!stripe) {
    return status;
  }

  try {
    const account = await stripe.accounts.retrieve();

    status.account = {
      id: account.id,
      country: account.country ?? null,
      businessName: account.business_profile?.name ?? null,
      dashboardName: account.settings?.dashboard?.display_name ?? null,
      statementDescriptor: account.settings?.payments?.statement_descriptor ?? null,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    };
  } catch (error) {
    status.error =
      error instanceof Error ? error.message : "Unable to retrieve Stripe account details.";
  }

  return status;
}
