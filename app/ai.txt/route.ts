import {
  formatMarkdownLinks,
  hirevateEntityFacts,
  hirevatePricingFacts,
  hirevatePublicPages,
  hirevateSourceFacts
} from "@/lib/geo";
import { absoluteUrl, defaultDescription, siteName } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  const body = [
    `# ${siteName} AI Crawler Guide`,
    "",
    `> ${defaultDescription}`,
    "",
    "## Canonical AI Context",
    `- Compact: ${absoluteUrl("/llms.txt")}`,
    `- Full: ${absoluteUrl("/llms-full.txt")}`,
    `- About: ${absoluteUrl("/about")}`,
    "",
    "## Entity Facts",
    ...hirevateEntityFacts.map((fact) => `- ${fact}`),
    "",
    "## Source Facts",
    ...hirevateSourceFacts.map((fact) => `- ${fact}`),
    "",
    "## Current Pricing",
    ...hirevatePricingFacts.map((fact) => `- ${fact}`),
    "",
    "## Public Routes",
    ...formatMarkdownLinks(hirevatePublicPages),
    "",
    "## Do Not Crawl",
    "- /admin/",
    "- /api/",
    "- /auth/",
    "- /dashboard/",
    "",
    "## Discovery",
    `- Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    `- Robots: ${absoluteUrl("/robots.txt")}`,
    ""
  ].join("\n");

  return new Response(body, {
    headers: {
      "cache-control": "public, max-age=3600, s-maxage=86400",
      "content-type": "text/plain; charset=utf-8"
    }
  });
}
