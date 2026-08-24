import { absoluteUrl, publicSeoRoutes, siteUrl } from "@/lib/seo";

// IndexNow keys are public verification tokens, not secrets. Keeping one stable
// key in the repository lets the deployed site verify submissions immediately.
export const indexNowKey = "d7f4c861b3e24a1f9c8e5d2b6a0f743c";

const indexNowEndpoint = "https://api.indexnow.org/indexnow";

export async function notifyIndexNowAboutJobHubs() {
  const urlList = publicSeoRoutes
    .filter((route) => route.path === "/jobs" || route.path.startsWith("/jobs/"))
    .map((route) => absoluteUrl(route.path));

  if (urlList.length === 0) return { submitted: 0 };

  const response = await fetch(indexNowEndpoint, {
    body: JSON.stringify({
      host: new URL(siteUrl).host,
      key: indexNowKey,
      keyLocation: absoluteUrl(`/${indexNowKey}.txt`),
      urlList
    }),
    headers: { "content-type": "application/json; charset=utf-8" },
    method: "POST"
  });

  if (!response.ok && response.status !== 202) {
    throw new Error(`IndexNow returned ${response.status}.`);
  }

  return { submitted: urlList.length };
}
