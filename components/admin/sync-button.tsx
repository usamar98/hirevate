"use client";

import { Loader2, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SyncResult } from "@/lib/jobs/greenhouse";

export function SyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
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

      setResult(payload as SyncResult);
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
        Sync Greenhouse Jobs
      </Button>
      {error ? (
        <div className="rounded-md border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}
      {result ? (
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Companies checked" value={result.totalCompaniesChecked} />
            <Metric label="Jobs inserted" value={result.totalJobsInserted} />
            <Metric label="Jobs updated" value={result.totalJobsUpdated} />
          </div>
          {result.errors.length > 0 ? (
            <div className="mt-5">
              <h2 className="text-sm font-semibold text-ink-900">Errors</h2>
              <ul className="mt-3 space-y-2 text-sm text-ink-500">
                {result.errors.map((item) => (
                  <li className="rounded-md bg-gray-50 px-3 py-2" key={`${item.slug}-${item.message}`}>
                    {item.company} ({item.slug}): {item.message}
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
