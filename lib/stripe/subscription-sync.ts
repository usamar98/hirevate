import type Stripe from "stripe";
import type { SubscriptionTier } from "@/lib/pricing";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { stripePlans, type StripePlanKey } from "@/lib/stripe/server";
import { checkoutPlanKeys } from "@/lib/pricing";

type StripeObjectReference = string | { id: string } | null | undefined;

type InvoiceWithParent = Stripe.Invoice & {
  parent?:
    | {
        type?: string;
        subscription_details?: {
          subscription?: StripeObjectReference;
        } | null;
      }
    | null;
};

export type PaidSubscriptionSync = {
  paidStatus: SubscriptionTier;
  subscription: Stripe.Subscription;
};

const legacySubscriptionStatuses: Record<string, SubscriptionTier> = {
  gold_weekly: "gold"
};

function isPlanKey(value: unknown): value is StripePlanKey {
  return typeof value === "string" && checkoutPlanKeys.includes(value as StripePlanKey);
}

export function getStripeObjectId(value: StripeObjectReference) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const legacySubscription = getStripeObjectId(
    (invoice as Stripe.Invoice & { subscription?: StripeObjectReference }).subscription
  );
  if (legacySubscription) return legacySubscription;

  const parent = (invoice as InvoiceWithParent).parent;
  if (parent?.type !== "subscription_details") return null;

  return getStripeObjectId(parent.subscription_details?.subscription);
}

function getSubscriptionPlan(subscription: Stripe.Subscription) {
  const plan = subscription.metadata.plan;
  return isPlanKey(plan) ? stripePlans[plan].subscriptionStatus : legacySubscriptionStatuses[plan];
}

async function getLatestInvoice(stripe: Stripe, subscription: Stripe.Subscription) {
  if (!subscription.latest_invoice) return null;
  if (typeof subscription.latest_invoice !== "string") return subscription.latest_invoice;
  return stripe.invoices.retrieve(subscription.latest_invoice);
}

async function hasPaidLatestInvoice(stripe: Stripe, subscription: Stripe.Subscription) {
  if (subscription.status === "trialing") return true;

  const invoice = await getLatestInvoice(stripe, subscription);
  return Boolean(invoice && (invoice.paid || invoice.status === "paid"));
}

export async function updateProfileFromSubscription(
  subscription: Stripe.Subscription,
  paidStatus: SubscriptionTier | "free"
) {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase service role is not configured.");

  const userId = subscription.metadata.userId;
  if (!userId) return false;

  const { data, error } = await admin
    .from("profiles")
    .update({
      subscription_status: paidStatus,
      stripe_customer_id: String(subscription.customer),
      stripe_subscription_id: subscription.id
    })
    .eq("id", userId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`No profile found for Stripe subscription user ${userId.slice(-8)}.`);
  }

  return true;
}

export async function syncPaidSubscription(
  stripe: Stripe,
  subscription: Stripe.Subscription
): Promise<PaidSubscriptionSync | null> {
  const paidStatus = getSubscriptionPlan(subscription);
  if (!paidStatus || !(await hasPaidLatestInvoice(stripe, subscription))) return null;

  const updated = await updateProfileFromSubscription(subscription, paidStatus);
  return updated ? { paidStatus, subscription } : null;
}

export async function syncPaidCheckoutSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  expectedUserId: string
) {
  if (session.payment_status !== "paid" || session.client_reference_id !== expectedUserId) {
    return null;
  }

  const subscriptionId = getStripeObjectId(session.subscription);
  if (!subscriptionId) return null;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (subscription.metadata.userId !== expectedUserId) return null;

  return syncPaidSubscription(stripe, subscription);
}

export async function reconcilePaidSubscriptionForUser(
  stripe: Stripe,
  userId: string,
  email: string,
  knownCustomerId?: string | null
) {
  const customerIds = new Set<string>();
  if (knownCustomerId) customerIds.add(knownCustomerId);

  const customers = await stripe.customers.list({ email, limit: 10 });
  for (const customer of customers.data) customerIds.add(customer.id);

  const subscriptions: Stripe.Subscription[] = [];
  for (const customerId of customerIds) {
    try {
      const result = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        limit: 10
      });
      subscriptions.push(...result.data);
    } catch (error) {
      const stripeError = error as { statusCode?: number };
      if (stripeError.statusCode !== 404) throw error;
    }
  }

  subscriptions.sort((left, right) => right.created - left.created);
  for (const subscription of subscriptions) {
    if (subscription.metadata.userId !== userId) continue;
    if (subscription.status !== "active" && subscription.status !== "trialing") continue;

    const synced = await syncPaidSubscription(stripe, subscription);
    if (synced) return synced;
  }

  return null;
}
