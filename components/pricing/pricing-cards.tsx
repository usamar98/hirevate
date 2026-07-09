"use client";

import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { publicPricingPlans, type CheckoutPlanKey } from "@/lib/pricing";

export function PricingCards() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startCheckout(plan: CheckoutPlanKey) {
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

      if (response.status === 401) {
        window.location.href = "/login?redirect=/pricing";
        return;
      }

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
        {publicPricingPlans.map((plan) => (
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
