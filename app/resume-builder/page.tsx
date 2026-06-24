import type { Metadata } from "next";
import { ResumeBuilder } from "@/components/resume/resume-builder";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Resume Builder"
};

export default async function ResumeBuilderPage() {
  const user = await getCurrentUser();

  return <ResumeBuilder isLoggedIn={Boolean(user)} />;
}
