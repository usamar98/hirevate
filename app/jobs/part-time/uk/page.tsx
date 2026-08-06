import type { Metadata } from "next";
import { StudentJobsLandingPage } from "@/components/jobs/student-jobs-landing-page";
import { studentJobsPages } from "@/lib/jobs/student-pages";
import { defaultOgImagePath } from "@/lib/seo";

const config = studentJobsPages.partTimeUk;
export const revalidate = 1800;
export const metadata: Metadata = {
  title: { absolute: config.title }, description: config.description,
  alternates: { canonical: config.path },
  openGraph: { title: config.title, description: config.description, url: config.path, images: [defaultOgImagePath] },
  twitter: { card: "summary_large_image", title: config.title, description: config.description, images: [defaultOgImagePath] }
};
export default function UkPartTimeJobsPage() { return <StudentJobsLandingPage config={config} />; }
