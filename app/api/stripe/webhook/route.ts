import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { env } from "@/lib/env";
import { checkoutPlanKeys, type SubscriptionTier } from "@/lib/pricing";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getStripe,
  resumeBuilderProduct,
  stripePlans,
  type StripePlanKey
} from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isPlanKey(value: unknown): value is StripePlanKey {
  return typeof value === "string" && checkoutPlanKeys.includes(value as StripePlanKey);
}

const legacySubscriptionStatuses: Record<string, SubscriptionTier> = {
  gold_weekly: "gold"
};

function getStripeObjectId(value: string | { id: string } | null | undefined) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
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
  if (!invoice) return false;

  return invoice.paid || invoice.status === "paid";
}

async function updateProfileFromSubscription(
  subscription: Stripe.Subscription,
  paidStatus: SubscriptionTier | "free"
) {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase service role is not configured.");

  const userId = subscription.metadata.userId;

  if (!userId) return;

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

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(`No profile found for Stripe subscription user ${userId.slice(-8)}.`);
  }
}

async function updatePaidProfileIfInvoiceIsPaid(stripe: Stripe, subscription: Stripe.Subscription) {
  const paidStatus = getSubscriptionPlan(subscription);
  if (!paidStatus) return false;

  if (await hasPaidLatestInvoice(stripe, subscription)) {
    await updateProfileFromSubscription(subscription, paidStatus);
    return true;
  }

  console.warn(
    JSON.stringify({
      level: "warn",
      route: "/api/stripe/webhook",
      message: "Stripe subscription is not backed by a paid latest invoice.",
      subscriptionId: subscription.id,
      status: subscription.status,
      latestInvoiceId: getStripeObjectId(subscription.latest_invoice)
    })
  );

  return false;
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: "stripe-webhook" });
}

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe || !env.stripeWebhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid Stripe signature." },
      { status: 400 }
    );
  }

  try {
    console.log(
      JSON.stringify({
        level: "info",
        route: "/api/stripe/webhook",
        eventId: event.id,
        eventType: event.type,
        livemode: event.livemode
      })
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.product === resumeBuilderProduct.key) {
        return NextResponse.json({ received: true });
      }

      const subscriptionId = session.subscription;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(String(subscriptionId));
        if (session.payment_status === "paid") {
          await updatePaidProfileIfInvoiceIsPaid(stripe, subscription);
        } else {
          console.warn(
            JSON.stringify({
              level: "warn",
              route: "/api/stripe/webhook",
              message: "Checkout completed without paid funds.",
              sessionId: session.id,
              paymentStatus: session.payment_status,
              subscriptionId: subscription.id
            })
          );
        }
      }
    }

    if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = getStripeObjectId(invoice.subscription);
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await updatePaidProfileIfInvoiceIsPaid(stripe, subscription);
      }
    }

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object as Stripe.Subscription;
      if (subscription.status === "active" || subscription.status === "trialing") {
        const paidInvoiceSynced = await updatePaidProfileIfInvoiceIsPaid(stripe, subscription);
        if (!paidInvoiceSynced) {
          await updateProfileFromSubscription(subscription, "free");
        }
      } else {
        await updateProfileFromSubscription(subscription, "free");
      }
    }

    if (
      event.type === "customer.subscription.deleted" ||
      event.type === "invoice.payment_failed" ||
      event.type === "invoice.finalization_failed"
    ) {
      const stripeObject = event.data.object as Stripe.Subscription | Stripe.Invoice;
      const subscriptionId =
        "subscription" in stripeObject ? getStripeObjectId(stripeObject.subscription) : stripeObject.id;

      if (subscriptionId) {
        const subscription =
          "subscription" in stripeObject ? await stripe.subscriptions.retrieve(subscriptionId) : stripeObject;
        await updateProfileFromSubscription(subscription, "free");
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed." },
      { status: 500 }
    );
  }
}
