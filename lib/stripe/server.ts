import Stripe from "stripe";
import { env, hasStripeConfig } from "@/lib/env";

let stripe: Stripe | null = null;

export function getStripe() {
  if (!hasStripeConfig()) return null;

  stripe ??= new Stripe(env.stripeSecretKey, {
    apiVersion: "2025-02-24.acacia"
  });

  return stripe;
}

export const stripePlans = {
  pro: {
    name: "Pro Monthly",
    amount: 1200,
    interval: "month" as const,
    subscriptionStatus: "pro"
  },
  annual: {
    name: "Annual",
    amount: 4900,
    interval: "year" as const,
    subscriptionStatus: "annual"
  }
};

export type StripePlanKey = keyof typeof stripePlans;
