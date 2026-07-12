"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CancelSubscriptionButton() {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cancelSubscription() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/subscription/cancel", { method: "POST" });
      const payload = (await response.json()) as {
        cancellationDate?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Unable to cancel the subscription.");
        return;
      }

      const cancellationDate = payload.cancellationDate
        ? new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(
            new Date(payload.cancellationDate)
          )
        : "the end of the current billing period";

      setMessage(`Cancellation scheduled for ${cancellationDate}. Paid access remains available until then.`);
      setConfirming(false);
      router.refresh();
    } catch {
      setError("Unable to cancel the subscription. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (message) {
    return (
      <div className="rounded-md border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-800">
        {message}
      </div>
    );
  }

  return (
    <div>
      {confirming ? (
        <div className="rounded-md border border-red-100 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-900">Cancel at the end of this billing period?</p>
          <p className="mt-1 text-sm leading-6 text-red-700">
            Future renewals will stop. Your paid access will continue through the period already paid.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button disabled={loading} onClick={() => void cancelSubscription()} type="button" variant="danger">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Confirm cancellation
            </Button>
            <Button disabled={loading} onClick={() => setConfirming(false)} type="button" variant="outline">
              Keep subscription
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setConfirming(true)} type="button" variant="outline">
          Cancel subscription
        </Button>
      )}
      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
