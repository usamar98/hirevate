export const checkoutPlanKeys = [
  "gold_monthly",
  "platinum_annual"
] as const;

export type CheckoutPlanKey = (typeof checkoutPlanKeys)[number];
export type SubscriptionTier = "starter" | "silver" | "gold" | "platinum";
export type PublicSubscriptionTier = Extract<SubscriptionTier, "gold" | "platinum">;
export type BillingInterval = "day" | "week" | "month" | "year";

export const startTrialHref = "/signup?redirect=%2Fjobs";
export const trialDurationDays = 3;
export const trialReminderHoursBeforeEnd = 24;

export type PublicPricingOption = {
  key: CheckoutPlanKey;
  label: "Monthly" | "Annual";
  price: string;
  compareAtPrice?: string;
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
  name: "Monthly Plan" | "Annual Plan";
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
  "AI resume generation from a job link or pasted description",
  "Six professional resume templates with PDF export",
  "AI-assisted resume and company-specific cover-letter writing",
  "Resume-to-job match score and keyword gaps",
  "Application tracker for stages, follow-ups, interviews, and outcomes"
];

export const publicPricingPlans: PublicPricingPlan[] = [
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
        compareAtPrice: "$99",
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
  "Hirevate costs USD $24.99 per month or USD $69.99 per year. New accounts receive a limited 3-day trial with no payment card required. The trial ends automatically and does not become a paid subscription; users must actively choose a membership. Paid plans renew for the selected billing period until canceled.";

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
