import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";
import { ensureUserProfile } from "@/lib/auth/ensure-profile";
import { getCurrentUser, getProfile } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { checkoutPlanKeys, trialCheckoutPlanKey, trialDurationDays } from "@/lib/pricing";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe, stripePlans, type StripePlanKey } from "@/lib/stripe/server";

const checkoutSchema = z.object({
  plan: z.enum([...checkoutPlanKeys] as [StripePlanKey, ...StripePlanKey[]]),
  trial: z.boolean().optional().default(false)
});

function getDatabaseErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") return { message: "Unknown profile error" };

  const databaseError = error as {
    code?: unknown;
    details?: unknown;
    hint?: unknown;
    message?: unknown;
  };

  return {
    code: typeof databaseError.code === "string" ? databaseError.code : undefined,
    details: typeof databaseError.details === "string" ? databaseError.details : undefined,
    hint: typeof databaseError.hint === "string" ? databaseError.hint : undefined,
    message:
      typeof databaseError.message === "string"
        ? databaseError.message
        : "Unknown profile error"
  };
}

async function getReusableCustomerId(stripe: Stripe, customerId: string | null | undefined) {
  if (!customerId) return undefined;

  try {
    const customer = await stripe.customers.retrieve(customerId);
    if ("deleted" in customer && customer.deleted) return undefined;

    return customer.id;
  } catch (error) {
    const stripeError = error as { statusCode?: number };
    if (stripeError.statusCode === 404) {
      return undefined;
    }

    throw error;
  }
}

async function saveCheckoutCustomer(
  userId: string,
  sessionCustomer: Stripe.Checkout.Session["customer"],
  existingCustomerId?: string | null
) {
  if (!sessionCustomer) return;

  const customerId = String(sessionCustomer);
  if (customerId === existingCustomerId) return;

  const admin = createSupabaseAdminClient();
  if (!admin) return;

  const { error } = await admin
    .from("profiles")
    .update({ stripe_customer_id: customerId })
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

async function hasPreviouslyUsedTrial(
  stripe: Stripe,
  userId: string,
  email: string,
  knownCustomerId?: string
) {
  const customerIds = new Set<string>();
  if (knownCustomerId) customerIds.add(knownCustomerId);

  const customers = await stripe.customers.list({ email, limit: 10 });
  for (const customer of customers.data) customerIds.add(customer.id);

  for (const customerId of customerIds) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 100
    });

    if (
      subscriptions.data.some(
        (subscription) =>
          subscription.metadata.userId === userId &&
          Boolean(subscription.trial_start || subscription.metadata.trial === "three_day")
      )
    ) {
      return true;
    }
  }

  return false;
}

export async function POST(request: Request) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const user = await getCurrentUser();
  if (!user?.email) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });
  }

  const { plan: planKey, trial } = parsed.data;
  if (trial && planKey !== trialCheckoutPlanKey) {
    return NextResponse.json(
      { error: "The 3-day trial is available with the Monthly Plan." },
      { status: 400 }
    );
  }

  try {
    const profilePrepared = await ensureUserProfile(user);
    if (!profilePrepared) {
      console.error("Checkout profile preparation is unavailable", {
        reason: "Supabase admin configuration is missing"
      });
      return NextResponse.json(
        { error: "Checkout is temporarily unavailable. Please contact support if this continues." },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error("Checkout profile preparation failed", getDatabaseErrorDetails(error));
    return NextResponse.json(
      { error: "Checkout is temporarily unavailable. Please contact support if this continues." },
      { status: 500 }
    );
  }

  const profile = await getProfile(user.id);
  let customerId: string | undefined;

  try {
    customerId = await getReusableCustomerId(stripe, profile?.stripe_customer_id);

    if (
      trial &&
      (profile?.stripe_trial_started_at ||
        (await hasPreviouslyUsedTrial(stripe, user.id, user.email, customerId)))
    ) {
      return NextResponse.json(
        {
          error:
            "This account has already used its free trial. Choose a paid plan to continue."
        },
        { status: 409 }
      );
    }
  } catch (error) {
    console.error("Stripe trial eligibility check failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      userId: user.id
    });
    return NextResponse.json(
      { error: "We could not verify trial eligibility. Please try again." },
      { status: 502 }
    );
  }

  const plan = stripePlans[planKey];

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      payment_method_types: ["card"],
      payment_method_collection: "always",
      customer_email: customerId ? undefined : user.email,
      client_reference_id: user.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: plan.amount,
            recurring: {
              interval: plan.interval
            },
            product_data: {
              name: `Hirevate ${plan.name}`
            }
          }
        }
      ],
      metadata: {
        userId: user.id,
        plan: planKey,
        trial: trial ? "three_day" : "none"
      },
      subscription_data: {
        ...(trial ? { trial_period_days: trialDurationDays } : {}),
        metadata: {
          userId: user.id,
          plan: planKey,
          trial: trial ? "three_day" : "none"
        }
      },
      ...(trial
        ? {
            custom_text: {
              submit: {
                message:
                  "Card required. You will not be charged today. Unless you cancel before the 3-day trial ends, your trial automatically converts to the Hirevate Monthly Plan and Stripe will attempt to charge USD $24.99. It then renews monthly until canceled. Manage or cancel from Account > Subscription."
              }
            }
          }
        : {}),
      success_url: `${env.appUrl}/dashboard?checkout=${trial ? "trial_started" : "processing"}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.appUrl}/pricing?checkout=cancelled`
    });

    await saveCheckoutCustomer(user.id, session.customer, profile?.stripe_customer_id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout session creation failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      plan: planKey,
      trial,
      userId: user.id
    });
    return NextResponse.json(
      { error: "Secure checkout could not be opened. Please try again." },
      { status: 502 }
    );
  }
}
