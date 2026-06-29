import type { Metadata } from "next";
import { JobCategoryLandingPage } from "@/components/jobs/category-landing-page";
import { jobCategoryPages } from "@/lib/jobs/categories";

const category = jobCategoryPages["software-engineer"];

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    absolute: category.title
  },
  description: category.description,
  alternates: {
    canonical: category.path
  },
  openGraph: {
    title: category.title,
    description: category.description,
    url: category.path
  },
  twitter: {
    title: category.title,
    description: category.description
  }
};

export default function SoftwareEngineerJobsPage() {
  return <JobCategoryLandingPage category={category} />;
}
