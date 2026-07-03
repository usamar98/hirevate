import type { Metadata } from "next";
import { SyncButton } from "@/components/admin/sync-button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Admin Job Sync",
  robots: {
    index: false,
    follow: false
  }
};

const adminJobsSyncPath = "/admin/jobs-sync";

export default async function AdminJobsSyncPage() {
  await requireAdmin(adminJobsSyncPath);

  return (
    <section className="bg-gray-50 py-10">
      <div className="container-shell max-w-4xl">
        <div>
          <h1 className="text-4xl font-semibold text-ink-900">Admin job sync</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-ink-500">
            Run the daily fresh-jobs algorithm across company career pages, public ATS boards,
            Adzuna, and Lever. Production rotates role searches every
            day at 04:00 UTC through the protected Vercel cron endpoint.
          </p>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="p-4">
            <p className="text-sm font-semibold text-ink-900">Automatic refresh</p>
            <p className="mt-2 text-sm leading-6 text-ink-500">Runs daily at 04:00 UTC on production.</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-semibold text-ink-900">Freshness algorithm</p>
            <p className="mt-2 text-sm leading-6 text-ink-500">Rotates role searches and keeps imports inside a recent window.</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-semibold text-ink-900">Source health</p>
            <p className="mt-2 text-sm leading-6 text-ink-500">Cools down failing boards and queries before they waste sync time.</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-semibold text-ink-900">Cron endpoint</p>
            <p className="mt-2 break-words font-mono text-xs text-ink-500">/api/cron/jobs-sync</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-semibold text-ink-900">Required secret</p>
            <p className="mt-2 font-mono text-xs text-ink-500">CRON_SECRET or JOB_SYNC_SECRET</p>
          </Card>
        </div>

        <Card className="mt-8 p-6">
          <SyncButton />
        </Card>
      </div>
    </section>
  );
}
