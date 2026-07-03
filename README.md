# Hirevate Hidden Jobs

Production-ready MVP SaaS for discovering fresh direct-apply roles from official company hiring sources.

## Scope

This MVP started with hidden job discovery from Greenhouse public boards and now supports multiple
hiring sources.

It includes hidden job discovery, resume building, cover letters, application tracking, admin
analytics, and Stripe subscriptions. It does not use LinkedIn scraping, Indeed scraping,
protected-site scraping, or auto-apply flows.

## Daily job sync

Vercel runs the protected cron endpoint `/api/cron/jobs-sync` every day at `04:00 UTC`. Set
`CRON_SECRET` in Vercel production environment variables. `JOB_SYNC_SECRET` is accepted as a
fallback for compatibility with the manual admin sync endpoint.

The daily fresh-jobs algorithm:

1. Builds a UTC-day query plan from broad role categories.
2. Rotates the query window daily so Hirevate does not import the same hardcoded job mix forever.
3. Refreshes official ATS/company boards from Greenhouse, Ashby, and Lever.
4. Pulls recent Adzuna jobs with `sort_by=date` and a configurable `max_days_old` window.
5. Checks source health before requests and skips sources that are cooling down.
6. Records source successes, failures, average jobs fetched, and jobs inserted today.
7. Expires stale jobs and removes duplicates after the import.

Freshness controls:

- `DAILY_FRESH_JOB_QUERIES` overrides the rotating role pool. Separate values with commas, semicolons, or new lines.
- `DAILY_FRESH_ADZUNA_QUERY_COUNT` defaults to `8`, capped at `20`.
- `DAILY_FRESH_MAX_DAYS_OLD` defaults to `3` and controls recent Adzuna targeting.
- `DAILY_FRESH_STALE_DAYS` defaults to `45` and expires old active jobs during maintenance.
- `ADZUNA_MAX_DAYS_OLD` defaults to `7` for broader/manual Adzuna sync behavior.
- Run `supabase/migrations/008_job_source_health.sql` to enable source health tracking.

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
CRON_SECRET=
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
ADZUNA_COUNTRY=us
ADZUNA_SEARCH_QUERIES=
ADZUNA_DEFAULT_WHERE=
ADZUNA_RESULTS_PER_QUERY=30
ADZUNA_MAX_DAYS_OLD=7
DAILY_FRESH_JOB_QUERIES=
DAILY_FRESH_ADZUNA_QUERY_COUNT=8
DAILY_FRESH_MAX_DAYS_OLD=3
DAILY_FRESH_STALE_DAYS=45
LEVER_COMPANY_SLUGS=
LEVER_EU_COMPANY_SLUGS=
LEVER_MAX_COMPANIES_PER_SYNC=100
GOOGLE_SITE_VERIFICATION=
SUPER_LOGIN_USERNAME=
SUPER_LOGIN_EMAIL=
SUPER_LOGIN_PASSWORD=
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

The admin sync page and protected sync endpoint import jobs from Greenhouse, Ashby, Lever, and Adzuna. Public `/jobs` searches read from Supabase only, so user traffic does not spend external API credits. Source health tracking records each board/query result and temporarily cools down repeated failures. Set `JOB_SYNC_SECRET` in production if you want to trigger sync without
a browser admin session:

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


The Ashby sync:

1. Uses Ashby's public job posting API and does not require an API key.
2. Starts with a bundled curated list of validated public Ashby boards.
3. Add more boards to Vercel as `ASHBY_COMPANY_SLUGS`, for example
   `openai=OpenAI,perplexity=Perplexity,loop-earplugs=Loop`.
4. Accepts raw slugs like `openai`, named slugs like `openai=OpenAI`, or Ashby URLs like
   `https://jobs.ashbyhq.com/openai`.
5. Calls `https://api.ashbyhq.com/posting-api/job-board/{slug}?includeCompensation=true`.
6. Uses `ASHBY_MAX_COMPANIES_PER_SYNC`, default `140`, capped at `300`, to keep scheduled syncs
   inside serverless runtime limits.
7. Inserts Ashby companies with an `ashby-` slug so Greenhouse sync never crawls them as
   Greenhouse boards.
8. Stores Ashby job/apply URLs, workplace type, compensation metadata, descriptions, locations,
   published timestamps, and raw JSON.
9. Expires Ashby jobs that disappear from a successful board refresh, so stale postings leave the
   public feed faster than the global stale-job window.

