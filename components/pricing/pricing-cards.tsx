"use client";

import { CalendarDays, Check, Clock3, Loader2, Trophy } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  checkoutPlanKeys,
  publicPricingPlans,
  type CheckoutPlanKey,
  type PublicSubscriptionTier
} from "@/lib/pricing";

const planIcons = {
  gold: CalendarDays,
  platinum: Trophy
} satisfies Record<PublicSubscriptionTier, typeof Trophy>;

const annualOfferWindowMs = 12 * 60 * 60 * 1000;
const annualOfferStorageKey = "hirevate-annual-offer-ends-at";

function formatTimeRemaining(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function AnnualOfferTimer() {
  const [remaining, setRemaining] = useState(annualOfferWindowMs);

  useEffect(() => {
    let offerEndsAt = Date.now() + annualOfferWindowMs;

    try {
      const storedValue = Number(window.localStorage.getItem(annualOfferStorageKey));
      if (Number.isFinite(storedValue) && storedValue > Date.now()) {
        offerEndsAt = storedValue;
      } else {
        window.localStorage.setItem(annualOfferStorageKey, String(offerEndsAt));
      }
    } catch {
      // The countdown still works when browser storage is unavailable.
    }

    function tick() {
      const now = Date.now();
      if (offerEndsAt <= now) {
        offerEndsAt = now + annualOfferWindowMs;
        try {
          window.localStorage.setItem(annualOfferStorageKey, String(offerEndsAt));
        } catch {
          // Continue with the in-memory rolling window.
        }
      }
      setRemaining(offerEndsAt - now);
    }

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold tabular-nums" role="timer">
      <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
      {formatTimeRemaining(remaining)}
    </span>
  );
}

export function PricingCards() {
  const searchParams = useSearchParams();
  const requestedPlan = searchParams.get("plan");
  const selectedPlan = checkoutPlanKeys.includes(requestedPlan as CheckoutPlanKey)
    ? (requestedPlan as CheckoutPlanKey)
    : null;
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
        const redirect = encodeURIComponent(`/pricing?plan=${plan}`);
        window.location.href = `/login?redirect=${redirect}`;
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
      {selectedPlan ? (
        <div className="mb-5 rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Your selected plan is ready below. Review it, then continue to secure checkout.
        </div>
      ) : null}
      <div className="mx-auto grid max-w-4xl items-stretch gap-4 md:grid-cols-2 md:pt-2">
        {publicPricingPlans.map((plan) => {
          const option = plan.options[0];
          const PlanIcon = planIcons[plan.key];

          if (!option) return null;

          return (
            <Card
              className={
                plan.highlighted
                  ? `relative flex min-h-[510px] flex-col border-black bg-black p-6 text-white shadow-[0_18px_45px_rgba(17,24,39,0.22)] lg:-translate-y-2 ${selectedPlan === option.key ? "ring-4 ring-blue-300" : ""}`
                  : `relative flex min-h-[510px] flex-col border-gray-200 bg-white p-6 text-ink-900 ${selectedPlan === option.key ? "ring-4 ring-blue-300" : ""}`
              }
              key={plan.key}
            >
              <Badge
                className={
                  plan.highlighted
                    ? "absolute right-5 top-5 border-white bg-white text-black"
                    : "absolute right-5 top-5 border-gray-200 bg-gray-100 text-ink-700"
                }
                tone="gray"
              >
                {plan.badge}
              </Badge>
              <div className="flex items-center gap-2 pr-28">
                <PlanIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <h2 className="text-xl font-semibold">{plan.name}</h2>
              </div>
              <p
                className={
                  plan.highlighted
                    ? "mt-3 min-h-[48px] text-sm leading-6 text-gray-300"
                    : "mt-3 min-h-[48px] text-sm leading-6 text-ink-500"
                }
              >
                {plan.description}
              </p>

              <ul
                className={
                  plan.highlighted
                    ? "mt-6 space-y-3 text-sm leading-6 text-gray-100"
                    : "mt-6 space-y-3 text-sm leading-6 text-ink-700"
                }
              >
                {plan.features.map((feature) => (
                  <li className="flex gap-2" key={feature}>
                    <Check
                      className={
                        plan.highlighted
                          ? "mt-1 h-4 w-4 shrink-0 text-white"
                          : "mt-1 h-4 w-4 shrink-0 text-black"
                      }
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-7">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-semibold leading-none">{option.displayPrice}</span>
                  <span
                    className={
                      plan.highlighted
                        ? "pb-1 text-sm font-medium text-gray-300"
                        : "pb-1 text-sm font-medium text-ink-500"
                    }
                  >
                    {option.displayCadence}
                  </span>
                </div>
                <p
                  className={
                    plan.highlighted
                      ? "mt-3 min-h-[24px] text-xs font-medium text-gray-300"
                      : "mt-3 min-h-[24px] text-xs font-medium text-ink-500"
                  }
                >
                  {option.billingDetail}
                </p>
                {option.compareAtPrice ? (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                    <span className="text-xs font-semibold">
                      <span className="mr-2 text-ink-500 line-through decoration-2">
                        {option.compareAtPrice}/yr
                      </span>
                      Annual offer
                    </span>
                    <AnnualOfferTimer />
                  </div>
                ) : null}
                <Button
                  className={
                    plan.highlighted
                      ? "mt-5 w-full border-white bg-white text-black shadow-none hover:bg-gray-100"
                      : "mt-5 w-full bg-black text-white hover:bg-gray-800"
                  }
                  disabled={loadingPlan === option.key}
                  onClick={() => startCheckout(option.key)}
                  variant={plan.highlighted ? "outline" : "secondary"}
                >
                  {loadingPlan === option.key ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  {option.cta}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
      <p className="mt-8 text-center text-xs font-medium text-ink-500">
        Cancel anytime | No hidden fees | Secured by Stripe
      </p>
    </div>
  );
}
