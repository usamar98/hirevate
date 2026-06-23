import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser, getProfile } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe, stripePlans } from "@/lib/stripe/server";

const checkoutSchema = z.object({
  plan: z.enum(["pro", "annual"])
});

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
    return NextResponse.json({ error: "Invalid checkout plan." }, { status: 400 });
  }

  const plan = stripePlans[parsed.data.plan];
  const profile = await getProfile(user.id);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: profile?.stripe_customer_id ?? undefined,
    customer_email: profile?.stripe_customer_id ? undefined : user.email,
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
            name: `Hirevate Hidden Jobs ${plan.name}`
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

  const admin = createSupabaseAdminClient();
  if (admin && session.customer && !profile?.stripe_customer_id) {
    await admin
      .from("profiles")
      .update({ stripe_customer_id: String(session.customer) })
      .eq("id", user.id);
  }

  return NextResponse.json({ url: session.url });
}
