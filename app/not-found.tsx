import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="container-shell flex min-h-[68vh] flex-col items-center justify-center text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand-600">404</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-normal text-ink-900">This page moved out of view.</h1>
      <p className="mt-4 max-w-lg text-base leading-7 text-ink-500">
        The job or page you are looking for is not available. Try browsing the latest hidden jobs.
      </p>
      <Button asChild className="mt-8">
        <Link href="/jobs">Browse jobs</Link>
      </Button>
    </section>
  );
}
