import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import { Clock3, CreditCard, Globe2, KeyRound, LockKeyhole, LogOut, ShieldCheck, UserCheck, Users } from "lucide-react";
import { signInAdminHirevateAction, signOutAdminHirevateAction } from "@/app/actions/adminhirevate01";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAdminUsersDashboard, type AdminUserRow } from "@/lib/admin/users";
import { hasAdminHirevateSession, isAdminHirevateConfigured } from "@/lib/admin/password-session";
import { formatDate, formatRelativeDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Hirevate Private Admin",
  description: "Private Hirevate admin dashboard for user and subscription monitoring.",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";

type RawSearchParams = Record<string, string | string[] | undefined> | undefined;
type BadgeTone = "gray" | "blue" | "green" | "amber" | "red";

function readParam(searchParams: RawSearchParams, key: string) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] : value;
}

function StatCard({
  detail,
  icon: Icon,
  label,
  value
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="p-5">
      <Icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
      <p className="mt-4 text-sm font-semibold text-ink-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink-900">{value}</p>
      <p className="mt-1 text-sm text-ink-500">{detail}</p>
    </Card>
  );
}

function subscriptionTone(user: Pick<AdminUserRow, "planLabel" | "subscription_status">): BadgeTone {
  const status = user.subscription_status?.toLowerCase() ?? "free";

  if (["past_due", "unpaid", "canceled"].includes(status)) return "red";
  if (status === "trialing") return "amber";
  if (user.planLabel === "Paid") return "green";

  return "gray";
}

