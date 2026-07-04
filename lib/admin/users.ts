import { isPaidSubscription } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/database";

export type AdminUserRow = Profile & {
  planLabel: "Paid" | "Freemium";
  subscriptionLabel: string;
};

export type CountryStat = {
  code: string;
  name: string;
  total: number;
  paid: number;
  freemium: number;
};

export type SubscriptionStat = {
  status: string;
  label: string;
  total: number;
  paid: number;
  freemium: number;
};

function normalizeSubscriptionStatus(status: string | null | undefined) {
  return status?.trim().toLowerCase() || "free";
}

export function getSubscriptionLabel(status: string | null | undefined) {
  const normalized = normalizeSubscriptionStatus(status);
  const labels: Record<string, string> = {
    active: "Paid subscription",
    annual: "Annual legacy plan",
    canceled: "Canceled",
    free: "Free account",
    gold: "Gold",
    past_due: "Past due",
    platinum: "Platinum",
    pro: "Pro legacy plan",
    silver: "Silver",
    trialing: "Trialing paid plan",
    unpaid: "Unpaid"
  };

  if (labels[normalized]) return labels[normalized];

  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getCountryName(code: string | null | undefined, storedName: string | null | undefined) {
  if (storedName && storedName !== code) return storedName;
  if (!code) return "Unknown";

  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

function getTimestamp(value: string | null | undefined) {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

async function listAuthUserMetadata(admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>) {
  const metadata = new Map<string, { countryCode: string | null; countryName: string | null }>();
  let page = 1;

  while (page <= 10) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) break;

    for (const user of data.users) {
      metadata.set(user.id, {
        countryCode:
          typeof user.user_metadata.country_code === "string"
            ? user.user_metadata.country_code.toUpperCase()
            : null,
        countryName:
          typeof user.user_metadata.country_name === "string" ? user.user_metadata.country_name : null
      });
    }

    if (data.users.length < 1000) break;
    page += 1;
  }

  return metadata;
}

export async function getAdminUsersDashboard() {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return {
      configured: false,
      totalUsers: 0,
      paidUsers: 0,
      freemiumUsers: 0,
      loggedInUsers: 0,
      knownCountryUsers: 0,
      countryStats: [] as CountryStat[],
      subscriptionStats: [] as SubscriptionStat[],
      recentUsers: [] as AdminUserRow[],
      recentLogins: [] as AdminUserRow[]
    };
  }

  const { data, error } = await admin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const authMetadata = await listAuthUserMetadata(admin);
  const users = ((data ?? []) as Profile[]).map((profile) => {
    const metadata = authMetadata.get(profile.id);
    const planLabel = isPaidSubscription(profile.subscription_status) ? "Paid" : "Freemium";

    return {
      ...profile,
      country_code: profile.country_code ?? metadata?.countryCode ?? null,
      country_name: profile.country_name ?? metadata?.countryName ?? null,
      planLabel,
      subscriptionLabel: getSubscriptionLabel(profile.subscription_status)
    };
  }) satisfies AdminUserRow[];

  const paidUsers = users.filter((user) => user.planLabel === "Paid").length;
  const countryMap = new Map<string, CountryStat>();
  const subscriptionMap = new Map<string, SubscriptionStat>();

  for (const user of users) {
    const code = user.country_code ?? "unknown";
    const existingCountry =
      countryMap.get(code) ??
      {
        code,
        name: getCountryName(user.country_code, user.country_name),
        total: 0,
        paid: 0,
        freemium: 0
      };

    existingCountry.total += 1;
    if (user.planLabel === "Paid") {
      existingCountry.paid += 1;
    } else {
      existingCountry.freemium += 1;
    }

    countryMap.set(code, existingCountry);

    const status = normalizeSubscriptionStatus(user.subscription_status);
    const existingSubscription =
      subscriptionMap.get(status) ??
      {
        status,
        label: user.subscriptionLabel,
        total: 0,
        paid: 0,
        freemium: 0
      };

    existingSubscription.total += 1;
    if (user.planLabel === "Paid") {
      existingSubscription.paid += 1;
    } else {
      existingSubscription.freemium += 1;
    }

    subscriptionMap.set(status, existingSubscription);
  }

  const countryStats = [...countryMap.values()].sort((a, b) => b.total - a.total);
  const subscriptionStats = [...subscriptionMap.values()].sort((a, b) => b.total - a.total);
  const recentLogins = users
    .filter((user) => Boolean(user.last_seen_at))
    .sort((a, b) => getTimestamp(b.last_seen_at) - getTimestamp(a.last_seen_at))
    .slice(0, 100);

  return {
    configured: true,
    totalUsers: users.length,
    paidUsers,
    freemiumUsers: users.length - paidUsers,
    loggedInUsers: recentLogins.length,
    knownCountryUsers: users.filter((user) => Boolean(user.country_code)).length,
    countryStats,
    subscriptionStats,
    recentUsers: users.slice(0, 50),
    recentLogins
  };
}
