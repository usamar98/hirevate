"use client";

import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const plans = [
  {
    key: "free",
    name: "Free",
    price: "$0",
    cadence: "",
    features: ["View 10 jobs/day", "Save 5 jobs", "Direct apply links"],
    cta: "Start Free"
  },
  {
    key: "resume_builder",
    name: "Resume Builder",
    price: "$2",
    cadence: "/resume",
    features: ["ATS scoring", "Keyword targeting", "Print-ready PDF export"],
    cta: "Build resume"
  },
  {
    key: "pro",
    name: "Pro Monthly",
    price: "$12",
    cadence: "/month",
    features: ["Unlimited job views", "Unlimited saved jobs", "Fresh job filters"],
    cta: "Upgrade monthly"
  },
  {
    key: "annual",
    name: "Annual",
    price: "$49",
    cadence: "/year",
    features: ["Same as Pro", "Best value pricing", "Fresh job filters"],
    cta: "Upgrade annual",
    bestValue: true
  }
];

export function PricingCards({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function startResumeCheckout() {
    window.location.href = "/resume-builder";
  }

  async function startCheckout(plan: "pro" | "annual") {
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
      <div className="grid gap-4 lg:grid-cols-4">
        {plans.map((plan) => (
          <Card
            className={plan.bestValue ? "relative border-amber-200 p-6 shadow-soft" : "p-6"}
            key={plan.key}
          >
            {plan.bestValue ? (
              <Badge className="absolute right-5 top-5" tone="amber">
                Best value
              </Badge>
            ) : null}
            <h2 className="text-lg font-semibold text-ink-900">{plan.name}</h2>
            <div className="mt-5 flex items-end gap-1">
              <span className="text-4xl font-semibold text-ink-900">{plan.price}</span>
              <span className="pb-1 text-sm font-medium text-ink-500">{plan.cadence}</span>
            </div>
            <ul className="mt-6 space-y-3 text-sm text-ink-700">
              {plan.features.map((feature) => (
                <li className="flex gap-2" key={feature}>
                  <Check className="mt-0.5 h-4 w-4 text-emerald-600" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {plan.key === "free" ? (
              <Button asChild href={isLoggedIn ? "/jobs" : "/signup"} className="mt-7 w-full" variant="outline">
                {plan.cta}
              </Button>
            ) : plan.key === "resume_builder" ? (
              <Button className="mt-7 w-full" onClick={startResumeCheckout} variant="outline">
                {plan.cta}
              </Button>
            ) : (
              <Button
                className="mt-7 w-full"
                disabled={loadingPlan === plan.key}
                onClick={() => startCheckout(plan.key as "pro" | "annual")}
              >
                {loadingPlan === plan.key ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                {plan.cta}
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
