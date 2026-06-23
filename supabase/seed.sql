insert into public.companies (name, website, greenhouse_slug, industry)
values
  ('OpenAI', 'https://openai.com', 'openai', 'AI'),
  ('Anthropic', 'https://anthropic.com', 'anthropic', 'AI'),
  ('Figma', 'https://figma.com', 'figma', 'Design software'),
  ('Notion', 'https://notion.so', 'notion', 'Productivity software'),
  ('Stripe', 'https://stripe.com', 'stripe', 'Payments'),
  ('Ramp', 'https://ramp.com', 'ramp', 'Fintech'),
  ('Rippling', 'https://rippling.com', 'rippling', 'HR software'),
  ('Plaid', 'https://plaid.com', 'plaid', 'Fintech'),
  ('Brex', 'https://brex.com', 'brex', 'Fintech'),
  ('Vercel', 'https://vercel.com', 'vercel', 'Developer tools'),
  ('Linear', 'https://linear.app', 'linear', 'Developer tools'),
  ('Scale AI', 'https://scale.com', 'scaleai', 'AI'),
  ('Datadog', 'https://datadoghq.com', 'datadog', 'Observability'),
  ('Discord', 'https://discord.com', 'discord', 'Communications'),
  ('Asana', 'https://asana.com', 'asana', 'Productivity software'),
  ('Calendly', 'https://calendly.com', 'calendly', 'Productivity software'),
  ('Zapier', 'https://zapier.com', 'zapier', 'Automation'),
  ('Webflow', 'https://webflow.com', 'webflow', 'Web software'),
  ('Algolia', 'https://algolia.com', 'algolia', 'Search'),
  ('Sentry', 'https://sentry.io', 'sentry', 'Developer tools'),
  ('Cloudflare', 'https://cloudflare.com', 'cloudflare', 'Infrastructure'),
  ('DoorDash', 'https://doordash.com', 'doordash', 'Marketplace'),
  ('HashiCorp', 'https://hashicorp.com', 'hashicorp', 'Infrastructure'),
  ('MongoDB', 'https://mongodb.com', 'mongodb', 'Database'),
  ('Hugging Face', 'https://huggingface.co', 'huggingface', 'AI')
on conflict (greenhouse_slug) do update
set
  name = excluded.name,
  website = excluded.website,
  industry = excluded.industry,
  is_active = true;
