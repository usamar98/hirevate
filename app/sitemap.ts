import type { MetadataRoute } from "next";
import { comparisons } from "@/lib/content/comparisons";
import { guides } from "@/lib/content/guides";
import { getSitemapJobs } from "@/lib/jobs/queries";
import { getJobPath } from "@/lib/jobs/seo";
import { legalDocuments, legalEffectiveDate } from "@/lib/legal";
import { absoluteUrl, publicSeoRoutes } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const contentLastModified = new Date("2026-07-17T00:00:00.000Z");
  const jobs = await getSitemapJobs();

  const publicRoutes = publicSeoRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: contentLastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority
  }));

  const legalRoutes = legalDocuments.map((document) => ({
    url: absoluteUrl("/legal/" + document.slug),
    lastModified: new Date(legalEffectiveDate + "T00:00:00.000Z"),
    changeFrequency: "yearly" as const,
    priority: 0.3
  }));

  const publicDiscoveryRoutes = ["/llms.txt", "/llms-full.txt", "/ai.txt"].map((path) => ({
    url: absoluteUrl(path),
    lastModified: contentLastModified,
    changeFrequency: "weekly" as const,
    priority: 0.35
  }));

  const guideRoutes = guides.map((guide) => ({
    url: absoluteUrl(`/guides/${guide.slug}`),
    lastModified: new Date(`${guide.updatedAt}T00:00:00.000Z`),
    changeFrequency: "monthly" as const,
    priority: 0.72
  }));

  const comparisonRoutes = comparisons.map((comparison) => ({
    url: absoluteUrl(`/compare/${comparison.slug}`),
    lastModified: contentLastModified,
    changeFrequency: "monthly" as const,
    priority: 0.66
  }));

  const jobRoutes = jobs.map((job) => ({
    url: absoluteUrl(getJobPath(job)),
    lastModified: new Date(job.last_seen_at ?? job.updated_at ?? job.discovered_at),
    changeFrequency: "daily" as const,
    priority: 0.85
  }));

  return [
    ...publicRoutes,
    ...legalRoutes,
    ...guideRoutes,
    ...comparisonRoutes,
    ...publicDiscoveryRoutes,
    ...jobRoutes
  ];
}
