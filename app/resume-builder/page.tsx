import type { Metadata } from "next";
import { ResumeBuilder } from "@/components/resume/resume-builder";

export const metadata: Metadata = {
  title: "Resume Builder"
};

export default async function ResumeBuilderPage() {
  return <ResumeBuilder />;
}
