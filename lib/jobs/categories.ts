export type JobCategorySlug = "remote" | "london" | "engineering";

export type JobCategoryPage = {
  slug: JobCategorySlug;
  path: string;
  label: string;
  title: string;
  description: string;
  heading: string;
  eyebrow: string;
  emptyTitle: string;
  emptyDescription: string;
};

export const jobCategoryPages: Record<JobCategorySlug, JobCategoryPage> = {
  remote: {
    slug: "remote",
    path: "/jobs/remote",
    label: "Remote jobs",
    title: "Remote Jobs | Hirevate",
    description:
      "Find fresh remote jobs from official hiring sources. Browse direct-apply remote roles before crowded job boards catch up.",
    heading: "Remote jobs from official hiring sources",
    eyebrow: "Remote job search",
    emptyTitle: "No remote jobs found",
    emptyDescription:
      "Run a fresh job sync or browse all hidden jobs while new remote listings are collected."
  },
  london: {
    slug: "london",
    path: "/jobs/london",
    label: "London jobs",
    title: "London Jobs | Hirevate",
    description:
      "Find fresh London jobs from company career pages and trusted hiring sources, with direct-apply links and freshness signals.",
    heading: "London jobs with direct-apply links",
    eyebrow: "London job search",
    emptyTitle: "No London jobs found",
    emptyDescription:
      "Try all jobs or run a fresh sync to collect more roles from London hiring sources."
  },
  engineering: {
    slug: "engineering",
    path: "/jobs/engineering",
    label: "Engineering jobs",
    title: "Engineering Jobs | Hirevate",
    description:
      "Find fresh engineering, software, and developer jobs from official hiring sources before they get crowded.",
    heading: "Engineering jobs before they get crowded",
    eyebrow: "Engineering job search",
    emptyTitle: "No engineering jobs found",
    emptyDescription:
      "Try a broader jobs search or run a fresh sync to import more engineering roles."
  }
};

export const jobCategoryList = Object.values(jobCategoryPages);
