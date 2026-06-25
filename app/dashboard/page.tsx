import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookmarkCheck, CreditCard, FlaskConical, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JobCard } from "@/components/jobs/job-card";
import { getProfile, requireUser } from "@/lib/auth/session";
import { countSavedJobs, getSavedJobs } from "@/lib/jobs/queries";

export const metadata: Metadata = {
  title: "Dashboard"
};

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await requireUser();
  const [profile, savedCount, savedJobs] = await Promise.all([
    getProfile(user.id),
    countSavedJobs(user.id),
    getSavedJobs(user.id)
  ]);
  const recentSavedJobs = savedJobs.slice(0, 3).filter((item) => item.jobs);
  const status = profile?.subscription_status ?? "free";
  const checkoutSuccess = resolvedSearchParams?.checkout === "success";

  return (
    <section className="bg-gray-50 py-10">
      <div className="container-shell space-y-8">
        {checkoutSuccess ? (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Checkout complete. Your subscription status will update as soon as Stripe confirms the
            payment.
          </div>
        ) : null}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-semibold text-ink-900">Dashboard</h1>
            <p className="mt-3 text-base leading-7 text-ink-500">
              Track subscription status and quickly return to saved direct-apply roles.
            </p>
          </div>
          <Button asChild href="/jobs">
            Browse jobs
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="p-5">
            <CreditCard className="h-5 w-5 text-brand-600" aria-hidden="true" />
            <p className="mt-4 text-sm font-semibold text-ink-500">Subscription</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-2xl font-semibold capitalize text-ink-900">{status}</span>
              <Badge tone={status === "free" ? "gray" : "green"}>{status === "free" ? "Limited" : "Unlimited"}</Badge>
            </div>
          </Card>
          <Card className="p-5">
            <BookmarkCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            <p className="mt-4 text-sm font-semibold text-ink-500">Saved jobs</p>
            <p className="mt-2 text-2xl font-semibold text-ink-900">{savedCount}</p>
          </Card>
          <Card className="p-5">
            <Search className="h-5 w-5 text-amber-600" aria-hidden="true" />
            <p className="mt-4 text-sm font-semibold text-ink-500">Next action</p>
            <p className="mt-2 text-base font-semibold text-ink-900">Run a focused search</p>
          </Card>
          <Card className="p-5">
            <FlaskConical className="h-5 w-5 text-violet-600" aria-hidden="true" />
            <p className="mt-4 text-sm font-semibold text-ink-500">Resume testing</p>
            <Link
              href="/dashboard/resume-testing"
              className="mt-2 inline-flex text-base font-semibold text-brand-600"
            >
              Compare versions
            </Link>
          </Card>
        </div>

        {status === "free" ? (
          <Card className="flex flex-col justify-between gap-4 border-brand-100 bg-brand-50 p-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">Unlock unlimited hidden jobs</h2>
              <p className="mt-1 text-sm leading-6 text-ink-500">
                Free users can view 10 job detail pages per day and save 5 jobs.
              </p>
            </div>
            <Button asChild href="/pricing">
              Upgrade
            </Button>
          </Card>
        ) : null}

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-ink-900">Recently saved</h2>
            <Link href="/dashboard/saved" className="text-sm font-semibold text-brand-600">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentSavedJobs.map((item) =>
              item.jobs ? (
                <JobCard isSaved job={item.jobs} key={item.id} />
              ) : null
            )}
            {recentSavedJobs.length === 0 ? (
              <Card className="p-6 text-sm text-ink-500">
                No saved jobs yet. Browse the latest hidden jobs and save roles worth tracking.
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
