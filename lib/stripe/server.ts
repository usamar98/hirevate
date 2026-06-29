import Stripe from "stripe";
import { env, hasStripeConfig } from "@/lib/env";
import { publicPricingPlans, type CheckoutPlanKey } from "@/lib/pricing";

let stripe: Stripe | null = null;

export function getStripe() {
  if (!hasStripeConfig()) return null;

  stripe ??= new Stripe(env.stripeSecretKey, {
    apiVersion: "2025-02-24.acacia"
  });

  return stripe;
}

export const stripePlans = Object.fromEntries(
  publicPricingPlans.flatMap((plan) =>
    plan.options.map((option) => [
      option.key,
      {
        name: option.schemaName,
        amount: option.amountCents,
        interval: option.interval,
        subscriptionStatus: plan.key
      }
    ])
  )
) as Record<
  CheckoutPlanKey,
  {
    name: string;
    amount: number;
    interval: "week" | "month";
    subscriptionStatus: "silver" | "gold" | "platinum";
  }
>;

export type StripePlanKey = CheckoutPlanKey;

export const resumeBuilderProduct = {
  key: "resume_builder",
  name: "Hirevate Resume Builder Export",
  amount: 100
} as const;
