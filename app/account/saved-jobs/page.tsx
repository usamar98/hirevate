import type { Metadata } from "next";
import SavedJobsPage from "@/app/dashboard/saved/page";

export const metadata: Metadata = {
  title: "Saved Jobs",
  description: "Review the jobs saved to your Hirevate account.",
  robots: { index: false, follow: false }
};

export const dynamic = "force-dynamic";

export default SavedJobsPage;
