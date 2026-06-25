import type { Metadata } from "next";
import { SyncButton } from "@/components/admin/sync-button";
import { Card } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Admin Job Sync"
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
            Pull active roles from Greenhouse and Adzuna, then upsert them into Supabase.
          </p>
        </div>
        <Card className="mt-8 p-6">
          <SyncButton />
        </Card>
      </div>
    </section>
  );
}
