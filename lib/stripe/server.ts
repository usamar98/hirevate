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
  silver_weekly: {
    name: "Silver Weekly",
    amount: 499,
    interval: "week" as const,
    subscriptionStatus: "silver"
  },
  gold_weekly: {
    name: "Gold Weekly",
    amount: 899,
    interval: "week" as const,
    subscriptionStatus: "gold"
  },
  gold_monthly: {
    name: "Gold Monthly",
    amount: 2517,
    interval: "month" as const,
    subscriptionStatus: "gold"
  },
  platinum_weekly: {
    name: "Platinum Weekly",
    amount: 1499,
    interval: "week" as const,
    subscriptionStatus: "platinum"
  },
  platinum_monthly: {
    name: "Platinum Monthly",
    amount: 4197,
    interval: "month" as const,
    subscriptionStatus: "platinum"
  }
};

export type StripePlanKey = keyof typeof stripePlans;

export const resumeBuilderProduct = {
  key: "resume_builder",
  name: "Hirevate Resume Builder Export",
  amount: 100
} as const;
