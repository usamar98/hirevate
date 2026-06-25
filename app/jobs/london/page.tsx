import type { Metadata } from "next";
import { JobCategoryLandingPage } from "@/components/jobs/category-landing-page";
import { jobCategoryPages } from "@/lib/jobs/categories";

const category = jobCategoryPages.london;

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

export default function LondonJobsPage() {
  return <JobCategoryLandingPage category={category} />;
}
