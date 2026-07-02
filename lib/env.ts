function readEnv(name: string) {
  const value = process.env[name]?.trim() ?? "";

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }

  return value;
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

const configuredAppUrl = readEnv("NEXT_PUBLIC_APP_URL");
const vercelUrl = readEnv("VERCEL_PROJECT_PRODUCTION_URL") || readEnv("VERCEL_URL");

export const env = {
  supabaseUrl: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  stripeSecretKey: readEnv("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: readEnv("STRIPE_WEBHOOK_SECRET"),
  stripePublishableKey: readEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
  jobSyncSecret: readEnv("JOB_SYNC_SECRET"),
  cronSecret: readEnv("CRON_SECRET") || readEnv("JOB_SYNC_SECRET"),
  adzunaAppId: readEnv("ADZUNA_APP_ID"),
  adzunaAppKey: readEnv("ADZUNA_APP_KEY"),
  adzunaCountry: readEnv("ADZUNA_COUNTRY") || "us",
  adzunaSearchQueries: readEnv("ADZUNA_SEARCH_QUERIES"),
  adzunaDefaultWhere: readEnv("ADZUNA_DEFAULT_WHERE"),
  adzunaResultsPerQuery: readEnv("ADZUNA_RESULTS_PER_QUERY"),
  adzunaMaxDaysOld: readEnv("ADZUNA_MAX_DAYS_OLD") || "7",
  leverCompanySlugs: readEnv("LEVER_COMPANY_SLUGS"),
  leverEuCompanySlugs: readEnv("LEVER_EU_COMPANY_SLUGS"),
  leverMaxCompaniesPerSync: readEnv("LEVER_MAX_COMPANIES_PER_SYNC"),
  serpApiKey: readEnv("SERPAPI_API_KEY"),
  serpApiSearchQueries: readEnv("SERPAPI_SEARCH_QUERIES"),
  serpApiFreshnessQuerySuffix: readEnv("SERPAPI_FRESHNESS_QUERY_SUFFIX") || "in the last 3 days",
  serpApiDefaultLocation: readEnv("SERPAPI_DEFAULT_LOCATION") || "United States",
  serpApiGoogleDomain: readEnv("SERPAPI_GOOGLE_DOMAIN") || "google.com",
  serpApiGl: readEnv("SERPAPI_GL") || "us",
  serpApiHl: readEnv("SERPAPI_HL") || "en",
  serpApiMonthlyLimit: readEnv("SERPAPI_MONTHLY_LIMIT"),
  serpApiMaxSearchesPerSync: readEnv("SERPAPI_MAX_SEARCHES_PER_SYNC"),
  googleSiteVerification: readEnv("GOOGLE_SITE_VERIFICATION"),
  superLoginUsername: readEnv("SUPER_LOGIN_USERNAME"),
  superLoginEmail: readEnv("SUPER_LOGIN_EMAIL"),
  superLoginPassword: readEnv("SUPER_LOGIN_PASSWORD"),
  appUrl: configuredAppUrl || (vercelUrl ? `https://${vercelUrl}` : "http://localhost:3000")
};

export function hasSupabaseBrowserConfig() {
  return isHttpUrl(env.supabaseUrl) && Boolean(env.supabaseAnonKey);
}

export function hasSupabaseAdminConfig() {
  return isHttpUrl(env.supabaseUrl) && Boolean(env.supabaseServiceRoleKey);
}

export function hasStripeConfig() {
  return Boolean(env.stripeSecretKey);
}

export function hasAdzunaConfig() {
  return Boolean(env.adzunaAppId && env.adzunaAppKey);
}

export function hasLeverConfig() {
  return Boolean(env.leverCompanySlugs || env.leverEuCompanySlugs);
}

export function hasSerpApiConfig() {
  return Boolean(env.serpApiKey);
}
