import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { cancelTrialEndingReminderSafely } from "@/lib/email/trial-reminder";
import { env } from "@/lib/env";
import { getStripe, resumeBuilderProduct } from "@/lib/stripe/server";
import {
  getInvoiceSubscriptionId,
  getStripeObjectId,
  syncPaidSubscription,
  syncSubscriptionState,
  updateProfileFromSubscription
} from "@/lib/stripe/subscription-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function retireCardBackedTrialIfNeeded(
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  const shouldRetire =
    subscription.status === "trialing" &&
    subscription.metadata.trial === "three_day" &&
    !subscription.cancel_at_period_end;

  return shouldRetire
    ? stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true })
    : subscription;
}

async function updatePaidProfileIfInvoiceIsPaid(
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  const effectiveSubscription = await retireCardBackedTrialIfNeeded(stripe, subscription);
  const synced = await syncPaidSubscription(stripe, effectiveSubscription);
  if (synced) {
    if (
      effectiveSubscription.status !== "trialing" &&
      effectiveSubscription.metadata.userId
    ) {
      await cancelTrialEndingReminderSafely(effectiveSubscription.metadata.userId);
    }
    return true;
  }

  console.warn(
    JSON.stringify({
      level: "warn",
      route: "/api/stripe/webhook",
      message: "Stripe subscription is not backed by a paid latest invoice or known plan.",
      subscriptionId: effectiveSubscription.id,
      status: effectiveSubscription.status,
      latestInvoiceId: getStripeObjectId(effectiveSubscription.latest_invoice)
    })
  );

  return false;
}

async function syncSubscriptionAndMembershipReminder(
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  const effectiveSubscription = await retireCardBackedTrialIfNeeded(stripe, subscription);
  const synced = await syncSubscriptionState(stripe, effectiveSubscription);
  const userId = effectiveSubscription.metadata.userId;

  if (synced && userId && effectiveSubscription.status !== "trialing") {
    await cancelTrialEndingReminderSafely(userId);
  }

  return synced;
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
        livemode: event.livemode,
        apiVersion: event.api_version
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
        if (
          session.payment_status === "paid" ||
          (subscription.status === "trialing" && subscription.metadata.trial === "three_day")
        ) {
          await syncSubscriptionAndMembershipReminder(stripe, subscription);
        } else {
          console.warn(
            JSON.stringify({
              level: "warn",
              route: "/api/stripe/webhook",
              message: "Checkout completed without paid funds or an active trial.",
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
      const subscriptionId = getInvoiceSubscriptionId(invoice);
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await updatePaidProfileIfInvoiceIsPaid(stripe, subscription);
      } else {
        console.warn(
          JSON.stringify({
            level: "warn",
            route: "/api/stripe/webhook",
            message: "Paid invoice has no supported subscription reference.",
            invoiceId: invoice.id,
            apiVersion: event.api_version
          })
        );
      }
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscriptionAndMembershipReminder(stripe, subscription);
    }

    if (event.type === "customer.subscription.trial_will_end") {
      await syncSubscriptionAndMembershipReminder(
        stripe,
        event.data.object as Stripe.Subscription
      );
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      await updateProfileFromSubscription(subscription, "free");
    }

    if (event.type === "invoice.payment_failed" || event.type === "invoice.finalization_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = getInvoiceSubscriptionId(invoice);
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
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
