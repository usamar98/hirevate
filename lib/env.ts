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
  resendApiKey: readEnv("RESEND_API_KEY"),
  openAiApiKey: readEnv("OPENAI_API_KEY"),
  openAiModel: readEnv("OPENAI_MODEL") || "gpt-5-mini",
  jobSyncSecret: readEnv("JOB_SYNC_SECRET"),
  cronSecret: readEnv("CRON_SECRET"),
  adzunaAppId: readEnv("ADZUNA_APP_ID"),
  adzunaAppKey: readEnv("ADZUNA_APP_KEY"),
  adzunaCountry: readEnv("ADZUNA_COUNTRY") || "us",
  adzunaCountries: readEnv("ADZUNA_COUNTRIES"),
  adzunaSearchQueries: readEnv("ADZUNA_SEARCH_QUERIES"),
  adzunaDefaultWhere: readEnv("ADZUNA_DEFAULT_WHERE"),
  adzunaResultsPerQuery: readEnv("ADZUNA_RESULTS_PER_QUERY"),
  adzunaMaxDaysOld: readEnv("ADZUNA_MAX_DAYS_OLD") || "7",
  dailyFreshJobQueries: readEnv("DAILY_FRESH_JOB_QUERIES"),
  dailyFreshAdzunaQueryCount: readEnv("DAILY_FRESH_ADZUNA_QUERY_COUNT"),
  dailyFreshJoobleQueryCount: readEnv("DAILY_FRESH_JOOBLE_QUERY_COUNT"),
  dailyFreshMaxDaysOld: readEnv("DAILY_FRESH_MAX_DAYS_OLD"),
  dailyFreshSyncBudgetMs: readEnv("DAILY_FRESH_SYNC_BUDGET_MS"),
  dailyFreshGreenhouseCompanyCount: readEnv("DAILY_FRESH_GREENHOUSE_COMPANY_COUNT"),
  dailyFreshAshbyCompanyCount: readEnv("DAILY_FRESH_ASHBY_COMPANY_COUNT"),
  dailyFreshLeverCompanyCount: readEnv("DAILY_FRESH_LEVER_COMPANY_COUNT"),
  ashbyCompanySlugs: readEnv("ASHBY_COMPANY_SLUGS"),
  ashbyDisableDefaultSources: readEnv("ASHBY_DISABLE_DEFAULT_SOURCES"),
  ashbyMaxCompaniesPerSync: readEnv("ASHBY_MAX_COMPANIES_PER_SYNC"),
  leverCompanySlugs: readEnv("LEVER_COMPANY_SLUGS"),
  leverEuCompanySlugs: readEnv("LEVER_EU_COMPANY_SLUGS"),
  leverDisableDefaultSources: readEnv("LEVER_DISABLE_DEFAULT_SOURCES"),
  leverMaxCompaniesPerSync: readEnv("LEVER_MAX_COMPANIES_PER_SYNC"),
  joobleApiKey: readEnv("JOOBLE_API_KEY"),
  joobleSearchQueries: readEnv("JOOBLE_SEARCH_QUERIES"),
  joobleResultsPerQuery: readEnv("JOOBLE_RESULTS_PER_QUERY"),
  googleSiteVerification: readEnv("GOOGLE_SITE_VERIFICATION"),
  legalOperatorName: readEnv("NEXT_PUBLIC_LEGAL_OPERATOR_NAME"),
  legalEmail: readEnv("NEXT_PUBLIC_LEGAL_EMAIL"),
  legalAddress: readEnv("NEXT_PUBLIC_LEGAL_ADDRESS"),
  legalRegistrationNumber: readEnv("NEXT_PUBLIC_LEGAL_REGISTRATION_NUMBER"),
  legalCountry: readEnv("NEXT_PUBLIC_LEGAL_COUNTRY"),
  superLoginUsername: readEnv("SUPER_LOGIN_USERNAME"),
  superLoginEmail: readEnv("SUPER_LOGIN_EMAIL"),
  superLoginPassword: readEnv("SUPER_LOGIN_PASSWORD"),
  adminHirevatePassword: readEnv("ADMINHIREVATE01_PASSWORD"),
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
  return env.leverDisableDefaultSources.toLowerCase() !== "true" || Boolean(env.leverCompanySlugs || env.leverEuCompanySlugs);
}

export function hasAshbyConfig() {
  return env.ashbyDisableDefaultSources.toLowerCase() !== "true" || Boolean(env.ashbyCompanySlugs);
}

export function hasJoobleConfig() {
  return Boolean(env.joobleApiKey);
}
