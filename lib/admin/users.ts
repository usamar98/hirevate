import { isPaidSubscription } from "@/lib/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/types/database";

export type AdminUserRow = Profile & {
  planLabel: "Paid" | "Freemium";
};

export type CountryStat = {
  code: string;
  name: string;
  total: number;
  paid: number;
  freemium: number;
};

function getCountryName(code: string | null | undefined, storedName: string | null | undefined) {
  if (storedName && storedName !== code) return storedName;
  if (!code) return "Unknown";

  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
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
      knownCountryUsers: 0,
      countryStats: [] as CountryStat[],
      recentUsers: [] as AdminUserRow[]
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

    return {
      ...profile,
      country_code: profile.country_code ?? metadata?.countryCode ?? null,
      country_name: profile.country_name ?? metadata?.countryName ?? null,
      planLabel: isPaidSubscription(profile.subscription_status) ? "Paid" : "Freemium"
    };
  }) satisfies AdminUserRow[];

  const paidUsers = users.filter((user) => user.planLabel === "Paid").length;
  const countryMap = new Map<string, CountryStat>();

  for (const user of users) {
    const code = user.country_code ?? "unknown";
    const existing =
      countryMap.get(code) ??
      {
        code,
        name: getCountryName(user.country_code, user.country_name),
        total: 0,
        paid: 0,
        freemium: 0
      };

    existing.total += 1;
    if (user.planLabel === "Paid") {
      existing.paid += 1;
    } else {
      existing.freemium += 1;
    }

    countryMap.set(code, existing);
  }

  const countryStats = [...countryMap.values()].sort((a, b) => b.total - a.total);

  return {
    configured: true,
    totalUsers: users.length,
    paidUsers,
    freemiumUsers: users.length - paidUsers,
    knownCountryUsers: users.filter((user) => Boolean(user.country_code)).length,
    countryStats,
    recentUsers: users.slice(0, 50)
  };
}
