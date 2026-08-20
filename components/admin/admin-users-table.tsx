"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { AdminUserRow, BillingLifecycle } from "@/lib/admin/users";
import { formatDate, formatRelativeDate } from "@/lib/utils";

type BadgeTone = "amber" | "blue" | "gray" | "green" | "red";
type FilterKey = "all" | "paid" | "ending" | "overdue" | "unsubscribed" | "admin";

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "ending", label: "Ending" },
  { key: "overdue", label: "Payment issue" },
  { key: "unsubscribed", label: "No subscription" },
  { key: "admin", label: "Admins" }
];

function lifecycleTone(lifecycle: BillingLifecycle): BadgeTone {
  if (lifecycle === "active") return "green";
  if (lifecycle === "trialing" || lifecycle === "ending") return "amber";
  if (lifecycle === "past_due" || lifecycle === "unpaid" || lifecycle === "canceled") return "red";
  if (lifecycle === "admin") return "blue";
  return "gray";
}

function accountTone(user: AdminUserRow): BadgeTone {
  if (user.accountType === "Administrator") return "blue";
  if (user.planLabel === "Paid") return "green";
  return "gray";
}

function shortenStripeId(value: string | null) {
  if (!value) return "Not attached";
  if (value.length <= 16) return value;
  return `${value.slice(0, 8)}…${value.slice(-6)}`;
}

function matchesFilter(user: AdminUserRow, filter: FilterKey) {
  if (filter === "paid") return user.planLabel === "Paid";
  if (filter === "ending") return user.billingLifecycle === "ending";
  if (filter === "overdue") return ["past_due", "unpaid"].includes(user.billingLifecycle);
  if (filter === "unsubscribed") return user.billingLifecycle === "unsubscribed";
  if (filter === "admin") return user.accountType === "Administrator";
  return true;
}

export function AdminUsersTable({
  compact = false,
  users
}: {
  compact?: boolean;
  users: AdminUserRow[];
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase());
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      if (!matchesFilter(user, filter)) return false;
      if (!deferredQuery) return true;
      const haystack = [
        user.full_name,
        user.email,
        user.country_name,
        user.country_code,
        user.stripe_customer_id,
        user.stripe_subscription_id
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase();
      return haystack.includes(deferredQuery);
    });
  }, [deferredQuery, filter, users]);
  const visibleUsers = compact ? filteredUsers.slice(0, 12) : filteredUsers;

  return (
    <div>
      <div className="flex flex-col gap-3 border-b border-gray-100 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-sm">
          <label className="sr-only" htmlFor={compact ? "recent-user-search" : "all-user-search"}>
            Search users
          </label>
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-ink-400" aria-hidden="true" />
          <Input
            className="pl-9"
            id={compact ? "recent-user-search" : "all-user-search"}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email, country, or Stripe ID"
            type="search"
            value={query}
          />
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Filter users">
          {filters.map((item) => (
            <button
              aria-pressed={filter === item.key}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                filter === item.key
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-gray-200 bg-white text-ink-600 hover:border-brand-200 hover:text-brand-700"
              }`}
              key={item.key}
              onClick={() => setFilter(item.key)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-gray-100 px-5 py-2 text-xs font-medium text-ink-500">
        Showing {visibleUsers.length} of {filteredUsers.length} matching accounts
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
            <tr>
              <th className="px-5 py-3">User</th>
              <th className="px-5 py-3">Access</th>
              <th className="px-5 py-3">Billing lifecycle</th>
              <th className="px-5 py-3">Stripe</th>
              <th className="px-5 py-3">Country</th>
              <th className="px-5 py-3">Joined</th>
              <th className="px-5 py-3">Last login</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {visibleUsers.map((user) => (
              <tr className="[content-visibility:auto]" key={user.id}>
                <td className="px-5 py-4">
                  <p className="font-semibold text-ink-900">{user.full_name || "Unnamed user"}</p>
                  <p className="text-ink-500">{user.email ?? "No email"}</p>
                  <p className="mt-1 text-xs text-ink-400">{user.authProvider}</p>
                </td>
                <td className="px-5 py-4">
                  <Badge tone={accountTone(user)}>{user.accountType}</Badge>
                  <p className="mt-2 text-xs text-ink-500">Role: {user.role || "user"}</p>
                </td>
                <td className="px-5 py-4">
                  <Badge tone={lifecycleTone(user.billingLifecycle)}>{user.subscriptionLabel}</Badge>
                  <p className="mt-2 text-xs text-ink-500">
                    Stripe: {user.stripeStatus ?? "not linked"} · Source: {user.billingSource}
                  </p>
                </td>
                <td className="px-5 py-4 font-mono text-xs text-ink-600">
                  <p title={user.stripe_subscription_id ?? undefined}>
                    {shortenStripeId(user.stripe_subscription_id)}
                  </p>
                  <p className="mt-1 text-ink-400" title={user.stripe_customer_id ?? undefined}>
                    {shortenStripeId(user.stripe_customer_id)}
                  </p>
                </td>
                <td className="px-5 py-4 text-ink-700">
                  {user.country_name || user.country_code || "Unknown"}
                </td>
                <td className="px-5 py-4 text-ink-500">{formatDate(user.created_at)}</td>
                <td className="px-5 py-4 text-ink-500">{formatRelativeDate(user.last_seen_at)}</td>
              </tr>
            ))}
            {visibleUsers.length === 0 ? (
              <tr>
                <td className="px-5 py-10 text-center text-ink-500" colSpan={7}>
                  No accounts match the current search and filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
