import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";
import { getCurrentUser, getProfile } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { checkoutPlanKeys } from "@/lib/pricing";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  getStripe,
  resumeBuilderProduct,
  stripePlans,
  type StripePlanKey
} from "@/lib/stripe/server";

const checkoutSchema = z.union([
  z.object({
    plan: z.enum([...checkoutPlanKeys] as [StripePlanKey, ...StripePlanKey[]])
  }),
  z.object({
    product: z.literal("resume_builder")
  })
]);

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

  await admin
    .from("profiles")
    .update({ stripe_customer_id: customerId })
    .eq("id", userId);
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

  const profile = await getProfile(user.id);
  const customerId = await getReusableCustomerId(stripe, profile?.stripe_customer_id);

  if ("product" in parsed.data) {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      client_reference_id: user.id,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: resumeBuilderProduct.amount,
            product_data: {
              name: resumeBuilderProduct.name
            }
          }
        }
      ],
      metadata: {
        userId: user.id,
        product: resumeBuilderProduct.key
      },
      success_url: `${env.appUrl}/resume-builder?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.appUrl}/resume-builder?checkout=cancelled`
    });

    await saveCheckoutCustomer(user.id, session.customer, profile?.stripe_customer_id);

    return NextResponse.json({ url: session.url });
  }

  const plan = stripePlans[parsed.data.plan];
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
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
      plan: parsed.data.plan
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        plan: parsed.data.plan
      }
    },
    success_url: `${env.appUrl}/dashboard?checkout=success`,
    cancel_url: `${env.appUrl}/pricing?checkout=cancelled`
  });

  await saveCheckoutCustomer(user.id, session.customer, profile?.stripe_customer_id);

  return NextResponse.json({ url: session.url });
}