The Lever sync:

1. Requires only company slugs, not an API key.
2. Add slugs to Vercel as `LEVER_COMPANY_SLUGS`, for example
   `linear=Linear,netlify=Netlify,posthog=PostHog`.
3. Add EU-hosted Lever boards to `LEVER_EU_COMPANY_SLUGS`, or prefix a single entry with `eu:`.
4. Accepts raw slugs like `linear`, named slugs like `linear=Linear`, or Lever career URLs like
   `https://jobs.lever.co/linear`.
5. Calls `https://api.lever.co/v0/postings/{site}?mode=json` for global boards and
   `https://api.eu.lever.co/v0/postings/{site}?mode=json` for EU boards.
6. Uses `LEVER_MAX_COMPANIES_PER_SYNC`, default `100`, capped at `500`, to keep scheduled syncs
   inside serverless runtime limits.
7. Upserts Lever companies with a `lever-` slug so Greenhouse sync never tries to crawl them as
   Greenhouse boards.
8. Stores Lever hosted/apply URLs, workplace type, salary range metadata, descriptions, lists, and
   raw JSON.

Greenhouse company boards that return `404` or `410` are treated as inactive career boards. The
sync disables those company records so future runs do not keep retrying dead boards or filling the
admin screen with expected provider noise.

Freshness scoring starts at 50:

- +25 when `updated_at` is within 7 days
- +15 when location exists
- +10 when apply/source URL exists
- +10 when the title includes software/dev/engineer/frontend/backend/fullstack/AI/data
- Max 100

## Free Plan Limits

- Free users can view 10 job detail pages per UTC day.
- Free users can save 5 jobs.
- Paid Silver, Gold, and Platinum users have unlimited job views and saved jobs.

## Resume Builder

The resume builder at `/resume-builder` lets users create a role-targeted resume with ATS scoring,
keyword coverage checks, impact suggestions, templates, accent colors, and print-ready export.
Resume export is currently free for testing.

## Application Tracker And Cover Letters

Users can open `/dashboard/job-tracker` to track interested, applied, interview, offer, rejected,
and withdrawn roles with notes, follow-up dates, salary range, and source URLs. The public
`/cover-letter` tool helps users create role-targeted cover letters before they apply directly on
the employer page.

## Admin User Analytics

Admins can open `/admin/users` to see registered users, paid vs freemium counts, recent signups,
and country breakdowns. Run `supabase/migrations/003_profile_geography.sql` to persist country and
last-seen data on profiles. Country data is captured from production request headers such as
`x-vercel-ip-country`, so existing users may show as unknown until they log in again.

If `/admin/users` shows the admin access page, run `supabase/admin_set_admin.sql` in Supabase SQL
Editor after replacing `you@example.com` with your login email.

## Super Login Test Account

The app supports one username-based super login for testing free and paid behavior without storing a
test password in the repository.

Set these environment variables in the environment where you run the setup script:

```bash
SUPER_LOGIN_USERNAME=<private test username>
SUPER_LOGIN_EMAIL=<private test email>
SUPER_LOGIN_PASSWORD=<set a private test password>
```

Then run:

```bash
npm run setup:super-login
```

The script creates or updates the Supabase auth user, confirms the email, upserts the matching
profile as `role = 'admin'`, and starts the account with `subscription_status = 'active'`.

On `/login`, enter the username instead of the mapped email. After login, the dashboard shows a
`Super login test mode` panel where this account can switch between free limits and paid access
without touching Stripe.

In production, the server can also create/update the super login automatically during login when
all three private env vars are set. Keep those values in Vercel Production environment variables,
not in committed files.

## Vercel Deployment

1. Create a Vercel project from this repository.
2. Add the environment variables from `.env.example`.
3. Set `NEXT_PUBLIC_APP_URL` to `https://www.hirevate.com`.
4. Apply Supabase migrations and seed data.
5. Configure the Stripe webhook to point to `https://www.hirevate.com/api/stripe/webhook`.
6. Set `CRON_SECRET` to a strong random value. Vercel Cron uses it as
   `Authorization: Bearer <CRON_SECRET>` for scheduled sync calls.
7. Deploy.

`vercel.json` runs `/api/cron/jobs-sync` daily at `04:00 UTC` (09:00 Pakistan time). The same daily
fresh planner can be triggered manually from `/admin/jobs-sync` by an admin. Each run rotates role
searches and expires stale active jobs.

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
