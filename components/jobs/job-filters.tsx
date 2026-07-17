import { RotateCcw, Search } from "lucide-react";
import { CountryPreferenceSelect } from "@/components/jobs/country-preference-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { jobCountries } from "@/lib/jobs/countries";
import type { JobSearchInput } from "@/lib/validators/jobs";

const fieldLabelClassName = "text-xs font-semibold uppercase text-ink-500";
const selectClassName =
  "h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-ink-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100";

export function JobFilters({ filters }: { filters: JobSearchInput }) {
  return (
    <form className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm" action="/jobs">
      <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr]">
        <label className="space-y-1.5">
          <span className={fieldLabelClassName}>Role or keyword</span>
          <Input
            defaultValue={filters.keyword}
            name="keyword"
            placeholder="Product manager, nurse, sales..."
          />
        </label>
        <label className="space-y-1.5">
          <span className={fieldLabelClassName}>Company</span>
          <Input defaultValue={filters.company} name="company" placeholder="Stripe, Shopify..." />
        </label>
        <label className="space-y-1.5">
          <span className={fieldLabelClassName}>Location</span>
          <Input defaultValue={filters.location} name="location" placeholder="Remote, London..." />
        </label>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[repeat(5,minmax(0,1fr))_auto]">
        <label className="space-y-1.5">
          <span className={fieldLabelClassName}>Country</span>
          <CountryPreferenceSelect className={selectClassName} defaultValue={filters.country}>
            <option value="all">All countries</option>
            {jobCountries.map((country) => (
              <option key={country.slug} value={country.slug}>
                {country.name}
              </option>
            ))}
          </CountryPreferenceSelect>
        </label>
        <label className="space-y-1.5">
          <span className={fieldLabelClassName}>Work mode</span>
          <select className={selectClassName} defaultValue={filters.workMode} name="workMode">
            <option value="any">Any</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </select>
        </label>
        <label className="space-y-1.5">
          <span className={fieldLabelClassName}>Added</span>
          <select className={selectClassName} defaultValue={filters.postedWithin} name="postedWithin">
            <option value="all">Any time</option>
            <option value="24h">Past 24 hours</option>
            <option value="7d">Past 7 days</option>
            <option value="14d">Past 14 days</option>
            <option value="30d">Past 30 days</option>
          </select>
        </label>
        <label className="space-y-1.5">
          <span className={fieldLabelClassName}>Freshness</span>
          <select className={selectClassName} defaultValue={filters.freshness} name="freshness">
            <option value="all">Any score</option>
            <option value="fresh">90+ fresh</option>
            <option value="good">70+ good</option>
          </select>
        </label>
        <label className="space-y-1.5">
          <span className={fieldLabelClassName}>Sort</span>
          <select className={selectClassName} defaultValue={filters.sort} name="sort">
            <option value="newest">Newest first</option>
            <option value="freshness">Freshest first</option>
            <option value="updated">Recently updated</option>
          </select>
        </label>
        <div className="flex items-end gap-2">
          <Button type="submit" className="h-11">
            <Search className="h-4 w-4" aria-hidden="true" />
            Search
          </Button>
          <Button asChild href="/jobs" className="h-11" variant="outline">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Reset
          </Button>
        </div>
      </div>
    </form>
  );
}
