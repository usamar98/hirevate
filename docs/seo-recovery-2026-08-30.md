# Hirevate indexing investigation and recovery

## Conclusion

The impression decline is reported by the owner, not yet verified against Search Console. Lower Supabase egress alone does not identify the cause. The live site currently serves thousands of jobs, but a sitemap URL returned 404 and several code paths could silently remove or hide valid listings. Those code defects are fixed locally. No production deployment, database mutation or search-engine submission was performed.

## Evidence collected on August 30

- Live sitemap: HTTP 200, 6,673 unique URLs, including 6,623 job URLs. The August 24 cached audit recorded 5,185 total URLs. These counts do **not** prove Google indexed the URLs.
- Live `/jobs`: public server-rendered preview of 10 jobs, reporting 6,623 matching active jobs. Canonical host redirects and robots allow crawling; no site-wide noindex observed.
- A current sitemap entry returned 404/noindex: `https://www.hirevate.com/jobs/senior-product-manager-fx-product-airwallex-sg-singapore-singapore-oxv5ha`. Other sampled job pages were HTTP 200. This is a concrete sitemap/detail inconsistency, not proof that this one URL caused the overall decline.
- Latest Vercel production deployment is Ready at commit `6f93376` (August 24). Runtime-log queries returned no entries; that is not proof of error-free operation or working cron runs.
- Vercel lists the required Supabase/provider/cron environment-variable names, but all 33 production values are protected and cannot be pulled. Local environment files contain empty Supabase values; this does not establish missing values in production.
- The connected Supabase integration exposes another application's project, not Hirevate. It was not modified.
- Read-only inspection of the **historical July 21 migration target**, `qhcxtoknyrcbeepgxrad`, found 4,157 active jobs, latest `last_seen_at` August 21, zero refreshed within five days, a missing `companies.prominence_rank` column, and an active ten-day deletion cron with successful runs. This differs from live-site counts and **must not be assumed to be the current deployment's database**. Existing SELECT grants are present there. No changes were applied to it.
- Search Console, GA4 and field Core Web Vitals access are unavailable. No current SEO score or causal traffic attribution is claimed.

## Fixes implemented

1. Public job reads now throw on database errors instead of caching empty lists, zero counts or false “not found” results. Genuine missing records still return not-found. Production missing configuration fails loudly. Cache namespaces include the Supabase URL so a database migration cannot reuse another project's cached data.
2. Job URL resolution uses a shared, paginated, ID-only index, preserving the existing UUID-derived URL tokens. It no longer searches only the first 250 title matches, and supports edited titles and accents. Rare token collisions require an exact canonical match. **Preserve existing job UUIDs during any database migration**; fresh UUIDs still create different URLs.
3. Sitemap query errors reject the whole refresh rather than publishing a partial sitemap. A stable ID tie-breaker makes pagination deterministic. Hub lastmod timestamps are omitted when a real change date is unknown; individual jobs use updated/discovered dates, not repeated sighting dates.
4. Application cleanup can delete only already-expired jobs older than a minimum 30-day recovery window. It cannot delete active jobs for missed refreshes. Duplicate expiry records its transition time. Real employer-closure checks remain in place; no timestamps or listings are fabricated.
5. ATS batches advance by a whole batch. Daily provider priority rotates, including Spain, so the same tail providers are not always skipped. The existing conservative time budget is retained. In-flight source requests still rely on existing request timeouts, not hard cancellation.
6. Cron reports healthy/partial/failed explicitly; no successful discovery means HTTP 503. Planner estimates and maintenance activity cannot masquerade as refreshed sources. Job changes, including expiry, invalidate public-job caches.
7. Spain country routing, filters, aliases/cities, country preference and Adzuna Spain discovery are added. `/jobs/country/spain` is noindex and excluded from the sitemap while inventory is empty. No fixed volume or daily refresh is promised. See `spain-job-coverage.md` for configuration.

## Required production rollout (not yet done)

1. Confirm the actual Supabase project URL used by the current Vercel production deployment. Connect that project or provide its credentials through secure local environment configuration, never chat. Do not apply changes to the old migration target merely because its credentials still work.
2. Check job counts, newest successful refresh, source failures, `companies.prominence_rank`, explicit API grants and RLS in that exact database. Apply missing existing schema migrations only after reconciling migration history; do not disable RLS or grant broad access.
3. Apply `supabase/migrations/20260830132951_disable_unsafe_active_job_retention.sql` to the confirmed production project. It unschedules only `hirevate-delete-jobs-older-than-10-days`, changes no rows and does not touch unrelated cron jobs. The application fix alone cannot stop the independent database cron. Previously deleted rows are not restored by this migration.
4. Review and release this code. Add `es` to an existing explicit `ADZUNA_COUNTRIES` allowlist (for example `us,au,es`) and ensure valid Adzuna credentials. Verify a successful Spain import; configuration alone does not populate listings.
5. Check `/api/cron/jobs-sync` with the authorized cron secret after deployment, source health and timestamps. A provider can return a valid empty result; HTTP success alone is not enough to establish freshness coverage.
6. Recheck the sitemap and a stratified sample of old/new job URLs. Inspect the cited 404, canonical redirects and structured-data eligibility. Do not emit JobPosting for closed, unverifiable or truncated listings just to obtain rich results.
7. In Google Search Console, compare the last 28 days with the previous 28 days and inspect the exact decline date. Segment by page, query, country, device and search appearance; inspect affected old URLs. Review Page indexing, Crawl stats, Manual actions and Security issues. Submit the corrected sitemap only after live checks pass.

## Verification

- `npm run lint`
- `npx tsc --noEmit --incremental false`
- `node --test scripts/test-job-sync-health.cjs scripts/test-job-sync-safety.cjs scripts/test-spain-jobs.cjs scripts/test-public-job-reads.cjs`
- `scripts/check-job-data-health.mjs` provides read-only, low-egress API diagnostics. It prints only configuration presence, public hostname, counts, timestamps and error codes. It does not print keys, personal records or job descriptions. Vercel protected values must be supplied through an approved secure environment; `vercel env run` cannot recover protected values.
- A production-config build correctly refuses to publish an empty sitemap without Supabase credentials. Local preview-config compilation is separate from production data verification.
- At larger inventory sizes, shard the ID index and sitemap data cache: Next's individual cache-entry size limit can prevent oversized entries from being retained. No full job descriptions are fetched for URL resolution.

## Recovery expectations

Fixing these defects improves reliability; it cannot guarantee a return to 200–300 daily impressions. Google must recrawl and reassess affected pages, and demand/ranking changes may also contribute. Evaluate complete weekly windows, not a few low-volume days.

Sources: [Google's traffic-drop investigation guide](https://developers.google.com/search/docs/monitor-debug/debugging-search-traffic-drops), [Google's HTTP-status guidance](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes), [Supabase Data API access controls](https://supabase.com/docs/guides/api/securing-your-api). These explain diagnostic principles, not proof of this site's historical cause.
