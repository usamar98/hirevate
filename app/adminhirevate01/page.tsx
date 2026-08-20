import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowUpRight,
  BookmarkCheck,
  BriefcaseBusiness,
  CalendarClock,
  ChartNoAxesCombined,
  CircleDollarSign,
  CreditCard,
  Eye,
  Globe2,
  KeyRound,
  LockKeyhole,
  LogOut,
  MousePointerClick,
  ShieldCheck,
  UserRoundCheck,
  Users
} from "lucide-react";
import { signInAdminHirevateAction, signOutAdminHirevateAction } from "@/app/actions/adminhirevate01";
import {
  AdminApplicationFunnel,
  AdminGrowthChart,
  AdminPlanDistribution
} from "@/components/admin/admin-dashboard-charts";
import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAdminUsersDashboard } from "@/lib/admin/users";
import { hasAdminHirevateSession, isAdminHirevateConfigured } from "@/lib/admin/password-session";

export const metadata: Metadata = {
  title: "Hirevate Private Admin",
  description: "Private Hirevate operations, subscription, acquisition, and user dashboard.",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

type RawSearchParams = Record<string, string | string[] | undefined> | undefined;

function readParam(searchParams: RawSearchParams, key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] : value;
}

function formatPercent(value: number) {
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}

function StatCard({
  detail,
  icon: Icon,
  label,
  tone = "brand",
  value
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  tone?: "amber" | "brand" | "emerald" | "violet";
  value: string | number;
}) {
  const tones = {
    amber: "bg-amber-50 text-amber-700",
    brand: "bg-brand-50 text-brand-700",
    emerald: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700"
  };

  return (
    <Card className="p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[tone]}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <p className="mt-4 text-sm font-semibold text-ink-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink-900">{value}</p>
      <p className="mt-1 text-sm leading-5 text-ink-500">{detail}</p>
    </Card>
  );
}

