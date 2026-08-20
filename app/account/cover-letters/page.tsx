import type { Metadata } from "next";
import { CoverLetterBuilder } from "@/components/cover-letter/cover-letter-builder";
import { getProfile, hasPremiumAccess, requireUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Account Cover Letters",
  description: "Create job-specific cover letters from your Hirevate account.",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default async function AccountCoverLettersPage() {
  const user = await requireUser("/account/cover-letters");
  const profile = await getProfile(user.id);

  return (
    <CoverLetterBuilder
      canUseAi={hasPremiumAccess(profile)}
      isAuthenticated
    />
  );
}
