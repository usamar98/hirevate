import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookmarkCheck, ClipboardList, CreditCard, FileText } from "lucide-react";
import { updateSuperLoginPlanAction } from "@/app/actions/super-login";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { JobCard } from "@/components/jobs/job-card";
import { isSuperLoginProfile } from "@/lib/auth/super-login";
import { getProfile, isPaidSubscription, requireUser } from "@/lib/auth/session";
import { getJobTrackerDashboard } from "@/lib/job-tracker/queries";
import { countSavedJobs, getSavedJobs } from "@/lib/jobs/queries";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false
  }
};

export default async function DashboardPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = await searchParams;
  const user = await requireUser();
  const [profile, savedCount, savedJobs, trackerDashboard] = await Promise.all([
    getProfile(user.id),
    countSavedJobs(user.id),
    getSavedJobs(user.id),
    getJobTrackerDashboard(user.id)
  ]);
  const recentSavedJobs = savedJobs.slice(0, 3).filter((item) => item.jobs);
  const status = profile?.subscription_status ?? "free";
  const isPaid = isPaidSubscription(status);
  const subscriptionLabel =
    status === "silver"
      ? "Weekly Plan"
      : status === "gold"
        ? "Monthly Plan"
        : status === "platinum"
          ? "Annual Plan"
          : isPaid
            ? "Paid subscription"
            : "No active plan";
  const checkoutSuccess = resolvedSearchParams?.checkout === "success";
  const superLoginPlan = resolvedSearchParams?.superLoginPlan;
  const superLoginError = resolvedSearchParams?.superLoginError;
  const isSuperLogin = isSuperLoginProfile(profile);

  return (
    <section className="bg-gray-50 py-10">
      <div className="container-shell space-y-8">
        {checkoutSuccess ? (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Checkout complete. Your subscription status will update as soon as Stripe confirms the
            payment.
          </div>
        ) : null}
        {superLoginPlan === "free" || superLoginPlan === "active" ? (
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            Super login is now testing {superLoginPlan === "active" ? "paid" : "unsubscribed"} access.
          </div>
        ) : null}
        {superLoginError === "not-configured" ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            Supabase service role is not configured, so the super login plan could not be changed.
          </div>
        ) : null}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-semibold text-ink-900">Dashboard</h1>
            <p className="mt-3 text-base leading-7 text-ink-500">
              Track subscription status, applications, saved roles, and job-search documents.
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
              <span className="text-2xl font-semibold text-ink-900">{subscriptionLabel}</span>
              <Badge tone={isPaid ? "green" : "gray"}>{isPaid ? "Active" : "Unsubscribed"}</Badge>
            </div>
            <Link className="mt-3 inline-flex text-sm font-semibold text-brand-700" href="/account/subscription">
              Manage billing
            </Link>
          </Card>
          <Card className="p-5">
            <BookmarkCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            <p className="mt-4 text-sm font-semibold text-ink-500">Saved jobs</p>
            <p className="mt-2 text-2xl font-semibold text-ink-900">{savedCount}</p>
          </Card>
          <Card className="p-5">
            <ClipboardList className="h-5 w-5 text-amber-600" aria-hidden="true" />
            <p className="mt-4 text-sm font-semibold text-ink-500">Job tracker</p>
            <Link
              href="/dashboard/job-tracker"
              className="mt-2 inline-flex text-base font-semibold text-brand-600"
            >
              {trackerDashboard.configured ? `${trackerDashboard.openCount} open roles` : "Set up tracker"}
            </Link>
          </Card>
          <Card className="p-5">
            <FileText className="h-5 w-5 text-violet-600" aria-hidden="true" />
            <p className="mt-4 text-sm font-semibold text-ink-500">Cover letters</p>
            <Link
              href="/cover-letter"
              className="mt-2 inline-flex text-base font-semibold text-brand-600"
            >
              Build one
            </Link>
          </Card>
        </div>

        {isSuperLogin ? (
          <Card className="border-amber-200 bg-amber-50 p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-semibold text-ink-900">Super login test mode</h2>
                <p className="mt-1 text-sm leading-6 text-ink-600">
                  Switch this account between unsubscribed limits and paid access without touching Stripe.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <form action={updateSuperLoginPlanAction}>
                  <input name="subscriptionStatus" type="hidden" value="free" />
                  <Button disabled={status === "free"} type="submit" variant="outline">
                    Test unsubscribed
                  </Button>
                </form>
                <form action={updateSuperLoginPlanAction}>
                  <input name="subscriptionStatus" type="hidden" value="active" />
                  <Button disabled={status !== "free"} type="submit">
                    Test paid
                  </Button>
                </form>
              </div>
            </div>
          </Card>
        ) : null}

        {status === "free" ? (
          <Card className="flex flex-col justify-between gap-4 border-brand-100 bg-brand-50 p-5 md:flex-row md:items-center">
            <div>
              <h2 className="text-lg font-semibold text-ink-900">Unlock unlimited hidden jobs</h2>
              <p className="mt-1 text-sm leading-6 text-ink-500">
                Unsubscribed accounts can preview 10 job detail pages per day and save 5 jobs.
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
                <JobCard canApply={isPaid} hasAccount isSaved job={item.jobs} key={item.id} />
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
