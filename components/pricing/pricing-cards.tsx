"use client";

import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const plans = [
  {
    key: "free",
    name: "Free Search",
    service: "Hidden jobs",
    price: "$0",
    cadence: "",
    description: "Start with fresh direct-apply jobs and basic tracking.",
    features: [
      "Public job detail pages with direct apply links",
      "10 results per filtered search",
      "Save up to 5 jobs",
      "Resume and cover letter tools"
    ],
    cta: "Start Free"
  },
  {
    key: "resume_builder",
    name: "Resume Builder",
    service: "Resume tools",
    price: "Free",
    cadence: "testing mode",
    description: "Build a role-targeted resume before you apply.",
    features: [
      "ATS keyword score and missing keyword prompts",
      "Impact coach for stronger bullet points",
      "Precision, modern, and compact layouts",
      "Print-ready browser PDF export"
    ],
    cta: "Build resume"
  },
  {
    key: "pro",
    name: "Job Search Pro",
    service: "Active search",
    price: "$12",
    cadence: "/month",
    description: "For serious weekly search across hidden job sources.",
    features: [
      "Unlimited hidden job search results",
      "Unlimited saved jobs",
      "Remote, London, and engineering discovery pages",
      "Application tracker with follow-up dates",
      "Cover letter builder",
      "Direct company and public hiring sources"
    ],
    cta: "Upgrade monthly"
  },
  {
    key: "annual",
    name: "All Access Annual",
    service: "Best value",
    price: "$49",
    cadence: "/year",
    description: "The complete Hirevate workspace at the lowest yearly cost.",
    features: [
      "Everything in Job Search Pro",
      "Lowest cost for year-round job searching",
      "Unlimited saved jobs and direct-apply tracking",
      "Resume builder, cover letters, and job tracker",
      "Best fit for long search campaigns"
    ],
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
            <p className="text-xs font-semibold uppercase tracking-normal text-brand-600">{plan.service}</p>
            <h2 className="mt-2 text-lg font-semibold text-ink-900">{plan.name}</h2>
            <p className="mt-3 min-h-[48px] text-sm leading-6 text-ink-500">{plan.description}</p>
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
