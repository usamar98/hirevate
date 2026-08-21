import type { User } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { isAdminProfile, isPaidSubscription } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
import type { Profile } from "@/types/database";

type AdminClient = NonNullable<ReturnType<typeof createSupabaseAdminClient>>;

export type BillingLifecycle =
  | "active"
  | "admin"
  | "canceled"
  | "ending"
  | "past_due"
  | "trialing"
  | "unpaid"
  | "unsubscribed";

export type AdminUserRow = Profile & {
  accountType: "Administrator" | "Paid user" | "Registered user";
  authProvider: string;
  billingLifecycle: BillingLifecycle;
  billingSource: "profile" | "stripe" | "none";
  cancellationScheduled: boolean;
  currentPeriodEnd: string | null;
  planLabel: "Admin access" | "Paid" | "Unsubscribed";
  stripeStatus: string | null;
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
  status: BillingLifecycle;
  label: string;
  total: number;
  paid: number;
  freemium: number;
};

export type PlanStat = {
  key: "admin" | "annual" | "legacy" | "monthly" | "none";
  label: string;
  total: number;
};

export type DailyVisitorStat = {
  date: string;
  visitors: number;
  anonymousVisitors: number;
  registeredVisitors: number;
  pageViews: number;
};

export type GrowthTrendPoint = {
  date: string;
  signups: number;
  lastSeen: number;
  visitors: number;
  pageViews: number;
};

export type ApplicationFunnelStat = {
  status: string;
  label: string;
  total: number;
};

type VisitorRow = {
  visit_date: string;
  page_views: number;
  user_id: string | null;
};

type ApplicationRow = {
  status: string;
  created_at: string;
};

type StripeSnapshot = {
  configured: boolean;
  error: string | null;
  subscriptions: Stripe.Subscription[];
};

const pageSize = 1000;
const paidStripeStatuses = new Set(["active", "trialing"]);

function normalizeSubscriptionStatus(status: string | null | undefined) {
  return status?.trim().toLowerCase() || "free";
}

function formatPeriodEnd(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC"
  }).format(date);
}

