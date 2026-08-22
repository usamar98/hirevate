import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { TrialStarter } from "@/components/trial/trial-starter";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Start Free Trial",
  robots: {
    index: false,
    follow: false
  }
};

type TrialStartSearchParams = Record<string, string | string[] | undefined>;

function getSafeRedirect(value: string | string[] | undefined) {
  const redirectTo = Array.isArray(value) ? value[0] : value;
  if (!redirectTo?.startsWith("/") || redirectTo.startsWith("//")) return "/jobs";

  const pathname = redirectTo.split(/[?#]/, 1)[0];
  return pathname === "/trial/start" ? "/jobs" : redirectTo;
}

export default async function TrialStartPage({
  searchParams
}: {
  searchParams?: Promise<TrialStartSearchParams>;
}) {
  const [params, user] = await Promise.all([
    searchParams ?? Promise.resolve<TrialStartSearchParams>({}),
    getCurrentUser()
  ]);
  const redirectTo = getSafeRedirect(params.redirect);

  if (!user) {
    const returnTo = `/trial/start?redirect=${encodeURIComponent(redirectTo)}`;
    redirect(`/signup?redirect=${encodeURIComponent(returnTo)}`);
  }

  return (
    <section className="bg-gray-50 py-16">
      <div className="container-shell max-w-lg">
        <TrialStarter redirectTo={redirectTo} />
      </div>
    </section>
  );
}
