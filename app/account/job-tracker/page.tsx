import type { Metadata } from "next";
import JobTrackerPage from "@/app/dashboard/job-tracker/page";

export const metadata: Metadata = {
  title: "Account Job Tracker",
  description: "Manage job applications attached to your Hirevate account.",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default JobTrackerPage;
