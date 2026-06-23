import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { JobSearchInput } from "@/lib/validators/jobs";

export function JobFilters({ filters }: { filters: JobSearchInput }) {
  return (
    <form className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:grid-cols-[1.2fr_1fr_auto_auto_auto]" action="/jobs">
      <label className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
          Keyword
        </span>
        <Input defaultValue={filters.keyword} name="keyword" placeholder="Frontend, AI, data..." />
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
          Location
        </span>
        <Input defaultValue={filters.location} name="location" placeholder="Remote, New York..." />
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
          Freshness
        </span>
        <select
          className="h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-ink-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
          defaultValue={filters.freshness}
          name="freshness"
        >
          <option value="all">All</option>
          <option value="fresh">Fresh</option>
          <option value="good">Good</option>
        </select>
      </label>
      <label className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
          Sort
        </span>
        <select
          className="h-11 w-full rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-ink-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
          defaultValue={filters.sort}
          name="sort"
        >
          <option value="newest">Newest</option>
          <option value="freshness">Freshness score</option>
        </select>
      </label>
      <div className="flex items-end gap-3">
        <label className="flex h-11 items-center gap-2 rounded-md border border-gray-200 px-3 text-sm font-semibold text-ink-700">
          <input
            className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            defaultChecked={Boolean(filters.remote)}
            name="remote"
            type="checkbox"
            value="on"
          />
          Remote
        </label>
        <Button type="submit" className="h-11">
          <Search className="h-4 w-4" aria-hidden="true" />
          Search
        </Button>
      </div>
    </form>
  );
}
