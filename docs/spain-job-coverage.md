# Spain job coverage

Spain is available at `/jobs/country/spain` and in the shared country selector.
Selecting Spain persists the existing country-preference cookie; `ES` geo headers
can suggest it, while crawlers keep the all-country default. This country selection
is separate from the Spanish interface language and does not include all
Spanish-speaking countries.

## Enable real ingestion

The existing Adzuna connector supports the `es` search endpoint. For a deployment
that already sets `ADZUNA_COUNTRIES=us,au`, append `es`:

```text
ADZUNA_COUNTRIES=us,au,es
```

An explicit market list remains authoritative. When the variable is absent, the
fallback includes the legacy `ADZUNA_COUNTRY`, Australia and Spain. Valid
`ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, Supabase service credentials and a successful
normal sync are required to populate listings. No new database schema is required.
Existing public ATS sources can also contribute roles with Spanish locations.

For Spain, recognised role searches mix Spanish and English terms within the
existing request count. Custom search terms remain unchanged. Provider location
text is qualified with Spain when necessary so city-only and Spain-based remote
results do not disappear from the country filter. Listings and application links
always come from real source responses; no sample jobs are inserted.

Provider availability, request budgets and source health can limit coverage.
The Spain page does not promise a daily listing count or imply that every remote
job accepts applicants outside Spain. Check the sync's `adzuna-es` source result
and public Spain page after deployment before describing coverage as established.
An empty Spain page uses `noindex, follow`; it becomes indexable when the country
query returns an available listing.

## Regression checks

Run `node --test scripts/test-spain-jobs.cjs`. The tests exercise real country,
preference, provider-market and country-page metadata code with external services
mocked. They do not read credentials or mutate a database.
