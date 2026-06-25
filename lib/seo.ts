import { env } from "@/lib/env";

function removeTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export const siteName = "Hirevate";
export const siteUrl = removeTrailingSlash(env.appUrl || "https://www.hirevate.com");
export const defaultDescription =
  "Find fresh direct-apply jobs from official hiring sources, build targeted resumes, and track which applications turn into interviews.";
export const defaultOgImagePath = "/opengraph-image";

export const publicSeoRoutes = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/jobs", changeFrequency: "hourly", priority: 0.95 },
  { path: "/resume-builder", changeFrequency: "weekly", priority: 0.8 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.7 }
] as const;

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalizedPath}`;
}
