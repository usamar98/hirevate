import { NextResponse } from "next/server";
import { getCurrentUser, getProfile } from "@/lib/auth/session";
import { getStripe } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getCustomerId(customer: string | { id: string }) {
  return typeof customer === "string" ? customer : customer.id;
}

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const profile = await getProfile(user.id);
  if (!profile?.stripe_subscription_id) {
    return NextResponse.json({ error: "No active Stripe subscription was found." }, { status: 404 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Subscription management is not configured." }, { status: 503 });
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const customerId = getCustomerId(subscription.customer);

    if (profile.stripe_customer_id && customerId !== profile.stripe_customer_id) {
      return NextResponse.json({ error: "Subscription ownership could not be verified." }, { status: 403 });
    }

    if (subscription.status === "canceled") {
      return NextResponse.json({ error: "This subscription is already canceled." }, { status: 409 });
    }

    const updated = subscription.cancel_at_period_end
      ? subscription
      : await stripe.subscriptions.update(subscription.id, { cancel_at_period_end: true });

    return NextResponse.json({
      cancelAtPeriodEnd: updated.cancel_at_period_end,
      cancellationDate: new Date(updated.current_period_end * 1000).toISOString()
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to update the subscription. Please contact support." },
      { status: 502 }
    );
  }
}