export function getSubscriptionLabel(
  status: string | null | undefined,
  lifecycle?: BillingLifecycle,
  currentPeriodEnd?: string | null
) {
  if (lifecycle === "admin") return "Admin premium access";
  if (lifecycle === "canceled") return "Canceled";
  if (lifecycle === "ending") {
    const endDate = formatPeriodEnd(currentPeriodEnd ?? null);
    return endDate ? `Cancels ${endDate}` : "Cancellation scheduled";
  }
  if (lifecycle === "past_due") return "Past due";
  if (lifecycle === "trialing") return "Trialing";
  if (lifecycle === "unpaid") return "Unpaid";

  const normalized = normalizeSubscriptionStatus(status);
  const labels: Record<string, string> = {
    active: "Paid subscription",
    annual: "Legacy subscription",
    canceled: "Canceled",
    free: "No subscription",
    gold: "Monthly Plan",
    past_due: "Past due",
    platinum: "Annual Plan",
    pro: "Legacy subscription",
    starter: "Legacy subscription",
    silver: "Legacy subscription",
    trialing: "Trialing",
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

function getAccountType(
  role: string,
  planLabel: AdminUserRow["planLabel"]
): AdminUserRow["accountType"] {
  if (isAdminProfile({ role })) return "Administrator";
  return planLabel === "Paid" ? "Paid user" : "Registered user";
}

function getVisitorDate(daysAgo: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

async function listAuthUsers(admin: AdminClient) {
  const users: User[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: pageSize });
    if (error) throw error;

    users.push(...data.users);
    if (data.users.length < pageSize) break;
    page += 1;
  }

  return users;
}

async function listProfiles(admin: AdminClient) {
  const profiles: Profile[] = [];

  for (let start = 0; ; start += pageSize) {
    const { data, error } = await admin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .range(start, start + pageSize - 1);
    if (error) throw error;

    profiles.push(...((data ?? []) as Profile[]));
    if ((data?.length ?? 0) < pageSize) break;
  }

  return profiles;
}

async function listVisitorRows(admin: AdminClient) {
  const rows: VisitorRow[] = [];

  for (let start = 0; ; start += pageSize) {
    const { data, error } = await admin
      .from("daily_visitors")
      .select("visit_date,page_views,user_id")
      .gte("visit_date", getVisitorDate(29))
      .order("visit_date", { ascending: false })
      .range(start, start + pageSize - 1);

    if (error) return { configured: false, rows };
    rows.push(...((data ?? []) as VisitorRow[]));
    if ((data?.length ?? 0) < pageSize) break;
  }

  return { configured: true, rows };
}

async function listApplicationRows(admin: AdminClient) {
  const rows: ApplicationRow[] = [];

  for (let start = 0; ; start += pageSize) {
    const { data, error } = await admin
      .from("job_applications")
      .select("status,created_at")
      .range(start, start + pageSize - 1);

    if (error) return rows;
    rows.push(...((data ?? []) as ApplicationRow[]));
    if ((data?.length ?? 0) < pageSize) break;
  }

  return rows;
}

async function listStripeSubscriptions(): Promise<StripeSnapshot> {
  const stripe = getStripe();
  if (!stripe) return { configured: false, error: null, subscriptions: [] };

  const subscriptions: Stripe.Subscription[] = [];
  let startingAfter: string | undefined;

  try {
    while (true) {
      const page = await stripe.subscriptions.list({
        limit: 100,
        starting_after: startingAfter,
        status: "all"
      });
      subscriptions.push(...page.data);
      if (!page.has_more || page.data.length === 0) break;
      startingAfter = page.data.at(-1)?.id;
    }

    return { configured: true, error: null, subscriptions };
  } catch (error) {
    return {
      configured: true,
      error: error instanceof Error ? error.message : "Unable to load Stripe subscriptions.",
      subscriptions
    };
  }
}

function buildStripeIndexes(subscriptions: Stripe.Subscription[]) {
  const byId = new Map<string, Stripe.Subscription>();
  const byUserId = new Map<string, Stripe.Subscription>();

  for (const subscription of subscriptions) {
    byId.set(subscription.id, subscription);
    const userId = subscription.metadata.userId;
    const current = userId ? byUserId.get(userId) : null;
    const subscriptionIsPaid = paidStripeStatuses.has(subscription.status);
    const currentIsPaid = current ? paidStripeStatuses.has(current.status) : false;
    if (
      userId &&
      (!current ||
        (subscriptionIsPaid && !currentIsPaid) ||
        (subscriptionIsPaid === currentIsPaid && current.created < subscription.created))
    ) {
      byUserId.set(userId, subscription);
    }
  }

  return { byId, byUserId };
}

function findUserSubscription(
  profile: Pick<Profile, "id" | "stripe_subscription_id">,
  indexes: ReturnType<typeof buildStripeIndexes>
) {
  const direct = profile.stripe_subscription_id
    ? indexes.byId.get(profile.stripe_subscription_id)
    : undefined;
  const preferredForUser = indexes.byUserId.get(profile.id);

  if (
    preferredForUser &&
    paidStripeStatuses.has(preferredForUser.status) &&
    (!direct || !paidStripeStatuses.has(direct.status))
  ) {
    return preferredForUser;
  }

  return direct ?? preferredForUser;
}

function getStripePeriodEnd(subscription: Stripe.Subscription | undefined) {
  return subscription?.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;
}

function getBillingLifecycle({
  cancellationScheduled,
  isAdmin,
  isPaid,
  stripeStatus
}: {
  cancellationScheduled: boolean;
  isAdmin: boolean;
  isPaid: boolean;
  stripeStatus: string | null;
}): BillingLifecycle {
  if (cancellationScheduled && isPaid) return "ending";
  if (stripeStatus === "trialing") return "trialing";
  if (stripeStatus === "past_due") return "past_due";
  if (stripeStatus === "unpaid" || stripeStatus === "incomplete") return "unpaid";
  if (stripeStatus === "canceled" || stripeStatus === "incomplete_expired") return "canceled";
  if (isPaid) return "active";
  if (isAdmin) return "admin";
  return "unsubscribed";
}

function getPlanKey(user: AdminUserRow): PlanStat["key"] {
  if (user.planLabel === "Admin access") return "admin";
  if (user.planLabel !== "Paid") return "none";
  const status = normalizeSubscriptionStatus(user.subscription_status);
  if (status === "gold") return "monthly";
  if (status === "platinum") return "annual";
  return "legacy";
}

function enrichUser(
  profile: Profile,
  authProvider: string,
  stripeSubscription: Stripe.Subscription | undefined
): AdminUserRow {
  const role = profile.role || "user";
  const adminAccess = isAdminProfile({ role });
  const liveStripeStatus = stripeSubscription?.status ?? profile.stripe_subscription_status ?? null;
  const cancellationScheduled =
    stripeSubscription?.cancel_at_period_end ?? profile.subscription_cancel_at_period_end ?? false;
  const currentPeriodEnd =
    getStripePeriodEnd(stripeSubscription) ?? profile.subscription_current_period_end ?? null;
  const hasLiveStripeSnapshot = Boolean(stripeSubscription);
  const stripePaid = liveStripeStatus ? paidStripeStatuses.has(liveStripeStatus) : null;
  const profilePaid = isPaidSubscription(profile.subscription_status);
  const paid = stripePaid ?? (profilePaid && !(adminAccess && !profile.stripe_subscription_id));
  const planLabel: AdminUserRow["planLabel"] = paid
    ? "Paid"
    : adminAccess
      ? "Admin access"
      : "Unsubscribed";
  const billingLifecycle = getBillingLifecycle({
    cancellationScheduled,
    isAdmin: adminAccess,
    isPaid: paid,
    stripeStatus: liveStripeStatus
  });

  return {
    ...profile,
    stripe_subscription_status: liveStripeStatus,
    subscription_cancel_at_period_end: cancellationScheduled,
    subscription_current_period_end: currentPeriodEnd,
    subscription_updated_at: profile.subscription_updated_at ?? null,
    accountType: getAccountType(role, planLabel),
    authProvider,
    billingLifecycle,
    billingSource: hasLiveStripeSnapshot
      ? "stripe"
      : profile.stripe_subscription_id || profile.stripe_subscription_status
        ? "profile"
        : "none",
    cancellationScheduled,
    currentPeriodEnd,
    planLabel,
    stripeStatus: liveStripeStatus,
    subscriptionLabel: getSubscriptionLabel(
      profile.subscription_status,
      billingLifecycle,
      currentPeriodEnd
    )
  };
}

function buildApplicationFunnel(rows: ApplicationRow[]) {
  const order = ["interested", "applied", "interview", "offer", "rejected", "withdrawn"];
  const labels: Record<string, string> = {
    interested: "Interested",
    applied: "Applied",
    interview: "Interview",
    offer: "Offer",
    rejected: "Rejected",
    withdrawn: "Withdrawn"
  };
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(row.status, (totals.get(row.status) ?? 0) + 1);

  return order.map((status) => ({
    status,
    label: labels[status],
    total: totals.get(status) ?? 0
  }));
}

export async function getAdminUsersDashboard() {
  const admin = createSupabaseAdminClient();
  if (!admin) {
    return {
      configured: false,
      stripeConfigured: false,
      stripeError: null as string | null,
      totalUsers: 0,
      paidUsers: 0,
      freemiumUsers: 0,
      adminUsers: 0,
      loggedInUsers: 0,
      knownCountryUsers: 0,
      newUsersLast30Days: 0,
      activeUsersLast30Days: 0,
      conversionRate: 0,
      endingSubscriptions: 0,
      overdueSubscriptions: 0,
      totalApplications: 0,
      totalSavedJobs: 0,
      liveJobs: 0,
      countryStats: [] as CountryStat[],
      subscriptionStats: [] as SubscriptionStat[],
      planStats: [] as PlanStat[],
      dailyVisitors: [] as DailyVisitorStat[],
      growthTrend: [] as GrowthTrendPoint[],
      applicationFunnel: [] as ApplicationFunnelStat[],
      visitorTrackingConfigured: false,
      todayVisitors: 0,
      todayPageViews: 0,
      recentUsers: [] as AdminUserRow[],
      recentLogins: [] as AdminUserRow[]
    };
  }

  const [
    profiles,
    authUsers,
    visitorSnapshot,
    applicationRows,
    savedJobsResult,
    liveJobsResult,
    stripeSnapshot
  ] = await Promise.all([
    listProfiles(admin),
    listAuthUsers(admin),
    listVisitorRows(admin),
    listApplicationRows(admin),
    admin.from("saved_jobs").select("id", { count: "exact", head: true }),
    admin.from("jobs").select("id", { count: "exact", head: true }).eq("status", "active"),
    listStripeSubscriptions()
  ]);

  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  const authUserIds = new Set(authUsers.map((user) => user.id));
  const stripeIndexes = buildStripeIndexes(stripeSnapshot.subscriptions);
  const users = authUsers.map((authUser) => {
    const storedProfile = profileMap.get(authUser.id);
    const userMetadata = authUser.user_metadata as Record<string, unknown>;
    const appMetadata = authUser.app_metadata as Record<string, unknown>;
    const countryCode = getMetadataString(userMetadata, "country_code")?.toUpperCase() ?? null;
    const role = storedProfile?.role ?? getMetadataString(appMetadata, "role") ?? "user";
    const profile: Profile = storedProfile ?? {
      id: authUser.id,
      email: authUser.email ?? null,
      full_name: getMetadataString(userMetadata, "full_name"),
      username: getMetadataString(userMetadata, "username")?.toLowerCase() ?? null,
      role,
      subscription_status: "free",
      stripe_customer_id: null,
      stripe_subscription_id: null,
      stripe_subscription_status: null,
      subscription_cancel_at_period_end: false,
      subscription_current_period_end: null,
      subscription_updated_at: null,
      country_code: countryCode,
      country_name: getMetadataString(userMetadata, "country_name"),
      last_seen_at: authUser.last_sign_in_at ?? null,
      welcome_email_triggered_at: null,
      created_at: authUser.created_at
    };
    const stripeSubscription = findUserSubscription(profile, stripeIndexes);

    return enrichUser(
      {
        ...profile,
        email: profile.email ?? authUser.email ?? null,
        full_name: profile.full_name || getMetadataString(userMetadata, "full_name"),
        country_code: profile.country_code ?? countryCode,
        country_name: profile.country_name ?? getMetadataString(userMetadata, "country_name"),
        last_seen_at: profile.last_seen_at ?? authUser.last_sign_in_at ?? null
      },
      getAuthProvider(appMetadata),
      stripeSubscription
    );
  });

  for (const profile of profiles) {
    if (authUserIds.has(profile.id)) continue;
    const stripeSubscription = findUserSubscription(profile, stripeIndexes);
    users.push(enrichUser(profile, "Unknown", stripeSubscription));
  }

  users.sort((a, b) => getTimestamp(b.created_at) - getTimestamp(a.created_at));

  const paidUsers = users.filter((user) => user.planLabel === "Paid").length;
  const adminUsers = users.filter((user) => user.planLabel === "Admin access").length;
  const countryMap = new Map<string, CountryStat>();
  const lifecycleLabels: Record<BillingLifecycle, string> = {
    active: "Active",
    admin: "Admin access",
    canceled: "Canceled",
    ending: "Canceling at period end",
    past_due: "Past due",
    trialing: "Trialing",
    unpaid: "Unpaid",
    unsubscribed: "No subscription"
  };
  const subscriptionMap = new Map<BillingLifecycle, SubscriptionStat>();
  const planLabels: Record<PlanStat["key"], string> = {
    admin: "Admin access",
    annual: "Annual Plan",
    legacy: "Legacy paid",
    monthly: "Monthly Plan",
    none: "No subscription"
  };
  const planMap = new Map<PlanStat["key"], PlanStat>();

  for (const user of users) {
    const code = user.country_code ?? "unknown";
    const existingCountry = countryMap.get(code) ?? {
      code,
      name: getCountryName(user.country_code, user.country_name),
      total: 0,
      paid: 0,
      freemium: 0
    };

    existingCountry.total += 1;
    if (user.planLabel === "Paid") existingCountry.paid += 1;
    else existingCountry.freemium += 1;
    countryMap.set(code, existingCountry);

    const existingSubscription = subscriptionMap.get(user.billingLifecycle) ?? {
      status: user.billingLifecycle,
      label: lifecycleLabels[user.billingLifecycle],
      total: 0,
      paid: 0,
      freemium: 0
    };
    existingSubscription.total += 1;
    if (user.planLabel === "Paid") existingSubscription.paid += 1;
    else existingSubscription.freemium += 1;
    subscriptionMap.set(user.billingLifecycle, existingSubscription);

    const planKey = getPlanKey(user);
    const existingPlan = planMap.get(planKey) ?? {
      key: planKey,
      label: planLabels[planKey],
      total: 0
    };
    existingPlan.total += 1;
    planMap.set(planKey, existingPlan);
  }

  const visitorMap = new Map<string, DailyVisitorStat>();
  for (const visit of visitorSnapshot.rows) {
    const existing = visitorMap.get(visit.visit_date) ?? {
      date: visit.visit_date,
      visitors: 0,
      anonymousVisitors: 0,
      registeredVisitors: 0,
      pageViews: 0
    };
    existing.visitors += 1;
    existing.pageViews += visit.page_views;
    if (visit.user_id) existing.registeredVisitors += 1;
    else existing.anonymousVisitors += 1;
    visitorMap.set(visit.visit_date, existing);
  }

  const trendMap = new Map<string, GrowthTrendPoint>();
  for (let daysAgo = 29; daysAgo >= 0; daysAgo -= 1) {
    const date = getVisitorDate(daysAgo);
    const visitors = visitorMap.get(date);
    trendMap.set(date, {
      date,
      signups: 0,
      lastSeen: 0,
      visitors: visitors?.visitors ?? 0,
      pageViews: visitors?.pageViews ?? 0
    });
  }

  for (const user of users) {
    const signupDay = user.created_at.slice(0, 10);
    const signupPoint = trendMap.get(signupDay);
    if (signupPoint) signupPoint.signups += 1;
    const lastSeenDay = user.last_seen_at?.slice(0, 10);
    const lastSeenPoint = lastSeenDay ? trendMap.get(lastSeenDay) : null;
    if (lastSeenPoint) lastSeenPoint.lastSeen += 1;
  }

  const countryStats = [...countryMap.values()].sort((a, b) => b.total - a.total);
  const subscriptionStats = [...subscriptionMap.values()].sort((a, b) => b.total - a.total);
  const planStats = [...planMap.values()].sort((a, b) => b.total - a.total);
  const dailyVisitors = [...visitorMap.values()].sort((a, b) => b.date.localeCompare(a.date));
  const growthTrend = [...trendMap.values()];
  const today = visitorMap.get(getVisitorDate(0));
  const loggedInUsers = users
    .filter((user) => Boolean(user.last_seen_at))
    .sort((a, b) => getTimestamp(b.last_seen_at) - getTimestamp(a.last_seen_at));
  const thirtyDaysAgo = Date.parse(`${getVisitorDate(29)}T00:00:00.000Z`);
  const newUsersLast30Days = users.filter((user) => getTimestamp(user.created_at) >= thirtyDaysAgo).length;
  const activeUsersLast30Days = users.filter((user) => getTimestamp(user.last_seen_at) >= thirtyDaysAgo).length;

  return {
    configured: true,
    stripeConfigured: stripeSnapshot.configured,
    stripeError: stripeSnapshot.error,
    totalUsers: users.length,
    paidUsers,
    freemiumUsers: users.length - paidUsers - adminUsers,
    adminUsers,
    loggedInUsers: loggedInUsers.length,
    knownCountryUsers: users.filter((user) => Boolean(user.country_code)).length,
    newUsersLast30Days,
    activeUsersLast30Days,
    conversionRate: users.length ? (paidUsers / users.length) * 100 : 0,
    endingSubscriptions: users.filter((user) => user.billingLifecycle === "ending").length,
    overdueSubscriptions: users.filter((user) =>
      user.billingLifecycle === "past_due" || user.billingLifecycle === "unpaid"
    ).length,
    totalApplications: applicationRows.length,
    totalSavedJobs: savedJobsResult.count ?? 0,
    liveJobs: liveJobsResult.count ?? 0,
    countryStats,
    subscriptionStats,
    planStats,
    dailyVisitors,
    growthTrend,
    applicationFunnel: buildApplicationFunnel(applicationRows),
    visitorTrackingConfigured: visitorSnapshot.configured,
    todayVisitors: today?.visitors ?? 0,
    todayPageViews: today?.pageViews ?? 0,
    recentUsers: users,
    recentLogins: loggedInUsers.slice(0, 100)
  };
}
