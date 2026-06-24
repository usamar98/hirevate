import type { Metadata } from "next";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Admin Access Required"
};

export default async function AdminNoAccessPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser("/admin/no-access");
  const params = await searchParams;
  const from = typeof params?.from === "string" ? params.from : "/admin/users";

  return (
    <section className="bg-gray-50 py-14">
      <div className="container-shell max-w-2xl">
        <Card className="p-6">
          <ShieldAlert className="h-10 w-10 text-amber-600" aria-hidden="true" />
          <h1 className="mt-5 text-3xl font-semibold text-ink-900">Admin access required</h1>
          <p className="mt-3 text-base leading-7 text-ink-500">
            Your account is signed in, but it is not marked as an admin profile yet. Update your
            profile role in Supabase, then reopen the admin dashboard.
          </p>
          <div className="mt-6 rounded-md border border-gray-200 bg-gray-50 p-4 font-mono text-sm text-ink-700">
            <span>Requested: {from}</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild href="/dashboard" variant="secondary">
              Open dashboard
            </Button>
            <Button asChild href="/admin/users" variant="outline">
              Try admin users
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}
