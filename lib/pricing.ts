export const checkoutPlanKeys = [
  "silver_weekly",
  "gold_weekly",
  "gold_monthly"
] as const;

export type CheckoutPlanKey = (typeof checkoutPlanKeys)[number];
export type SubscriptionTier = "silver" | "gold" | "platinum";
export type PublicSubscriptionTier = Exclude<SubscriptionTier, "platinum">;
export type BillingInterval = "week" | "month";

export type PublicPricingOption = {
  key: CheckoutPlanKey;
  label: "Weekly" | "Monthly";
  price: string;
  priceValue: string;
  amountCents: number;
  cadence: "/week" | "/month";
  interval: BillingInterval;
  cta: string;
  note?: string;
  summary: string;
  schemaName: string;
};

export type PublicPricingPlan = {
  key: PublicSubscriptionTier;
  name: "Job Search" | "Career Pro";
  service: string;
  description: string;
  badge: string;
  highlighted?: boolean;
  homepagePrice: string;
  homepageDetail: string;
  options: PublicPricingOption[];
  features: string[];
};

export const publicPricingPlans: PublicPricingPlan[] = [
  {
    key: "silver",
    name: "Job Search",
    service: "Focused search",
    description: "For a short, focused search sprint when you need fresh roles this week.",
    badge: "Weekly only",
    homepagePrice: "$4.99/wk",
    homepageDetail: "Weekly-only focused search",
    options: [
      {
        key: "silver_weekly",
        label: "Weekly",
        price: "$4.99",
        priceValue: "4.99",
        amountCents: 499,
        cadence: "/week",
        interval: "week",
        cta: "Start Job Search",
        summary: "$4.99 per week",
        schemaName: "Hirevate Job Search Weekly"
      }
    ],
    features: [
      "Fresh public-source job search",
      "Advanced role, company, location, and freshness filters",
      "Save jobs from detail pages",
      "Resume builder and cover letter builder",
      "Best for one active search week"
    ]
  },
  {
    key: "gold",
    name: "Career Pro",
    service: "Active search",
    description: "For ongoing applications with tracking, follow-ups, and better workflow control.",
    badge: "Popular",
    homepagePrice: "$8.99/wk",
    homepageDetail: "$25.17/month with 30% off",
    options: [
      {
        key: "gold_weekly",
        label: "Weekly",
        price: "$8.99",
        priceValue: "8.99",
        amountCents: 899,
        cadence: "/week",
        interval: "week",
        cta: "Start Career Pro weekly",
        summary: "$8.99 per week",
        schemaName: "Hirevate Career Pro Weekly"
      },
      {
        key: "gold_monthly",
        label: "Monthly",
        price: "$25.17",
        priceValue: "25.17",
        amountCents: 2517,
        cadence: "/month",
        interval: "month",
        cta: "Start Career Pro monthly",
        note: "30% off",
        summary: "$25.17 per month with 30% off compared with weekly billing",
        schemaName: "Hirevate Career Pro Monthly"
      }
    ],
    features: [
      "Everything in Job Search",
      "Application tracker with follow-up dates",
      "Track interested, applied, interview, offer, and rejected roles",
      "Saved jobs and clear apply-source workflow",
      "Best for a steady weekly application routine"
    ],
    highlighted: true
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
  "Job Search is $4.99 per week. Career Pro is $8.99 per week or $25.17 per month with 30% off compared with weekly billing.";

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
