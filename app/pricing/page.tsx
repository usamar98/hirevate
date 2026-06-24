import type { Metadata } from "next";
import { PricingCards } from "@/components/pricing/pricing-cards";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Pricing"
};

export default async function PricingPage() {
  const user = await getCurrentUser();

  return (
    <section className="bg-gray-50 py-12">
      <div className="container-shell">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold text-ink-900">Pricing</h1>
          <p className="mt-3 text-base leading-7 text-ink-500">
            Upgrade for unlimited hidden jobs, or build a role-targeted resume and export it for $2
            when it is ready.
          </p>
        </div>
        <div className="mt-8">
          <PricingCards isLoggedIn={Boolean(user)} />
        </div>
      </div>
    </section>
  );
}
