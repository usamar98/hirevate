const providerDomains = new Set([
  "api.ashbyhq.com",
  "ashbyhq.com",
  "boards.greenhouse.io",
  "greenhouse.io",
  "jobs.ashbyhq.com",
  "jobs.lever.co",
  "lever.co",
  "www.ashbyhq.com",
  "www.greenhouse.io",
  "www.lever.co"
]);

const companyDomainOverrides: Record<string, string> = {
  "airbnb": "airbnb.com",
  "anthropic": "anthropic.com",
  "apple": "apple.com",
  "asana": "asana.com",
  "atlassian": "atlassian.com",
  "brex": "brex.com",
  "cloudflare": "cloudflare.com",
  "discord": "discord.com",
  "doordash": "doordash.com",
  "facebook": "facebook.com",
  "figma": "figma.com",
  "google": "google.com",
  "hashicorp": "hashicorp.com",
  "hugging face": "huggingface.co",
  "linear": "linear.app",
  "meta": "meta.com",
  "microsoft": "microsoft.com",
  "mongodb": "mongodb.com",
  "netflix": "netflix.com",
  "notion": "notion.so",
  "openai": "openai.com",
  "plaid": "plaid.com",
  "ramp": "ramp.com",
  "reddit": "reddit.com",
  "rippling": "rippling.com",
  "scale ai": "scale.com",
  "sentry": "sentry.io",
  "stripe": "stripe.com",
  "supabase": "supabase.com",
  "vercel": "vercel.com",
  "webflow": "webflow.com",
  "zapier": "zapier.com"
};

function normalizeCompanyName(value: string) {
  return value
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|limited|corp|corporation|company|co)\b\.?/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function cleanHostname(hostname: string) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function getDomainFromWebsite(website: string | null | undefined) {
  if (!website?.trim()) return null;

  try {
    const url = new URL(website);
    const hostname = cleanHostname(url.hostname);

    if (providerDomains.has(hostname)) return null;

    return hostname;
  } catch {
    return null;
  }
}

export function getCompanyInitials(companyName: string) {
  const words = companyName
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return "H";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();

  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function getCompanyLogoDomain(companyName: string, website?: string | null) {
  const websiteDomain = getDomainFromWebsite(website);
  if (websiteDomain) return websiteDomain;

  const cleanName = normalizeCompanyName(companyName);
  return companyDomainOverrides[cleanName] ?? null;
}

export function getCompanyLogoUrl(domain: string) {
  return `https://logo.clearbit.com/${encodeURIComponent(domain)}`;
}
