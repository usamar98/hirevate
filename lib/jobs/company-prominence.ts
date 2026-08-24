const companyProminenceTiers = [
  [
    "Google",
    "Google DeepMind",
    "Microsoft",
    "Amazon",
    "Amazon Web Services",
    "AWS",
    "Apple",
    "Meta",
    "Netflix",
    "NVIDIA",
    "Adobe",
    "Salesforce",
    "IBM",
    "Oracle",
    "Uber",
    "Airbnb",
    "Shopify",
    "Atlassian",
    "Canva",
    "Spotify",
    "TikTok",
    "ByteDance",
    "Tesla",
    "GitHub",
    "OpenAI",
    "Anthropic",
    "Stripe",
    "Figma",
    "Notion",
    "Cloudflare",
    "DoorDash",
    "DoorDash ANZ",
    "Discord",
    "MongoDB",
    "Palantir",
    "Datadog",
    "Asana",
    "Airtable",
    "Miro",
    "Xero",
    "HashiCorp"
  ],
  [
    "Coinbase",
    "Twilio",
    "Snowflake",
    "GitLab",
    "Automattic",
    "Reddit",
    "Block",
    "Wise",
    "Revolut",
    "Klarna",
    "HubSpot",
    "ServiceNow",
    "SAP",
    "Vercel",
    "ElevenLabs",
    "Perplexity",
    "Cohere",
    "Hugging Face",
    "Zapier",
    "Sentry",
    "Deel",
    "Kraken",
    "Ramp",
    "Rippling",
    "Plaid",
    "Brex",
    "Supabase",
    "Runway",
    "Midjourney",
    "Suno",
    "Character AI",
    "Linear",
    "Replit",
    "Loom",
    "Calendly",
    "Webflow",
    "Airwallex",
    "Culture Amp",
    "Lightspeed"
  ],
  [
    "MYOB",
    "Xsolla",
    "Extreme Networks",
    "ShopBack",
    "WHOOP",
    "Wiz",
    "Snyk",
    "Amplitude"
  ]
] as const;

function normalizeCompanyName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const prominenceByCompanyName = new Map<string, number>(
  companyProminenceTiers.flatMap((companies, tierIndex) =>
    companies.map((company) => [normalizeCompanyName(company), tierIndex + 1] as const)
  )
);

export function getCompanyProminenceRank(name: string | null | undefined) {
  if (!name) return null;
  return prominenceByCompanyName.get(normalizeCompanyName(name)) ?? null;
}
