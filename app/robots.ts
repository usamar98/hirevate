import type { MetadataRoute } from "next";
import { absoluteUrl, aiSearchCrawlerUserAgents, crawlDisallowPaths, siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const publicContentRule = {
    allow: "/",
    disallow: [...crawlDisallowPaths]
  };

  return {
    rules: [
      {
        userAgent: "*",
        ...publicContentRule
      },
      ...aiSearchCrawlerUserAgents.map((userAgent) => ({
        userAgent,
        ...publicContentRule
      }))
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl
  };
}
