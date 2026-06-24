import type { Metadata } from "next";
import { CreditCard, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getStripeAccountStatus } from "@/lib/admin/stripe";
import { requireAdmin } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Admin Stripe"
};

export const dynamic = "force-dynamic";

const adminStripePath = "/admin/stripe";

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
      <span className="text-sm font-medium text-ink-500">{label}</span>
      <span className="text-right font-mono text-sm text-ink-900">{value}</span>
    </div>
  );
}

export default async function AdminStripePage() {
  await requireAdmin(adminStripePath);
  const status = await getStripeAccountStatus();
  const accountName =
    status.account?.dashboardName ||
    status.account?.businessName ||
    status.account?.statementDescriptor ||
    "Not available";

  return (
    <section className="bg-gray-50 py-10">
      <div className="container-shell max-w-4xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-semibold text-ink-900">Stripe account</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-ink-500">
              Verify which Stripe account production checkout is connected to.
            </p>
          </div>
          <Button asChild href="/pricing" variant="outline">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Test checkout
          </Button>
        </div>

        {status.error ? (
          <Card className="border-red-200 bg-red-50 p-5 text-sm leading-6 text-red-700">
            {status.error}
          </Card>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5">
            <CreditCard className="h-5 w-5 text-brand-600" aria-hidden="true" />
            <p className="mt-4 text-sm font-semibold text-ink-500">Connected account</p>
            <p className="mt-2 text-2xl font-semibold text-ink-900">{accountName}</p>
            <p className="mt-1 font-mono text-sm text-ink-500">
              {status.account?.id ?? "Missing Stripe secret"}
            </p>
          </Card>
          <Card className="p-5">
            <KeyRound className="h-5 w-5 text-amber-600" aria-hidden="true" />
            <p className="mt-4 text-sm font-semibold text-ink-500">Key mode</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={status.secretKeyMode === "live" ? "green" : "gray"}>
                Secret: {status.secretKeyMode}
              </Badge>
              <Badge tone={status.publishableKeyMode === "live" ? "green" : "gray"}>
                Public: {status.publishableKeyMode}
              </Badge>
            </div>
          </Card>
          <Card className="p-5">
            <ShieldCheck className="h-5 w-5 text-emerald-600" aria-hidden="true" />
            <p className="mt-4 text-sm font-semibold text-ink-500">Readiness</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={status.webhookConfigured ? "green" : "gray"}>
                Webhook {status.webhookConfigured ? "set" : "missing"}
              </Badge>
              <Badge tone={status.account?.chargesEnabled ? "green" : "gray"}>
                Charges {status.account?.chargesEnabled ? "on" : "off"}
              </Badge>
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <h2 className="text-xl font-semibold text-ink-900">Stripe details</h2>
          <div className="mt-4">
            <StatusRow label="Dashboard display name" value={status.account?.dashboardName ?? "Not set"} />
            <StatusRow label="Business profile name" value={status.account?.businessName ?? "Not set"} />
            <StatusRow
              label="Statement descriptor"
              value={status.account?.statementDescriptor ?? "Not set"}
            />
            <StatusRow label="Country" value={status.account?.country ?? "Not available"} />
            <StatusRow
              label="Payouts"
              value={status.account?.payoutsEnabled ? "Enabled" : "Not enabled"}
            />
          </div>
        </Card>
      </div>
    </section>
  );
}
