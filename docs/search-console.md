# Hirevate Search Console SEO Checklist

Use this after every production deploy to help Google discover the right pages and avoid private app URLs.

## 1. Verify Ownership

Preferred method:

1. Open Google Search Console.
2. Add a `Domain` property for `hirevate.com`.
3. Add the DNS TXT record Google gives you at your domain DNS provider.
4. Click `Verify` after DNS propagation.

Fallback method:

1. Add a `URL-prefix` property for `https://www.hirevate.com/`.
2. Choose the HTML tag method.
3. Copy only the `content` value from the Google meta tag.
4. Add it in Vercel Production as `GOOGLE_SITE_VERIFICATION`.
5. Redeploy production, then click `Verify`.

## 2. Submit Crawl Files

Submit these in Search Console:

- Sitemap: `https://www.hirevate.com/sitemap.xml`
- Robots: `https://www.hirevate.com/robots.txt`
- LLM context for AI crawlers: `https://www.hirevate.com/llms.txt`
- AI crawler guide: `https://www.hirevate.com/ai.txt`

The sitemap includes public acquisition pages, category pages, and active public job detail pages:

- `https://www.hirevate.com/`
- `https://www.hirevate.com/about`
- `https://www.hirevate.com/jobs`
- `https://www.hirevate.com/jobs/latest`
- `https://www.hirevate.com/jobs/remote`
- `https://www.hirevate.com/jobs/london`
- `https://www.hirevate.com/jobs/engineering`
- `https://www.hirevate.com/jobs/software-engineer`
- `https://www.hirevate.com/jobs/product-manager`
- `https://www.hirevate.com/jobs/data-analyst`
- `https://www.hirevate.com/jobs/customer-success`
- `https://www.hirevate.com/resume-builder`
- `https://www.hirevate.com/cover-letter`
- `https://www.hirevate.com/pricing`
- active `/jobs/{slug}` detail URLs

Private URLs are excluded:

- `/admin/*`
- `/api/*`
- `/auth/*`
- `/dashboard/*`
- `/login`
- `/signup`

Job detail pages are public and can be included in the sitemap. Google job rich results require the
page content to be visible and match the structured data.

## 3. Inspect Key URLs

Use Search Console URL Inspection for:

- `https://www.hirevate.com/`
- `https://www.hirevate.com/about`
- `https://www.hirevate.com/jobs`
- `https://www.hirevate.com/jobs/latest`
- `https://www.hirevate.com/jobs/remote`
- `https://www.hirevate.com/resume-builder`
- `https://www.hirevate.com/cover-letter`
- `https://www.hirevate.com/pricing`

After inspection, click `Request indexing` for each public URL.

## 4. Monitor Reports

Check these weekly:

- Pages: confirm the sitemap URLs are indexed and private URLs are not indexed.
- Sitemaps: confirm `sitemap.xml` is discovered and read successfully.
- Core Web Vitals: watch mobile LCP, INP, and CLS.
- HTTPS: confirm all public URLs are served over HTTPS.
- Manual actions and Security issues: confirm no warnings.

## 5. On-Page SEO Targets

Primary positioning:

- Hidden jobs
- Direct apply jobs
- Fresh job listings
- Resume builder
- Cover letter builder
- Application tracking

Public pages to improve over time:

- `/jobs`: keep the explanatory copy and FAQ aligned with real source behavior and freshness scoring.
- `/jobs/latest`: monitor that recent jobs remain public and return 200 status.
- `/resume-builder`: add examples of ATS scoring, keyword coverage, and export output.
- `/cover-letter`: add examples of role-targeted cover letter structure.
- `/pricing`: keep the FAQ aligned with Silver, Gold, and Platinum pricing.

## 6. Off-Page SEO Plan

Start with quality signals, not bulk backlinks:

- Create a public changelog or blog later for job-search guides and product updates.
- Publish one high-quality guide per week around hidden jobs, direct-apply workflows, resume building, cover letters, and application tracking.
- List Hirevate on relevant startup, SaaS, and job-search directories.
- Build partnerships with resume writers, career coaches, bootcamps, and university career centers.
- Share data-backed posts from aggregated job source trends without exposing private user data.
- Add consistent brand profiles on LinkedIn, X, YouTube, Product Hunt, and relevant founder directories.
- Use branded anchor text naturally: `Hirevate`, `Hirevate hidden jobs`, and `direct apply jobs`.

Avoid buying links, mass directory spam, copied AI articles, or hidden text. Those can create ranking risk instead of durable search growth.
