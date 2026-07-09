import type { Metadata } from "next";
import { JobCategoryLandingPage } from "@/components/jobs/category-landing-page";
import { jobCategoryPages } from "@/lib/jobs/categories";
import { defaultOgImagePath } from "@/lib/seo";

const category = jobCategoryPages.uk;

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
    card: "summary_large_image",
    title: category.title,
    description: category.description,
    images: [defaultOgImagePath]
  }
};

export default function UkJobsPage() {
  return <JobCategoryLandingPage category={category} />;
}
