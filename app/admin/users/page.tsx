import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import { Globe2, ShieldCheck, UserCheck, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAdminUsersDashboard } from "@/lib/admin/users";
import { requireAdmin } from "@/lib/auth/session";
import { formatDate, formatRelativeDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Users",
  robots: {
    index: false,
    follow: false
  }
};

export const dynamic = "force-dynamic";
const adminUsersPath = "/admin/users";

function StatCard({
  icon: Icon,
  label,
  value,
  detail
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  detail: string;
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

export default async function AdminUsersPage() {
  await requireAdmin(adminUsersPath);
  const dashboard = await getAdminUsersDashboard();
  const maxCountryCount = Math.max(...dashboard.countryStats.map((country) => country.total), 1);

  return (
    <section className="bg-gray-50 py-10">
      <div className="container-shell space-y-8">
        <div>
          <h1 className="text-4xl font-semibold text-ink-900">User analytics</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-ink-500">
            Monitor registered users, paid vs freemium status, and signup country signals captured
            from production request geography.
          </p>
        </div>

        {!dashboard.configured ? (
          <Card className="border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
            Supabase service role is not configured, so admin user analytics cannot load yet.
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Users}
            label="Registered users"
            value={dashboard.totalUsers}
            detail="Profiles created from Supabase auth"
          />
          <StatCard
            icon={ShieldCheck}
            label="Paid users"
            value={dashboard.paidUsers}
            detail="Active Pro, Annual, or paid statuses"
          />
          <StatCard
            icon={UserCheck}
            label="Freemium users"
            value={dashboard.freemiumUsers}
            detail="Free accounts and unpaid users"
          />
          <StatCard
            icon={Globe2}
            label="Known countries"
            value={dashboard.knownCountryUsers}
            detail="Captured from Vercel geo headers"
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.4fr]">
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-ink-900">Users by country</h2>
                <p className="mt-1 text-sm text-ink-500">New signups and logins update this view.</p>
              </div>
              <Badge tone="blue">{dashboard.countryStats.length} regions</Badge>
            </div>

            <div className="mt-5 space-y-4">
              {dashboard.countryStats.length ? (
                dashboard.countryStats.map((country) => (
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
                ))
              ) : (
                <p className="text-sm leading-6 text-ink-500">
                  No country data yet. It will appear as users sign up or log in on production.
                </p>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-gray-100 p-5">
              <h2 className="text-xl font-semibold text-ink-900">Recent registered users</h2>
              <p className="mt-1 text-sm text-ink-500">Latest 50 profiles, newest first.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100 text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Plan</th>
                    <th className="px-5 py-3">Country</th>
                    <th className="px-5 py-3">Joined</th>
                    <th className="px-5 py-3">Last seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {dashboard.recentUsers.map((user) => (
                    <tr key={user.id}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-ink-900">{user.full_name || "Unnamed user"}</p>
                        <p className="text-ink-500">{user.email ?? "No email"}</p>
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={user.planLabel === "Paid" ? "green" : "gray"}>
                          {user.planLabel}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-ink-700">
                        {user.country_name || user.country_code || "Unknown"}
                      </td>
                      <td className="px-5 py-4 text-ink-500">{formatDate(user.created_at)}</td>
                      <td className="px-5 py-4 text-ink-500">{formatRelativeDate(user.last_seen_at)}</td>
                    </tr>
                  ))}
                  {dashboard.recentUsers.length === 0 ? (
                    <tr>
                      <td className="px-5 py-8 text-center text-ink-500" colSpan={5}>
                        No registered users yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card className="p-5 text-sm leading-6 text-ink-500">
          Country data is based on production request headers such as `x-vercel-ip-country`.
          Existing users may show as unknown until they log in again after this release.
        </Card>
      </div>
    </section>
  );
}
