import { env } from "@/lib/env";
import { jobCountries } from "@/lib/jobs/countries";
import { studentJobsPageList } from "@/lib/jobs/student-pages";

function removeTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export const siteName = "Hirevate";
export const siteUrl = removeTrailingSlash(env.appUrl || "https://www.hirevate.com");
export const defaultTitle = "Fresh Jobs, Tailored Resumes & Tracking | Hirevate";
export const defaultDescription =
  "Find fresh UAE, remote, and professional jobs, build a free ATS-friendly resume, create a cover letter, and track every application with Hirevate.";
export const defaultOgImagePath = "/opengraph-image";

export const crawlDisallowPaths = [
  "/admin/",
  "/adminhirevate01",
  "/account/",
  "/api/",
  "/auth/",
  "/dashboard/"
] as const;

export const aiSearchCrawlerUserAgents = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "ClaudeBot",
  "Claude-SearchBot",
  "anthropic-ai",
  "Google-Extended",
  "Bingbot",
  "Applebot"
] as const;

export const geoAudienceKeywords = [
  "company career pages",
  "public ATS job boards",
  "public-source job search",
  "hidden job opportunities",
  "fresh remote jobs",
  "professional resume templates",
  "AI resume builder",
  "free resume builder",
  "resume from job link",
  "job description resume generator",
  "tailored resume generator",
  "AI cover letter builder",
  "free cover letter builder",
  "free job application tracker",
  "UAE jobs",
  "jobs in Dubai",
  "job application tracker",
  "AI job search",
  "part-time jobs for international students",
  "student jobs in the US",
  "student jobs in the UK"
] as const;

export const publicSeoRoutes = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/about", changeFrequency: "weekly", priority: 0.82 },
  { path: "/jobs", changeFrequency: "hourly", priority: 0.95 },
  { path: "/jobs/latest", changeFrequency: "hourly", priority: 0.92 },
  { path: "/jobs/remote", changeFrequency: "hourly", priority: 0.9 },
  ...studentJobsPageList.map((page) => ({
    path: page.path,
    changeFrequency: "hourly" as const,
    priority: page.path === "/jobs/part-time" ? 0.92 : 0.9
  })),
  ...jobCountries.map((country) => ({
    path: country.path,
    changeFrequency: "hourly" as const,
    priority: 0.89
  })),
  { path: "/jobs/london", changeFrequency: "hourly", priority: 0.88 },
  { path: "/jobs/engineering", changeFrequency: "hourly", priority: 0.88 },
  { path: "/jobs/software-engineer", changeFrequency: "hourly", priority: 0.87 },
  { path: "/jobs/product-manager", changeFrequency: "hourly", priority: 0.86 },
  { path: "/jobs/data-analyst", changeFrequency: "hourly", priority: 0.85 },
  { path: "/jobs/customer-success", changeFrequency: "hourly", priority: 0.84 },
  { path: "/resume-builder", changeFrequency: "weekly", priority: 0.9 },
  { path: "/cover-letter", changeFrequency: "weekly", priority: 0.78 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.7 },
  { path: "/legal", changeFrequency: "yearly", priority: 0.3 },
  { path: "/guides", changeFrequency: "weekly", priority: 0.76 },
  { path: "/compare", changeFrequency: "monthly", priority: 0.68 },
  { path: "/research/student-part-time-jobs", changeFrequency: "hourly", priority: 0.82 },
  { path: "/partners/student-jobs", changeFrequency: "monthly", priority: 0.7 }
] as const;

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalizedPath}`;
}
