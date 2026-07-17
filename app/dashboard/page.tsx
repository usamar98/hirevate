import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { updateSuperLoginPlanAction } from "@/app/actions/super-login";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { isSuperLoginProfile } from "@/lib/auth/super-login";
import { getProfile, requireUser } from "@/lib/auth/session";

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
  const profile = await getProfile(user.id);
  const status = profile?.subscription_status ?? "free";
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
              Find your next role here, then use the Account menu to manage your career workflow.
            </p>
          </div>
          <Button asChild href="/jobs">
            Browse jobs
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
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
      </div>
    </section>
  );
}
