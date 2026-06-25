"use client";

import { Loader2, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { JobSyncResult } from "@/lib/jobs/sync";

export function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<JobSyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function syncJobs() {
    setIsSyncing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/jobs/sync", {
        method: "POST"
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.error ?? "Unable to sync jobs.");
        return;
      }

      setResult(payload as JobSyncResult);
    } catch (syncError) {
      setError(syncError instanceof Error ? syncError.message : "Unable to sync jobs.");
    } finally {
      setIsSyncing(false);
    }
  }

  return (
    <div className="space-y-5">
      <Button disabled={isSyncing} onClick={syncJobs} size="lg">
        {isSyncing ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <RefreshCcw className="h-4 w-4" aria-hidden="true" />
        )}
        Sync job sources
      </Button>
      {error ? (
        <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {result ? (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-4">
            <Metric label="Companies checked" value={result.totalCompaniesChecked} />
            <Metric label="Jobs inserted" value={result.totalJobsInserted} />
            <Metric label="Jobs updated" value={result.totalJobsUpdated} />
            <Metric label="Stale jobs expired" value={result.totalJobsExpired ?? 0} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {result.sourceResults.map((source) => (
              <div className="rounded-md border border-gray-100 bg-gray-50 p-4" key={source.source}>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold capitalize text-ink-900">
                    {source.source === "serpapi"
                      ? "SerpApi"
                      : source.source === "maintenance"
                        ? "Maintenance"
                        : source.source}
                  </p>
                  <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-ink-500">
                    {source.setupRequired ? "Setup needed" : source.configured ? "Ready" : "Missing env"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm sm:grid-cols-4">
                  <MiniMetric label="Fetched" value={source.totalJobsFetched} />
                  <MiniMetric label="Inserted" value={source.totalJobsInserted} />
                  <MiniMetric label="Updated" value={source.totalJobsUpdated} />
                  {source.totalJobsExpired ? <MiniMetric label="Expired" value={source.totalJobsExpired} /> : null}
                  {source.totalSkipped ? <MiniMetric label="Skipped" value={source.totalSkipped} /> : null}
                </div>
                {typeof source.monthlyLimit === "number" ? (
                  <div className="mt-3 rounded-md border border-amber-100 bg-white px-3 py-2 text-xs text-ink-600">
                    <span className="font-semibold text-ink-900">Quota:</span>{" "}
                    {source.searchesUsed ?? 0}/{source.monthlyLimit} used,{" "}
                    {source.searchesRemaining ?? source.monthlyLimit} remaining this month.
                  </div>
                ) : null}
                {source.skippedReason ? (
                  <div className="mt-3 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
                    <p>{source.skippedReason}</p>
                    {source.setupSqlPath ? (
                      <p className="mt-1 font-mono text-[11px] text-amber-900">
                        SQL file: {source.setupSqlPath}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          {result.errors.length > 0 ? (
            <div className="mt-5">
              <h2 className="text-sm font-semibold text-ink-900">Errors</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink-500">
                {result.errors.map((item) => (
                  <li
                    className="rounded-md bg-gray-50 px-3 py-2"
                    key={`${item.source}-${item.slug ?? item.query ?? item.message}`}
                  >
                    <span className="font-semibold capitalize text-ink-700">{item.source}</span>
                    {item.company ? ` - ${item.company}` : null}
                    {item.slug ? ` (${item.slug})` : null}
                    {item.query ? ` - ${item.query}` : null}: {item.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
      <p className="text-2xl font-semibold text-ink-900">{value}</p>
      <p className="mt-1 text-sm text-ink-500">{label}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-semibold text-ink-900">{value}</p>
      <p className="text-xs text-ink-500">{label}</p>
    </div>
  );
}
