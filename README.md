# Hirevate Hidden Jobs

Production-ready MVP SaaS for discovering fresh direct-apply software jobs from official Greenhouse public job boards.

## Scope

This MVP intentionally focuses on one service: hidden job discovery from Greenhouse public boards.

It does not include resume building, cover letter generation, interview prep, application tracking, LinkedIn scraping, Indeed scraping, protected-site scraping, or auto-apply flows.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase database, auth, and RLS
- Stripe Checkout and webhooks
- Zod validation
- React Hook Form

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` from `.env.example` and fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Apply Supabase migrations in order:

```bash
supabase db push
```

4. Seed initial Greenhouse company slugs:

```bash
supabase db seed
```

5. Run the app:

```bash
npm run dev
```

6. Make one profile an admin in Supabase:

```sql
update public.profiles
set role = 'admin'
where email = 'you@example.com';
```

7. Visit `/admin/jobs-sync` and click `Sync Greenhouse Jobs`.

## Stripe Setup

Checkout uses secure server-side `price_data`, so Stripe Price IDs are not required for the MVP.

Create a webhook endpoint for:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Set the webhook URL to:

```text
https://your-domain.com/api/stripe/webhook
```

For local testing, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Then copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## Security Notes

- Supabase service role key is only imported by server-only modules.
- Stripe secret key is only used in route handlers.
- Admin sync requires `profiles.role = 'admin'`.
- Job sync is protected by basic in-memory rate limiting.
- Job descriptions are sanitized before rendering.
- External apply/source links use `rel="noopener noreferrer"`.
- RLS allows public reads for active jobs and active companies only.
- Users can read their own profile and can only edit `full_name`; billing and role fields remain backend-owned.
- Saved jobs and job views are scoped to `auth.uid()`.

## Greenhouse Sync

The sync route:

1. Reads active companies from `public.companies`.
2. Calls `https://boards-api.greenhouse.io/v1/boards/{greenhouse_slug}/jobs?content=true`.
3. Normalizes Greenhouse jobs into `public.jobs`.
4. Uses Greenhouse job id as `external_id`.
5. Stores title, content, location, absolute URL, updated timestamp, and raw JSON.
6. Calculates a freshness score.
7. Logs invalid company slugs and continues syncing the rest.

Freshness scoring starts at 50:

- +25 when `updated_at` is within 7 days
- +15 when location exists
- +10 when apply/source URL exists
- +10 when the title includes software/dev/engineer/frontend/backend/fullstack/AI/data
- Max 100

## Free Plan Limits

- Free users can view 10 job detail pages per UTC day.
- Free users can save 5 jobs.
- Pro and Annual users have unlimited job views and saved jobs.

## Vercel Deployment

1. Create a Vercel project from this repository.
2. Add the environment variables from `.env.example`.
3. Set `NEXT_PUBLIC_APP_URL` to your production URL.
4. Apply Supabase migrations and seed data.
5. Configure the Stripe webhook to point to `/api/stripe/webhook`.
6. Deploy.

## Useful Commands

```bash
npm run dev
npm run build
npm run lint
```
