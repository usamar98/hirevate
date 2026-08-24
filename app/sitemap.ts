import type { MetadataRoute } from "next";
import { comparisons } from "@/lib/content/comparisons";
import { guides } from "@/lib/content/guides";
import { getSitemapJobs } from "@/lib/jobs/queries";
import { getJobPath } from "@/lib/jobs/seo";
import { legalDocuments, legalEffectiveDate } from "@/lib/legal";
import { absoluteUrl, publicSeoRoutes } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const contentLastModified = new Date("2026-08-24T00:00:00.000Z");
  const jobListingsLastModified = new Date();
  const jobs = await getSitemapJobs();

  const publicRoutes = publicSeoRoutes.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified:
      route.path === "/jobs" || route.path.startsWith("/jobs/")
        ? jobListingsLastModified
        : contentLastModified
  }));

  const legalRoutes = legalDocuments.map((document) => ({
    url: absoluteUrl("/legal/" + document.slug),
    lastModified: new Date(legalEffectiveDate + "T00:00:00.000Z")
  }));

  const guideRoutes = guides.map((guide) => ({
    url: absoluteUrl(`/guides/${guide.slug}`),
    lastModified: new Date(`${guide.updatedAt}T00:00:00.000Z`)
  }));

  const comparisonRoutes = comparisons.map((comparison) => ({
    url: absoluteUrl(`/compare/${comparison.slug}`),
    lastModified: contentLastModified
  }));

  const jobRoutes = jobs.map((job) => ({
    url: absoluteUrl(getJobPath(job)),
    lastModified: new Date(job.last_seen_at ?? job.updated_at ?? job.discovered_at)
  }));

  return [
    ...publicRoutes,
    ...legalRoutes,
    ...guideRoutes,
    ...comparisonRoutes,
    ...jobRoutes
  ];
}
