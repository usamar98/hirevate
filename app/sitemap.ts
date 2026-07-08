import type { MetadataRoute } from "next";
import { getSitemapJobs } from "@/lib/jobs/queries";
import { getJobPath } from "@/lib/jobs/seo";
import { absoluteUrl, publicSeoRoutes } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  const jobs = await getSitemapJobs();

  const publicRoutes = publicSeoRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));

  const publicDiscoveryRoutes = ["/llms.txt", "/llms-full.txt", "/ai.txt"].map((path) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.35
  }));

  const jobRoutes = jobs.map((job) => ({
    url: absoluteUrl(getJobPath(job)),
    lastModified: new Date(job.last_seen_at ?? job.updated_at ?? job.discovered_at),
    changeFrequency: "daily" as const,
    priority: 0.85
  }));

  return [...publicRoutes, ...publicDiscoveryRoutes, ...jobRoutes];
}
