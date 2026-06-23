"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
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
    <section className="container-shell flex min-h-[68vh] flex-col items-center justify-center text-center">
      <h1 className="text-4xl font-semibold tracking-normal text-ink-900">Something went sideways.</h1>
      <p className="mt-4 max-w-lg text-base leading-7 text-ink-500">
        We could not load this view. Please try again, or return to the jobs page.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild href="/jobs" variant="outline">
          Browse jobs
        </Button>
      </div>
    </section>
  );
}
