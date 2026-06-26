import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { env } from "@/lib/env";
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
  return (
    value === "silver_weekly" ||
    value === "gold_weekly" ||
    value === "gold_monthly" ||
    value === "platinum_weekly" ||
    value === "platinum_monthly"
  );
}

async function updateProfileFromSubscription(subscription: Stripe.Subscription) {
  const admin = createSupabaseAdminClient();
  if (!admin) throw new Error("Supabase service role is not configured.");

  const userId = subscription.metadata.userId;
  const plan = subscription.metadata.plan;

  if (!userId) return;

  const paidStatus =
    subscription.status === "active" || subscription.status === "trialing"
      ? isPlanKey(plan)
        ? stripePlans[plan].subscriptionStatus
        : subscription.status
      : "free";

  await admin
    .from("profiles")
    .update({
      subscription_status: paidStatus,
      stripe_customer_id: String(subscription.customer),
      stripe_subscription_id: subscription.id
    })
    .eq("id", userId);
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
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.product === resumeBuilderProduct.key) {
        return NextResponse.json({ received: true });
      }

      const subscriptionId = session.subscription;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(String(subscriptionId));
        await updateProfileFromSubscription(subscription);
      }
    }

    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      await updateProfileFromSubscription(event.data.object as Stripe.Subscription);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed." },
      { status: 500 }
    );
  }
}
