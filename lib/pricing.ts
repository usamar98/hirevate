export const checkoutPlanKeys = [
  "starter_daily",
  "silver_weekly",
  "gold_monthly",
  "platinum_annual"
] as const;

export type CheckoutPlanKey = (typeof checkoutPlanKeys)[number];
export type SubscriptionTier = "starter" | "silver" | "gold" | "platinum";
export type PublicSubscriptionTier = SubscriptionTier;
export type BillingInterval = "day" | "week" | "month" | "year";

export type PublicPricingOption = {
  key: CheckoutPlanKey;
  label: "Daily" | "Weekly" | "Monthly" | "Annual";
  price: string;
  displayPrice: string;
  displayCadence: "/day" | "/week";
  priceValue: string;
  amountCents: number;
  cadence: "/day" | "/week" | "/month" | "/year";
  interval: BillingInterval;
  cta: string;
  billingDetail: string;
  note?: string;
  summary: string;
  schemaName: string;
};

export type PublicPricingPlan = {
  key: PublicSubscriptionTier;
  name: "Daily Plan" | "Weekly Plan" | "Monthly Plan" | "Annual Plan";
  service: string;
  description: string;
  badge: string;
  highlighted?: boolean;
  homepagePrice: string;
  homepageDetail: string;
  options: PublicPricingOption[];
  features: string[];
};

const includedPaidFeatures = [
  "Complete job feed with Apply now links",
  "Advanced role, company, location, and freshness filters",
  "Six professional resume templates with PDF export",
  "AI-assisted resume and company-specific cover-letter writing",
  "Resume-to-job match score and keyword gaps",
  "Application tracker for stages, follow-ups, interviews, and outcomes"
];

export const publicPricingPlans: PublicPricingPlan[] = [
  {
    key: "starter",
    name: "Daily Plan",
    service: "One-day access",
    description: "For trying the complete Hirevate workflow with a low daily commitment.",
    badge: "Low commitment",
    homepagePrice: "$0.50/day",
    homepageDetail: "Billed daily. Cancel anytime.",
    options: [
      {
        key: "starter_daily",
        label: "Daily",
        price: "$0.50",
        displayPrice: "$0.50",
        displayCadence: "/day",
        priceValue: "0.50",
        amountCents: 50,
        cadence: "/day",
        interval: "day",
        cta: "Try 1 day - $0.50",
        billingDetail: "Billed $0.50 per day. Cancel anytime.",
        summary: "$0.50 per day",
        schemaName: "Hirevate Daily Plan"
      }
    ],
    features: includedPaidFeatures
  },
  {
    key: "silver",
    name: "Weekly Plan",
    service: "One-week access",
    description: "For a focused search sprint when you need fresh roles this week.",
    badge: "Weekly",
    homepagePrice: "$7.99/week",
    homepageDetail: "Billed weekly. Cancel anytime.",
    options: [
      {
        key: "silver_weekly",
        label: "Weekly",
        price: "$7.99",
        displayPrice: "$7.99",
        displayCadence: "/week",
        priceValue: "7.99",
        amountCents: 799,
        cadence: "/week",
        interval: "week",
        cta: "Try 1 week - $7.99",
        billingDetail: "Billed weekly. Cancel anytime.",
        summary: "$7.99 per week",
        schemaName: "Hirevate Weekly Plan"
      }
    ],
    features: includedPaidFeatures
  },
  {
    key: "gold",
    name: "Monthly Plan",
    service: "Full search cycle",
    description: "For an active search with time to find, prepare, apply, and follow up.",
    badge: "Recommended",
    homepagePrice: "$24.99/month",
    homepageDetail: "About $5.75 per week.",
    options: [
      {
        key: "gold_monthly",
        label: "Monthly",
        price: "$24.99",
        displayPrice: "~$5.75",
        displayCadence: "/week",
        priceValue: "24.99",
        amountCents: 2499,
        cadence: "/month",
        interval: "month",
        cta: "Continue - $24.99/mo",
        billingDetail: "Billed $24.99 per month. Cancel anytime.",
        summary: "$24.99 per month, approximately $5.75 per week",
        schemaName: "Hirevate Monthly Plan"
      }
    ],
    features: includedPaidFeatures,
    highlighted: true
  },
  {
    key: "platinum",
    name: "Annual Plan",
    service: "Best long-term value",
    description: "For an ongoing career search at the lowest equivalent weekly price.",
    badge: "Best value",
    homepagePrice: "$69.99/year",
    homepageDetail: "About $1.35 per week.",
    options: [
      {
        key: "platinum_annual",
        label: "Annual",
        price: "$69.99",
        displayPrice: "~$1.35",
        displayCadence: "/week",
        priceValue: "69.99",
        amountCents: 6999,
        cadence: "/year",
        interval: "year",
        cta: "Go annual - $69.99/yr",
        billingDetail: "Billed $69.99 per year. Cancel anytime.",
        summary: "$69.99 per year, approximately $1.35 per week",
        schemaName: "Hirevate Annual Plan"
      }
    ],
    features: includedPaidFeatures
  }
];

export const publicPricingFacts = publicPricingPlans.flatMap((plan) =>
  plan.options.map((option) => ({
    plan: plan.name,
    tier: plan.key,
    label: option.label,
    key: option.key,
    summary: option.summary,
    priceValue: option.priceValue,
    amountCents: option.amountCents,
    interval: option.interval,
    note: option.note
  }))
);

export const pricingSummary =
  "Hirevate costs $0.50 per day, $7.99 per week, $24.99 per month, or $69.99 per year. All plans are paid subscriptions and renew for the selected billing period until canceled.";

export function getPricingPlanForOption(key: CheckoutPlanKey) {
  const plan = publicPricingPlans.find((item) => item.options.some((option) => option.key === key));

  if (!plan) {
    throw new Error(`Unknown pricing plan: ${key}`);
  }

  return plan;
}

export function getPricingOption(key: CheckoutPlanKey) {
  const plan = getPricingPlanForOption(key);
  const option = plan.options.find((item) => item.key === key);

  if (!option) {
    throw new Error(`Unknown pricing option: ${key}`);
  }

  return option;
}
