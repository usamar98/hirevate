"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ResumeTestingError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="bg-gray-50 py-10">
      <div className="container-shell">
        <Card className="flex min-h-[52vh] flex-col items-center justify-center p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-5 text-3xl font-semibold text-ink-900">Resume testing could not load</h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-ink-500">
            The dashboard hit an unexpected issue. If you just deployed this feature, run the
            resume A/B testing migrations in Supabase and try again.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={reset}>Try again</Button>
            <Button asChild href="/dashboard" variant="outline">
              Dashboard
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
