# Hirevate Hidden Jobs

Production-ready MVP SaaS for discovering fresh direct-apply roles from official company hiring sources.

## Scope

This MVP started with hidden job discovery from Greenhouse public boards and is designed to expand
into additional job APIs and hiring sources.

It does not include cover letter generation, interview prep, application tracking, LinkedIn scraping, Indeed scraping, protected-site scraping, or auto-apply flows.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase database, auth, and RLS
- Stripe Checkout and webhooks
- Advanced resume builder with free testing-mode export
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
JOB_SYNC_SECRET=
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
ADZUNA_COUNTRY=us
ADZUNA_SEARCH_QUERIES=
ADZUNA_DEFAULT_WHERE=
ADZUNA_RESULTS_PER_QUERY=30
SERPAPI_API_KEY=
SERPAPI_SEARCH_QUERIES=
SERPAPI_DEFAULT_LOCATION=United States
SERPAPI_GOOGLE_DOMAIN=google.com
SERPAPI_GL=us
SERPAPI_HL=en
SERPAPI_MONTHLY_LIMIT=220
SERPAPI_MAX_SEARCHES_PER_SYNC=5
GOOGLE_SITE_VERIFICATION=
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

7. Visit `/admin/jobs-sync` and click `Sync job sources`.

## Stripe Setup

Checkout uses secure server-side `price_data`, so Stripe Price IDs are not required for the MVP.

Create a webhook endpoint for:

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

Set the webhook URL to:

```text
https://www.hirevate.com/api/stripe/webhook
```

For local testing, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Then copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

### Switching Stripe Accounts

If you move production checkout to a different Stripe account, update these Vercel Production
environment variables together:

- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

For sensitive variables in Vercel, delete the old variable and add the new value if the dashboard
does not let you edit it. Then redeploy production. The checkout page merchant name comes from the
Stripe account behind `STRIPE_SECRET_KEY` and Stripe Dashboard branding/business settings.

Admins can verify the live connected Stripe account at `/admin/stripe`. Existing saved Stripe
customer IDs are account-scoped; checkout validates them before reuse so old-account customer IDs do
not block new-account checkout sessions.

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

## Job Source Sync

The admin sync page and protected sync endpoint import jobs from Greenhouse, Adzuna, and SerpApi
Google Jobs. Public `/jobs` searches read from Supabase only, so user traffic does not spend
SerpApi credits. Set `JOB_SYNC_SECRET` in production if you want to trigger sync without a browser
admin session:

```bash
curl -X POST https://www.hirevate.com/api/jobs/sync \
  -H "x-job-sync-secret: $JOB_SYNC_SECRET"
```

The Greenhouse sync:

1. Reads active companies from `public.companies`.
2. Calls `https://boards-api.greenhouse.io/v1/boards/{greenhouse_slug}/jobs?content=true`.
3. Normalizes Greenhouse jobs into `public.jobs`.
4. Uses Greenhouse job id as `external_id`.
5. Stores title, content, location, absolute URL, updated timestamp, and raw JSON.
6. Calculates a freshness score.
7. Logs invalid company slugs and continues syncing the rest.

The Adzuna sync:

1. Requires `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`.
2. Calls `https://api.adzuna.com/v1/api/jobs/{ADZUNA_COUNTRY}/search/1`.
3. Uses `ADZUNA_SEARCH_QUERIES` as a comma-separated query list, or sensible defaults across software, data, product, business, marketing, sales, customer success, operations, and design roles.
4. Uses `ADZUNA_DEFAULT_WHERE` when you want to narrow the import to one country, region, or city.
5. Uses `ADZUNA_RESULTS_PER_QUERY`, default `30`, capped at `50`.
6. Upserts Adzuna companies with an `adzuna-` slug and keeps Greenhouse sync from calling those rows as Greenhouse boards.
7. Stores Adzuna `redirect_url` as the apply/source URL and marks the job source as `adzuna`.

The SerpApi sync:

1. Requires `SERPAPI_API_KEY`.
2. Calls `https://serpapi.com/search?engine=google_jobs`.
3. Uses `SERPAPI_SEARCH_QUERIES` as a comma-separated query list, or 5 broad default queries.
4. Does not paginate by default because each Google Jobs page can cost another search.
5. Uses `SERPAPI_MAX_SEARCHES_PER_SYNC`, default `5`, capped at `10`.
6. Uses `SERPAPI_MONTHLY_LIMIT`, default `220`, capped at `250` to leave safety room on a 250-search plan.
7. Tracks monthly usage in `public.job_source_usage`; run `supabase/migrations/006_job_source_usage.sql` before enabling SerpApi in production.
8. Leaves `no_cache=false` so identical SerpApi searches can use SerpApi cache when available.

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

## Resume Builder

The resume builder at `/resume-builder` lets users create a role-targeted resume with ATS scoring,
keyword coverage checks, impact suggestions, templates, accent colors, and print-ready export.
Resume export is currently free for testing.

## Resume A/B Testing

Users can open `/dashboard/resume-testing` to create two resume versions, log applications against
version A or B, update outcomes as interviews arrive, and compare application-to-interview rates by
resume version and job title. The dashboard also tracks follow-up timing, application channel,
contacts, per-test recommendations, and a funnel from applied to interview to offer.

Run these SQL files in Supabase SQL Editor before using this dashboard in production:

- `supabase/migrations/004_resume_ab_testing.sql`
- `supabase/migrations/005_resume_ab_testing_enhancements.sql`

## Admin User Analytics

Admins can open `/admin/users` to see registered users, paid vs freemium counts, recent signups,
and country breakdowns. Run `supabase/migrations/003_profile_geography.sql` to persist country and
last-seen data on profiles. Country data is captured from production request headers such as
`x-vercel-ip-country`, so existing users may show as unknown until they log in again.

If `/admin/users` shows the admin access page, run `supabase/admin_set_admin.sql` in Supabase SQL
Editor after replacing `you@example.com` with your login email.

## Vercel Deployment

1. Create a Vercel project from this repository.
2. Add the environment variables from `.env.example`.
3. Set `NEXT_PUBLIC_APP_URL` to `https://www.hirevate.com`.
4. Apply Supabase migrations and seed data.
5. Configure the Stripe webhook to point to `https://www.hirevate.com/api/stripe/webhook`.
6. Deploy.

## Search Console and SEO

- Production sitemap: `https://www.hirevate.com/sitemap.xml`
- Production robots file: `https://www.hirevate.com/robots.txt`
- Use a Google Search Console Domain property when possible, then verify with the DNS TXT record Google provides.
- If you use the URL-prefix HTML tag method, copy only the `content` value from Google's meta tag into `GOOGLE_SITE_VERIFICATION` in Vercel Production, then redeploy.
- Keep `/admin`, `/api`, `/auth`, and `/dashboard` private. They are blocked from crawl and marked noindex in page metadata.
- Do not submit protected job detail pages to Google until those pages are publicly visible to anonymous crawlers. The public `/jobs` page is the crawlable jobs discovery page.
- See `docs/search-console.md` for the launch checklist, index request steps, and off-page SEO plan.

## Useful Commands

```bash
npm run dev
npm run build
npm run lint
```
