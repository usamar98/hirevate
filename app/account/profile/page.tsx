import type { Metadata } from "next";
import Link from "next/link";
import { ProfileSettingsForm } from "@/components/account/profile-settings-form";
import { getProfile, requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Account Profile",
  description: "Update your Hirevate profile and password.",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

function getSuggestedUsername(email: string | undefined, userId: string) {
  const candidate = (email?.split("@")[0] ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .slice(0, 40);
  return candidate.length >= 3 ? candidate : `user-${userId.slice(0, 8)}`;
}

export default async function AccountProfilePage() {
  const user = await requireUser("/account/profile");
  const profile = await getProfile(user.id);
  const metadataUsername =
    typeof user.user_metadata?.username === "string" ? user.user_metadata.username : undefined;

  return (
    <section className="bg-gray-50 py-12">
      <div className="container-shell max-w-5xl">
        <Link className="text-sm font-semibold text-brand-700" href="/jobs">
          Jobs
        </Link>
        <h1 className="mt-3 text-4xl font-semibold text-ink-900">Profile settings</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-ink-500">
          Update your identity, login details, location, and password.
        </p>
        <ProfileSettingsForm
          defaultValues={{
            fullName: profile?.full_name ?? user.user_metadata?.full_name ?? "",
            username:
              profile?.username ?? metadataUsername ?? getSuggestedUsername(user.email, user.id),
            email: user.email ?? profile?.email ?? "",
            countryName: profile?.country_name ?? user.user_metadata?.country_name ?? ""
          }}
        />
      </div>
    </section>
  );
}