function shortenStripeId(value: string | null) {
  if (!value) return "Not attached";
  if (value.length <= 14) return value;

  return `${value.slice(0, 7)}...${value.slice(-6)}`;
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
            <p className="mt-1 text-sm text-ink-500">Monitor Hirevate users, logins, and paid plans.</p>
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
                Admin dashboard password is not configured yet. Add `ADMINHIREVATE01_PASSWORD` in
                Vercel Production environment variables, then redeploy.
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

function UserTable({ users }: { users: AdminUserRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
          <tr>
            <th className="px-5 py-3">User</th>
            <th className="px-5 py-3">Subscription</th>
            <th className="px-5 py-3">Stripe</th>
            <th className="px-5 py-3">Country</th>
            <th className="px-5 py-3">Joined</th>
            <th className="px-5 py-3">Last login</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-5 py-4">
                <p className="font-semibold text-ink-900">{user.full_name || "Unnamed user"}</p>
                <p className="text-ink-500">{user.email ?? "No email"}</p>
              </td>
              <td className="px-5 py-4">
                <Badge tone={subscriptionTone(user)}>{user.subscriptionLabel}</Badge>
                <p className="mt-2 text-xs text-ink-500">Status: {user.subscription_status || "free"}</p>
              </td>
              <td className="px-5 py-4 text-ink-600">
                <p>{shortenStripeId(user.stripe_subscription_id)}</p>
                <p className="mt-1 text-xs text-ink-400">{shortenStripeId(user.stripe_customer_id)}</p>
              </td>
              <td className="px-5 py-4 text-ink-700">
                {user.country_name || user.country_code || "Unknown"}
              </td>
              <td className="px-5 py-4 text-ink-500">{formatDate(user.created_at)}</td>
              <td className="px-5 py-4 text-ink-500">{formatRelativeDate(user.last_seen_at)}</td>
            </tr>
          ))}
          {users.length === 0 ? (
            <tr>
              <td className="px-5 py-8 text-center text-ink-500" colSpan={6}>
                No users found yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminHirevatePage({
  searchParams
}: {
  searchParams?: Promise<RawSearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const hasSession = await hasAdminHirevateSession();

  if (!hasSession) {
    return <LoginView error={readParam(resolvedSearchParams, "error")} />;
  }

  const dashboard = await getAdminUsersDashboard();
  const maxCountryCount = Math.max(...dashboard.countryStats.map((country) => country.total), 1);

  return (
    <section className="bg-gray-50 py-10">
      <div className="container-shell space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <Badge tone="blue">Private dashboard</Badge>
            <h1 className="mt-3 text-4xl font-semibold text-ink-900">Hirevate admin overview</h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-ink-500">
              See who logged in, which users are freemium or paid, and which subscription tier was
              purchased when Stripe checkout metadata is available.
            </p>
          </div>
          <form action={signOutAdminHirevateAction}>
            <Button type="submit" variant="outline">
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Lock dashboard
            </Button>
          </form>
        </div>

        {!dashboard.configured ? (
          <Card className="border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
            Supabase service role is not configured, so user and subscription analytics cannot load yet.
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            detail="Profiles created through Supabase auth"
            icon={Users}
            label="Registered users"
            value={dashboard.totalUsers}
          />
          <StatCard
            detail="Users with Silver, Gold, Platinum, or legacy paid status"
            icon={ShieldCheck}
            label="Paid users"
            value={dashboard.paidUsers}
          />
          <StatCard
            detail="Free accounts and unpaid users"
            icon={UserCheck}
            label="Freemium users"
            value={dashboard.freemiumUsers}
          />
          <StatCard
            detail="Users with a tracked last login timestamp"
            icon={Clock3}
            label="Logged in users"
            value={dashboard.loggedInUsers}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.25fr_0.85fr]">
          <Card className="overflow-hidden">
            <div className="border-b border-gray-100 p-5">
              <h2 className="text-xl font-semibold text-ink-900">Recent logins</h2>
              <p className="mt-1 text-sm text-ink-500">
                Users sorted by the latest `last_seen_at` timestamp captured on login.
              </p>
            </div>
            <UserTable users={dashboard.recentLogins} />
          </Card>

          <div className="space-y-5">
            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-ink-900">Subscriptions purchased</h2>
                  <p className="mt-1 text-sm text-ink-500">Current profile subscription status.</p>
                </div>
                <CreditCard className="h-5 w-5 text-brand-600" aria-hidden="true" />
              </div>
              <div className="mt-5 space-y-3">
                {dashboard.subscriptionStats.map((item) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-md border border-gray-100 bg-white px-3 py-3"
                    key={item.status}
                  >
                    <div>
                      <p className="font-semibold text-ink-900">{item.label}</p>
                      <p className="text-xs text-ink-500">
                        {item.paid} paid / {item.freemium} freemium
                      </p>
                    </div>
                    <Badge tone={item.paid > 0 ? "green" : "gray"}>{item.total}</Badge>
                  </div>
                ))}
                {dashboard.subscriptionStats.length === 0 ? (
                  <p className="text-sm leading-6 text-ink-500">No subscription data yet.</p>
                ) : null}
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-ink-900">Countries</h2>
                  <p className="mt-1 text-sm text-ink-500">Production geo data from signups/logins.</p>
                </div>
                <Globe2 className="h-5 w-5 text-brand-600" aria-hidden="true" />
              </div>
              <div className="mt-5 space-y-4">
                {dashboard.countryStats.slice(0, 8).map((country) => (
                  <div key={country.code}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <div>
                        <p className="font-semibold text-ink-900">{country.name}</p>
                        <p className="text-ink-500">
                          {country.paid} paid / {country.freemium} freemium
                        </p>
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
                  <p className="text-sm leading-6 text-ink-500">
                    Country data will appear after production users sign up or log in.
                  </p>
                ) : null}
              </div>
            </Card>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-gray-100 p-5">
            <h2 className="text-xl font-semibold text-ink-900">Recently registered users</h2>
            <p className="mt-1 text-sm text-ink-500">Latest 50 profiles, newest first.</p>
          </div>
          <UserTable users={dashboard.recentUsers} />
        </Card>
      </div>
    </section>
  );
}