function LoginView({ error }: { error: string | undefined }) {
  const configured = isAdminHirevateConfigured();
  const errorMessage =
    error === "invalid"
      ? "That admin password is not correct."
      : error === "not-configured"
        ? "Set ADMINHIREVATE01_PASSWORD in Vercel before using this dashboard."
        : null;

  return (
    <section className="min-h-[calc(100vh-72px)] bg-gray-50 py-14">
      <div className="container-shell max-w-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink-900 text-white shadow-soft">
            <LockKeyhole className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-ink-900">Private admin</h1>
            <p className="mt-1 text-sm text-ink-500">Secure operations and revenue dashboard.</p>
          </div>
        </div>

        <Card className="p-6">
          <form action={signInAdminHirevateAction} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-ink-900" htmlFor="admin-password">
                Admin password
              </label>
              <Input
                autoComplete="current-password"
                className="mt-2"
                disabled={!configured}
                id="admin-password"
                name="password"
                placeholder="Enter private dashboard password"
                required
                type="password"
              />
            </div>

            {errorMessage ? (
              <div className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {!configured ? (
              <div className="rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
                Add ADMINHIREVATE01_PASSWORD to the Vercel Production environment and redeploy.
              </div>
            ) : null}

            <Button className="w-full" disabled={!configured} type="submit">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              Unlock admin dashboard
            </Button>
          </form>
        </Card>
      </div>
    </section>
  );
}

export default async function AdminHirevatePage({
  searchParams
}: {
  searchParams?: Promise<RawSearchParams>;
}) {
  const [resolvedSearchParams, hasSession] = await Promise.all([
    searchParams,
    hasAdminHirevateSession()
  ]);

  if (!hasSession) {
    return <LoginView error={readParam(resolvedSearchParams, "error")} />;
  }

  const dashboard = await getAdminUsersDashboard();
  const maxCountryCount = Math.max(...dashboard.countryStats.map((country) => country.total), 1);

  return (
    <section className="min-h-screen bg-gray-50 py-10">
        <div className="container-shell space-y-8">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="blue">Private dashboard</Badge>
                <Badge tone={dashboard.stripeConfigured && !dashboard.stripeError ? "green" : "amber"}>
                  {dashboard.stripeConfigured && !dashboard.stripeError ? "Live Stripe data" : "Profile billing fallback"}
                </Badge>
              </div>
              <h1 className="mt-4 text-4xl font-semibold text-ink-900">Hirevate operations overview</h1>
              <p className="mt-3 max-w-3xl text-base leading-7 text-ink-500">
                Monitor acquisition, current billing lifecycle, cancellations, product activity,
                application outcomes, countries, and every registered account from one place.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild href="/jobs" variant="outline">
                Browse jobs
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <form action={signOutAdminHirevateAction}>
                <Button type="submit" variant="outline">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Log out
                </Button>
              </form>
            </div>
          </div>

          {!dashboard.configured ? (
            <Card className="border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
              Supabase service role is not configured, so account and product analytics cannot load.
            </Card>
          ) : null}
          {dashboard.configured && !dashboard.visitorTrackingConfigured ? (
            <Card className="border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
              Visitor tracking is unavailable. Apply the daily visitors migration to enable acquisition analytics.
            </Card>
          ) : null}
          {dashboard.stripeError ? (
            <Card className="border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
              Stripe could not be refreshed, so stored profile billing is shown as a fallback: {dashboard.stripeError}
            </Card>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <StatCard
              detail={`${dashboard.newUsersLast30Days} joined in the last 30 days`}
              icon={Users}
              label="Registered users"
              value={dashboard.totalUsers}
            />
            <StatCard
              detail={`${dashboard.endingSubscriptions} scheduled to cancel`}
              icon={ShieldCheck}
              label="Paying subscribers"
              tone="emerald"
              value={dashboard.paidUsers}
            />
            <StatCard
              detail="Paying subscribers divided by all accounts"
              icon={CircleDollarSign}
              label="Account conversion"
              tone="violet"
              value={formatPercent(dashboard.conversionRate)}
            />
            <StatCard
              detail={`${dashboard.overdueSubscriptions} payment issues need review`}
              icon={CalendarClock}
              label="Ending subscriptions"
              tone="amber"
              value={dashboard.endingSubscriptions}
            />
            <StatCard
              detail={`${dashboard.activeUsersLast30Days} accounts seen in 30 days`}
              icon={Activity}
              label="Accounts with login"
              value={dashboard.loggedInUsers}
            />
            <StatCard
              detail="Tracked by users across the workflow"
              icon={BriefcaseBusiness}
              label="Applications"
              tone="violet"
              value={dashboard.totalApplications}
            />
            <StatCard
              detail="Jobs currently available in the product"
              icon={ChartNoAxesCombined}
              label="Live jobs"
              tone="emerald"
              value={dashboard.liveJobs}
            />
            <StatCard
              detail="Jobs bookmarked by registered users"
              icon={BookmarkCheck}
              label="Saved jobs"
              value={dashboard.totalSavedJobs}
            />
            <StatCard
              detail="Unique consented visitors today (UTC)"
              icon={Eye}
              label="Visitors today"
              value={dashboard.todayVisitors}
            />
            <StatCard
              detail="Consented page views recorded today"
              icon={MousePointerClick}
              label="Page views today"
              value={dashboard.todayPageViews}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
            <Card className="p-5 lg:p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <h2 className="text-xl font-semibold text-ink-900">Acquisition and activity</h2>
                  <p className="mt-1 text-sm leading-6 text-ink-500">
                    Thirty-day comparison of new accounts, latest account activity, and consented visitors.
                  </p>
                </div>
                <Badge tone="blue">30 days</Badge>
              </div>
              <div className="mt-6">
                <AdminGrowthChart points={dashboard.growthTrend} />
              </div>
            </Card>

            <Card className="p-5 lg:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-ink-900">Current plans</h2>
                  <p className="mt-1 text-sm text-ink-500">Only current Monthly and Annual plans are named.</p>
                </div>
                <CreditCard className="h-5 w-5 text-brand-600" aria-hidden="true" />
              </div>
              <div className="mt-6">
                <AdminPlanDistribution items={dashboard.planStats} />
              </div>
            </Card>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <Card className="p-5 lg:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-ink-900">Billing lifecycle</h2>
                  <p className="mt-1 text-sm text-ink-500">Live Stripe state overrides stale profile values.</p>
                </div>
                <CreditCard className="h-5 w-5 text-brand-600" aria-hidden="true" />
              </div>
              <div className="mt-5 space-y-3">
                {dashboard.subscriptionStats.map((item) => (
                  <div className="flex items-center justify-between gap-3 rounded-md border border-gray-100 px-3 py-3" key={item.status}>
                    <div>
                      <p className="font-semibold text-ink-900">{item.label}</p>
                      <p className="text-xs text-ink-500">{item.paid} paying · {item.freemium} non-paying</p>
                    </div>
                    <Badge tone={item.status === "active" ? "green" : item.status === "ending" ? "amber" : "gray"}>
                      {item.total}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5 lg:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-ink-900">Application funnel</h2>
                  <p className="mt-1 text-sm text-ink-500">Aggregate tracker outcomes across accounts.</p>
                </div>
                <BriefcaseBusiness className="h-5 w-5 text-brand-600" aria-hidden="true" />
              </div>
              <div className="mt-6">
                <AdminApplicationFunnel items={dashboard.applicationFunnel} />
              </div>
            </Card>

            <Card className="p-5 lg:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-ink-900">Top countries</h2>
                  <p className="mt-1 text-sm text-ink-500">Signup and login geography.</p>
                </div>
                <Globe2 className="h-5 w-5 text-brand-600" aria-hidden="true" />
              </div>
              <div className="mt-5 space-y-4">
                {dashboard.countryStats.slice(0, 8).map((country) => (
                  <div key={country.code}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div>
                        <p className="font-semibold text-ink-900">{country.name}</p>
                        <p className="text-ink-500">{country.paid} paying · {country.freemium} other</p>
                      </div>
                      <span className="font-semibold text-ink-900">{country.total}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-brand-600"
                        style={{ width: `${Math.max(8, (country.total / maxCountryCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {dashboard.countryStats.length === 0 ? (
                  <p className="text-sm leading-6 text-ink-500">Country data appears after production signups or logins.</p>
                ) : null}
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-col justify-between gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-start">
              <div>
                <h2 className="text-xl font-semibold text-ink-900">Recent account activity</h2>
                <p className="mt-1 text-sm text-ink-500">Latest recorded login per account with live billing context.</p>
              </div>
              <Badge tone="blue"><UserRoundCheck className="mr-1 h-3.5 w-3.5" aria-hidden="true" />Latest 100</Badge>
            </div>
            <AdminUsersTable compact users={dashboard.recentLogins} />
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-gray-100 p-5">
              <h2 className="text-xl font-semibold text-ink-900">All registered accounts</h2>
              <p className="mt-1 text-sm text-ink-500">
                Search and filter every Supabase Auth account, including missing profile rows and Stripe cancellation state.
              </p>
            </div>
            <AdminUsersTable users={dashboard.recentUsers} />
          </Card>
        </div>
    </section>
  );
}
