import type { User } from "@supabase/supabase-js";
import { isPaidSubscription } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/database";

export type AdminUserRow = Profile & {
  accountType: "Administrator" | "Paid user" | "Registered user";
  authProvider: string;
  planLabel: "Paid" | "Unsubscribed";
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

export type DailyVisitorStat = {
  date: string;
  visitors: number;
  anonymousVisitors: number;
  registeredVisitors: number;
  pageViews: number;
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
    free: "Unsubscribed",
    gold: "Monthly Plan",
    past_due: "Past due",
    platinum: "Annual Plan",
    pro: "Pro legacy plan",
    starter: "Daily Plan",
    silver: "Weekly Plan",
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

function getMetadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getAuthProvider(appMetadata: Record<string, unknown>) {
  const provider = getMetadataString(appMetadata, "provider");
  return provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : "Email";
}

function getAccountType(role: string, planLabel: AdminUserRow["planLabel"]): AdminUserRow["accountType"] {
  const normalizedRole = role.trim().toLowerCase();
  if (["admin", "superadmin", "super_admin"].includes(normalizedRole)) return "Administrator";
  return planLabel === "Paid" ? "Paid user" : "Registered user";
}

async function listAuthUsers(admin: NonNullable<ReturnType<typeof createSupabaseAdminClient>>) {
  const users: User[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    users.push(...data.users);
    if (data.users.length < 1000) break;
    page += 1;
  }

  return users;
}

function getVisitorDate(daysAgo: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
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
      dailyVisitors: [] as DailyVisitorStat[],
      visitorTrackingConfigured: false,
      todayVisitors: 0,
      todayPageViews: 0,
      recentUsers: [] as AdminUserRow[],
      recentLogins: [] as AdminUserRow[]
    };
  }

  const [profilesResult, authUsers, visitorResult] = await Promise.all([
    admin.from("profiles").select("*").order("created_at", { ascending: false }),
    listAuthUsers(admin),
    admin
      .from("daily_visitors")
      .select("visit_date,page_views,user_id")
      .gte("visit_date", getVisitorDate(29))
      .order("visit_date", { ascending: false })
  ]);

  if (profilesResult.error) {
    throw profilesResult.error;
  }

  const profiles = (profilesResult.data ?? []) as Profile[];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const authUserIds = new Set(authUsers.map((user) => user.id));
  const users = authUsers.map((authUser) => {
    const profile = profileMap.get(authUser.id);
    const userMetadata = authUser.user_metadata as Record<string, unknown>;
    const appMetadata = authUser.app_metadata as Record<string, unknown>;
    const countryCode = getMetadataString(userMetadata, "country_code")?.toUpperCase() ?? null;
    const role = profile?.role ?? getMetadataString(appMetadata, "role") ?? "user";
    const subscriptionStatus = profile?.subscription_status ?? "free";
    const planLabel = isPaidSubscription(subscriptionStatus) ? "Paid" : "Unsubscribed";
    const accountType = getAccountType(role, planLabel);

    return {
      id: authUser.id,
      email: profile?.email ?? authUser.email ?? null,
      full_name: profile?.full_name || getMetadataString(userMetadata, "full_name"),
      role,
      subscription_status: subscriptionStatus,
      stripe_customer_id: profile?.stripe_customer_id ?? null,
      stripe_subscription_id: profile?.stripe_subscription_id ?? null,
      country_code: profile?.country_code ?? countryCode,
      country_name: profile?.country_name ?? getMetadataString(userMetadata, "country_name"),
      last_seen_at: profile?.last_seen_at ?? authUser.last_sign_in_at ?? null,
      created_at: profile?.created_at ?? authUser.created_at,
      accountType,
      authProvider: getAuthProvider(appMetadata),
      planLabel,
      subscriptionLabel: getSubscriptionLabel(subscriptionStatus)
    };
  }) satisfies AdminUserRow[];

  for (const profile of profiles) {
    if (authUserIds.has(profile.id)) continue;

    const planLabel = isPaidSubscription(profile.subscription_status) ? "Paid" : "Unsubscribed";
    users.push({
      ...profile,
      accountType: getAccountType(profile.role, planLabel),
      authProvider: "Unknown",
      planLabel,
      subscriptionLabel: getSubscriptionLabel(profile.subscription_status)
    });
  }

  users.sort((a, b) => getTimestamp(b.created_at) - getTimestamp(a.created_at));

  const paidUsers = users.filter((user) => user.planLabel === "Paid").length;
  const countryMap = new Map<string, CountryStat>();
  const subscriptionMap = new Map<string, SubscriptionStat>();

  for (const user of users) {
    const code = user.country_code ?? "unknown";
    const existingCountry =
      countryMap.get(code) ?? {
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
      subscriptionMap.get(status) ?? {
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

  const visitorMap = new Map<string, DailyVisitorStat>();

  for (const visit of visitorResult.data ?? []) {
    const existing = visitorMap.get(visit.visit_date) ?? {
      date: visit.visit_date,
      visitors: 0,
      anonymousVisitors: 0,
      registeredVisitors: 0,
      pageViews: 0
    };

    existing.visitors += 1;
    existing.pageViews += visit.page_views;
    if (visit.user_id) {
      existing.registeredVisitors += 1;
    } else {
      existing.anonymousVisitors += 1;
    }
    visitorMap.set(visit.visit_date, existing);
  }

  const countryStats = [...countryMap.values()].sort((a, b) => b.total - a.total);
  const subscriptionStats = [...subscriptionMap.values()].sort((a, b) => b.total - a.total);
  const dailyVisitors = [...visitorMap.values()].sort((a, b) => b.date.localeCompare(a.date));
  const today = visitorMap.get(getVisitorDate(0));
  const loggedInUsers = users
    .filter((user) => Boolean(user.last_seen_at))
    .sort((a, b) => getTimestamp(b.last_seen_at) - getTimestamp(a.last_seen_at));
  const recentLogins = loggedInUsers.slice(0, 100);

  return {
    configured: true,
    totalUsers: users.length,
    paidUsers,
    freemiumUsers: users.length - paidUsers,
    loggedInUsers: loggedInUsers.length,
    knownCountryUsers: users.filter((user) => Boolean(user.country_code)).length,
    countryStats,
    subscriptionStats,
    dailyVisitors,
    visitorTrackingConfigured: !visitorResult.error,
    todayVisitors: today?.visitors ?? 0,
    todayPageViews: today?.pageViews ?? 0,
    recentUsers: users,
    recentLogins
  };
}
