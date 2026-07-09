import type { Metadata } from "next";
import { defaultOgImagePath } from "@/lib/seo";
import { JobCategoryLandingPage } from "@/components/jobs/category-landing-page";
import { jobCategoryPages } from "@/lib/jobs/categories";

const category = jobCategoryPages["data-analyst"];

export const revalidate = 1800;

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
    url: category.path,
    images: [defaultOgImagePath]
  },
  twitter: {
    title: category.title,
    description: category.description,
    card: "summary_large_image",
    images: [defaultOgImagePath]
  }
};

export default function DataAnalystJobsPage() {
  return <JobCategoryLandingPage category={category} />;
}
