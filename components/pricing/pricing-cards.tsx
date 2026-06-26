"use client";

import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type CheckoutPlanKey =
  | "silver_weekly"
  | "gold_weekly"
  | "gold_monthly"
  | "platinum_weekly"
  | "platinum_monthly";

type PricingPlan = {
  key: string;
  name: string;
  service: string;
  description: string;
  badge: string;
  highlighted?: boolean;
  options: Array<{
    key: CheckoutPlanKey;
    label: string;
    price: string;
    cadence: string;
    cta: string;
    note?: string;
  }>;
  features: string[];
};

const plans: PricingPlan[] = [
  {
    key: "silver",
    name: "Silver",
    service: "Focused search",
    description: "For a short, focused search sprint when you need fresh roles this week.",
    badge: "Weekly only",
    options: [
      {
        key: "silver_weekly",
        label: "Weekly",
        price: "$4.99",
        cadence: "/week",
        cta: "Start Silver"
      }
    ],
    features: [
      "Fresh direct-apply job search",
      "Advanced role, company, location, and freshness filters",
      "Save jobs from detail pages",
      "Resume builder and cover letter builder",
      "Best for one active search week"
    ]
  },
  {
    key: "gold",
    name: "Gold",
    service: "Active search",
    description: "For ongoing applications with tracking, follow-ups, and better workflow control.",
    badge: "Popular",
    options: [
      {
        key: "gold_weekly",
        label: "Weekly",
        price: "$8.99",
        cadence: "/week",
        cta: "Start Gold weekly"
      },
      {
        key: "gold_monthly",
        label: "Monthly",
        price: "$25.17",
        cadence: "/month",
        cta: "Start Gold monthly",
        note: "30% off"
      }
    ],
    features: [
      "Everything in Silver",
      "Application tracker with follow-up dates",
      "Track interested, applied, interview, offer, and rejected roles",
      "Saved jobs and direct apply workflow",
      "Best for a steady weekly application routine"
    ],
    highlighted: true
  },
  {
    key: "platinum",
    name: "Platinum",
    service: "Full search system",
    description: "For serious campaigns where every role, document, and follow-up needs structure.",
    badge: "Highest tier",
    options: [
      {
        key: "platinum_weekly",
        label: "Weekly",
        price: "$14.99",
        cadence: "/week",
        cta: "Start Platinum weekly"
      },
      {
        key: "platinum_monthly",
        label: "Monthly",
        price: "$41.97",
        cadence: "/month",
        cta: "Start Platinum monthly",
        note: "30% off"
      }
    ],
    features: [
      "Everything in Gold",
      "Full job tracker and follow-up queue",
      "Resume builder plus targeted cover letters",
      "Best for high-volume interview pipelines",
      "Best fit for aggressive search campaigns"
    ]
  }
];

export function PricingCards({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: CheckoutPlanKey) {
    if (!isLoggedIn) {
      window.location.href = "/login?redirect=/pricing";
      return;
    }

    setLoadingPlan(plan);
    setError(null);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ plan })
      });
      const payload = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !payload.url) {
        setError(payload.error ?? "Unable to start checkout.");
        return;
      }

      window.location.href = payload.url;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout.");
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <div>
      {error ? (
        <div className="mb-5 rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card
            className={plan.highlighted ? "relative border-amber-200 p-6 shadow-soft" : "relative p-6"}
            key={plan.key}
          >
            <Badge className="absolute right-5 top-5" tone={plan.highlighted ? "amber" : "blue"}>
              {plan.badge}
            </Badge>
            <p className="text-xs font-semibold uppercase tracking-normal text-brand-600">{plan.service}</p>
            <h2 className="mt-2 text-lg font-semibold text-ink-900">{plan.name}</h2>
            <p className="mt-3 min-h-[72px] text-sm leading-6 text-ink-500">{plan.description}</p>
            <div className="mt-5 grid gap-3">
              {plan.options.map((option) => (
                <div className="rounded-md border border-gray-200 bg-gray-50 p-4" key={option.key}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink-700">{option.label}</p>
                      {option.note ? (
                        <p className="mt-1 text-xs font-semibold text-emerald-700">{option.note}</p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-semibold text-ink-900">{option.price}</span>
                      <span className="ml-1 text-sm font-medium text-ink-500">{option.cadence}</span>
                    </div>
                  </div>
                  <Button
                    className="mt-4 w-full"
                    disabled={loadingPlan === option.key}
                    onClick={() => startCheckout(option.key)}
                    variant={plan.highlighted ? "primary" : "outline"}
                  >
                    {loadingPlan === option.key ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : null}
                    {option.cta}
                  </Button>
                </div>
              ))}
            </div>
            <ul className="mt-6 space-y-3 text-sm text-ink-700">
              {plan.features.map((feature) => (
                <li className="flex gap-2" key={feature}>
                  <Check className="mt-0.5 h-4 w-4 text-emerald-600" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
