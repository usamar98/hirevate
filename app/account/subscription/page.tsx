import type { Metadata } from "next";
import type Stripe from "stripe";
import Link from "next/link";
import { CalendarClock, CreditCard } from "lucide-react";
import { CancelSubscriptionButton } from "@/components/billing/cancel-subscription-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  getFreeTrialEndsAt,
  getProfile,
  hasActiveFreeTrial,
  hasPremiumAccess,
  hasProductAccess,
  requireUser
} from "@/lib/auth/session";
import { getStripe } from "@/lib/stripe/server";
import {
  reconcilePaidSubscriptionForUser,
  syncSubscriptionState
} from "@/lib/stripe/subscription-sync";

export const metadata: Metadata = {
  title: "Account Subscription",
  description: "View and cancel your Hirevate subscription.",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

function planLabel(status: string | null | undefined) {
  if (status === "gold") return "Monthly Plan";
  if (status === "platinum") return "Annual Plan";
  if (status === "starter" || status === "silver") return "Legacy subscription";
  if (status === "free") return "No active plan";
  return status ? "Paid subscription" : "No active plan";
}

function formatBillingDate(timestamp: number | null) {
  if (!timestamp) return null;
  return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(timestamp * 1000));
}

export default async function AccountSubscriptionPage() {
  const user = await requireUser("/account/subscription");
  let profile = await getProfile(user.id);
  const stripe = getStripe();
  let repairedSubscription: Stripe.Subscription | null = null;
  let subscriptionUnavailable = false;

  if (
    stripe &&
    user.email &&
    (!hasProductAccess(profile) || !profile?.stripe_subscription_id)
  ) {
    try {
      const repaired = await reconcilePaidSubscriptionForUser(
        stripe,
        user.id,
        user.email,
        profile?.stripe_customer_id
      );

      if (repaired && profile) {
        repairedSubscription = repaired.subscription;
        profile = {
          ...profile,
          subscription_status: repaired.paidStatus,
          stripe_customer_id: String(repaired.subscription.customer),
          stripe_subscription_id: repaired.subscription.id,
          stripe_subscription_status: repaired.subscription.status,
          subscription_current_period_end: repaired.subscription.current_period_end
            ? new Date(repaired.subscription.current_period_end * 1000).toISOString()
            : null
        };
      }
    } catch {
      subscriptionUnavailable = true;
    }
  }

  let isPaid = hasPremiumAccess(profile);
  let cancellationScheduled = false;
  let periodEnd: string | null = null;
  let stripeStatus: string | null = null;

  if (stripe && profile?.stripe_subscription_id) {
    try {
      const subscription =
        repairedSubscription ?? (await stripe.subscriptions.retrieve(profile.stripe_subscription_id));
      cancellationScheduled = subscription.cancel_at_period_end;
      periodEnd = formatBillingDate(subscription.current_period_end);
      stripeStatus = subscription.status;

      if (
        profile.stripe_subscription_status !== subscription.status ||
        profile.subscription_cancel_at_period_end !== subscription.cancel_at_period_end ||
        (hasProductAccess(profile) && !["active", "trialing"].includes(subscription.status))
      ) {
        await syncSubscriptionState(stripe, subscription);
        profile = await getProfile(user.id);
        isPaid = hasPremiumAccess(profile);
      }
    } catch {
      subscriptionUnavailable = true;
    }
  }

  const isFreeTrialActive = !isPaid && hasActiveFreeTrial(profile);
  const freeTrialEndsAt = getFreeTrialEndsAt(profile);

  return (
    <section className="bg-gray-50 py-12">
      <div className="container-shell max-w-3xl">
        <Link className="text-sm font-semibold text-brand-700" href="/jobs">
          Jobs
        </Link>
        <h1 className="mt-3 text-4xl font-semibold text-ink-900">Account subscription</h1>
        <p className="mt-3 text-base leading-7 text-ink-500">
          Review billing status and stop future renewals without losing access already paid for.
        </p>

        <Card className="mt-8 p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-brand-600" aria-hidden="true" />
                <h2 className="text-xl font-semibold text-ink-900">
                  {isFreeTrialActive ? "3-day free trial" : planLabel(profile?.subscription_status)}
                </h2>
              </div>
              <p className="mt-2 text-sm text-ink-500">{user.email}</p>
            </div>
            <Badge
              tone={cancellationScheduled ? "amber" : isPaid || isFreeTrialActive ? "green" : "gray"}
            >
              {cancellationScheduled
                ? "ending"
                : isPaid
                  ? stripeStatus ?? "active"
                  : isFreeTrialActive
                    ? "active"
                    : "unsubscribed"}
            </Badge>
          </div>

          {isFreeTrialActive && freeTrialEndsAt ? (
            <div className="mt-6 flex gap-3 rounded-md border border-brand-100 bg-brand-50 p-4">
              <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  Free trial ends {new Intl.DateTimeFormat("en", { dateStyle: "long", timeStyle: "short" }).format(freeTrialEndsAt)}
                </p>
                <p className="mt-1 text-sm leading-6 text-ink-500">
                  No payment method is required, and no membership starts automatically. We send
                  a reminder about 24 hours before the trial ends so you can choose a plan if you
                  want to continue.
                </p>
              </div>
            </div>
          ) : null}

          {periodEnd && !isFreeTrialActive ? (
            <div className="mt-6 flex gap-3 rounded-md border border-gray-100 bg-gray-50 p-4">
              <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-ink-500" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  {cancellationScheduled ? "Access ends" : "Current period ends"} {periodEnd}
                </p>
                <p className="mt-1 text-sm leading-6 text-ink-500">
                  {cancellationScheduled
                    ? "Cancellation is scheduled and future renewals are stopped."
                    : "Cancel below to stop renewal at the end of this period."}
                </p>
              </div>
            </div>
          ) : null}

          {subscriptionUnavailable ? (
            <div className="mt-5 rounded-md border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Billing status is temporarily unavailable. No account change was made.
            </div>
          ) : null}

          <div className="mt-6">
            {(isPaid || isFreeTrialActive) &&
            profile?.stripe_subscription_id &&
            !cancellationScheduled ? (
              <CancelSubscriptionButton />
            ) : null}
            {!isPaid ? (
              <Button asChild href="/pricing">
                {isFreeTrialActive ? "Start membership" : "View paid plans"}
              </Button>
            ) : null}
          </div>
        </Card>

        <p className="mt-6 text-sm leading-6 text-ink-500">
          Review the{" "}
          <Link className="font-semibold text-brand-700" href="/legal/subscription-terms">
            subscription terms
          </Link>{" "}
          and{" "}
          <Link className="font-semibold text-brand-700" href="/legal/eu-withdrawal-refund-policy">
            EU withdrawal policy
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
