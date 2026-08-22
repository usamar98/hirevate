"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ActivationResponse = {
  error?: string;
  ok?: boolean;
  status?: string;
};

export function TrialStarter({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  const startTrial = useCallback(async () => {
    setError(null);
    setIsStarting(true);

    try {
      const response = await fetch("/api/trial/start", {
        method: "POST",
        headers: { Accept: "application/json" }
      });
      const result = (await response.json().catch(() => ({}))) as ActivationResponse;

      if (response.status === 401) {
        router.replace(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
        return;
      }

      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "We could not start your free trial. Please try again.");
      }

      if (result.status !== "active") {
        setError("This account has already used its free trial. Choose a membership to continue.");
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch (activationError) {
      setError(
        activationError instanceof Error
          ? activationError.message
          : "We could not start your free trial. Please try again."
      );
    } finally {
      setIsStarting(false);
    }
  }, [redirectTo, router]);

  useEffect(() => {
    void startTrial();
  }, [startTrial]);

  return (
    <Card className="p-7 text-center">
      {error ? (
        <>
          <h1 className="text-2xl font-semibold text-ink-900">Free trial unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-ink-500" role="alert">
            {error}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button disabled={isStarting} onClick={() => void startTrial()}>
              {isStarting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Try again
            </Button>
            <Button asChild href="/pricing" variant="outline">
              View membership
            </Button>
          </div>
        </>
      ) : (
        <>
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            {isStarting ? (
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            )}
          </span>
          <h1 className="mt-5 text-2xl font-semibold text-ink-900">Starting your free trial</h1>
          <p className="mt-3 text-sm leading-6 text-ink-500" aria-live="polite">
            We are preparing your account. No payment card is required and the trial will not renew
            automatically.
          </p>
        </>
      )}
    </Card>
  );
}
