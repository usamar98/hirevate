export type JobCategorySlug =
  | "remote"
  | "london"
  | "engineering"
  | "software-engineer"
  | "product-manager"
  | "data-analyst"
  | "customer-success";

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
  keywords?: string[];
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
  },
  "software-engineer": {
    slug: "software-engineer",
    path: "/jobs/software-engineer",
    label: "Software engineer jobs",
    title: "Software Engineer Jobs | Hirevate",
    description:
      "Find fresh software engineer jobs from official hiring sources with direct-apply links and freshness signals.",
    heading: "Software engineer jobs from company sources",
    eyebrow: "Software engineering job search",
    emptyTitle: "No software engineer jobs found",
    emptyDescription:
      "Try engineering jobs or run a fresh sync to import more software engineering roles.",
    keywords: ["software engineer", "software developer", "frontend", "backend", "full stack"]
  },
  "product-manager": {
    slug: "product-manager",
    path: "/jobs/product-manager",
    label: "Product manager jobs",
    title: "Product Manager Jobs | Hirevate",
    description:
      "Find fresh product manager jobs from official company career pages and public hiring sources.",
    heading: "Product manager jobs before they get crowded",
    eyebrow: "Product job search",
    emptyTitle: "No product manager jobs found",
    emptyDescription:
      "Try all jobs or run a fresh sync to collect more product roles.",
    keywords: ["product manager", "product owner", "product lead", "group product manager"]
  },
  "data-analyst": {
    slug: "data-analyst",
    path: "/jobs/data-analyst",
    label: "Data analyst jobs",
    title: "Data Analyst Jobs | Hirevate",
    description:
      "Find fresh data analyst, analytics, and business intelligence jobs from direct hiring sources.",
    heading: "Data analyst jobs with direct-apply links",
    eyebrow: "Data job search",
    emptyTitle: "No data analyst jobs found",
    emptyDescription:
      "Try all jobs or run a fresh sync to collect more data and analytics roles.",
    keywords: ["data analyst", "analytics", "business intelligence", "data scientist"]
  },
  "customer-success": {
    slug: "customer-success",
    path: "/jobs/customer-success",
    label: "Customer success jobs",
    title: "Customer Success Jobs | Hirevate",
    description:
      "Find fresh customer success and account management jobs from official hiring sources.",
    heading: "Customer success jobs from official sources",
    eyebrow: "Customer success job search",
    emptyTitle: "No customer success jobs found",
    emptyDescription:
      "Try all jobs or run a fresh sync to collect more customer-facing roles.",
    keywords: ["customer success", "account manager", "implementation manager", "customer support"]
  }
};

export const jobCategoryList = Object.values(jobCategoryPages);
