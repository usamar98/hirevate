alter table public.companies
  add column if not exists prominence_rank smallint;

alter table public.companies
  drop constraint if exists companies_prominence_rank_check;

alter table public.companies
  add constraint companies_prominence_rank_check
  check (prominence_rank is null or prominence_rank between 1 and 3);

update public.companies
set prominence_rank = case
  when lower(trim(name)) in (
    'openai', 'anthropic', 'stripe', 'figma', 'notion', 'cloudflare', 'doordash', 'doordash anz',
    'discord', 'mongodb', 'palantir', 'datadog', 'asana', 'airtable', 'miro',
    'xero', 'hashicorp'
  ) then 1
  when lower(trim(name)) in (
    'vercel', 'elevenlabs', 'perplexity', 'cohere', 'hugging face', 'zapier',
    'sentry', 'deel', 'kraken', 'ramp', 'rippling', 'plaid', 'brex', 'supabase',
    'runway', 'midjourney', 'suno', 'character ai', 'linear', 'replit', 'loom',
    'calendly', 'webflow', 'airwallex', 'culture amp', 'lightspeed'
  ) then 2
  when lower(trim(name)) in (
    'myob', 'xsolla', 'extreme networks', 'shopback', 'whoop', 'wiz', 'snyk',
    'amplitude'
  ) then 3
  else null
end;

create index if not exists companies_prominence_rank_idx
  on public.companies (prominence_rank, id)
  where is_active = true and prominence_rank is not null;

comment on column public.companies.prominence_rank is
  'Curated company prominence tier used to prioritize recognizable employers in country feeds.';
