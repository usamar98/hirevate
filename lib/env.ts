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
