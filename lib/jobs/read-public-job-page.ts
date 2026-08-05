import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import sanitizeHtml from "sanitize-html";

const maxDownloadBytes = 1_500_000;
const maxRedirects = 3;
const blockedHostnames = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.aws.internal"
]);

export type ReadableJobPage = {
  companyHint: string;
  locationHint: string;
  pageText: string;
  resolvedUrl: string;
  titleHint: string;
};

function isBlockedIpv4(address: string) {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isBlockedIp(address: string) {
  const version = isIP(address);
  if (version === 4) return isBlockedIpv4(address);
  if (version !== 6) return true;

  const normalized = address.toLowerCase();
  if (normalized.startsWith("::ffff:")) {
    return isBlockedIpv4(normalized.slice(7));
  }

  return (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb")
  );
}

async function validatePublicUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Use a public http or https job link.");
  }
  if (url.username || url.password) {
    throw new Error("Job links cannot include embedded credentials.");
  }
  if (
    blockedHostnames.has(url.hostname.toLowerCase()) ||
    url.hostname.toLowerCase().endsWith(".local")
  ) {
    throw new Error("Use a public job link.");
  }
  if (url.port && !((url.protocol === "https:" && url.port === "443") || (url.protocol === "http:" && url.port === "80"))) {
    throw new Error("Use a standard public job link.");
  }

  if (isIP(url.hostname)) {
    if (isBlockedIp(url.hostname)) throw new Error("Use a public job link.");
    return url;
  }

  const addresses = await lookup(url.hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some((item) => isBlockedIp(item.address))) {
    throw new Error("Use a public job link.");
  }

  return url;
}

async function readLimitedBody(response: Response) {
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (declaredLength > maxDownloadBytes) {
    throw new Error("That job page is too large to read. Paste the job description instead.");
  }
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxDownloadBytes) {
      await reader.cancel();
      throw new Error("That job page is too large to read. Paste the job description instead.");
    }
    chunks.push(value);
  }

  const body = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(body);
}

function findJobPosting(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const match = findJobPosting(item);
      if (match) return match;
    }
    return null;
  }
  if (!value || typeof value !== "object") return null;

  const object = value as Record<string, unknown>;
  const type = object["@type"];
  if (type === "JobPosting" || (Array.isArray(type) && type.includes("JobPosting"))) {
    return object;
  }

  for (const child of Object.values(object)) {
    const match = findJobPosting(child);
    if (match) return match;
  }
  return null;
}

function readString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getLocationHint(posting: Record<string, unknown> | null) {
  if (!posting) return "";
  const locations = Array.isArray(posting.jobLocation) ? posting.jobLocation : [posting.jobLocation];
  const parts = locations.flatMap((location) => {
    if (!location || typeof location !== "object") return [];
    const address = (location as Record<string, unknown>).address;
    if (!address || typeof address !== "object") return [];
    const record = address as Record<string, unknown>;
    return [record.addressLocality, record.addressRegion, record.addressCountry]
      .map(readString)
      .filter(Boolean);
  });
  return [...new Set(parts)].join(", ");
}

function extractStructuredJob(html: string) {
  const scripts = html.match(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) ?? [];
  for (const script of scripts) {
    const json = script.replace(/^<script\b[^>]*>/i, "").replace(/<\/script>$/i, "").trim();
    try {
      const posting = findJobPosting(JSON.parse(json) as unknown);
      if (!posting) continue;
      const organization = posting.hiringOrganization;
      return {
        companyHint:
          organization && typeof organization === "object"
            ? readString((organization as Record<string, unknown>).name)
            : "",
        description: readString(posting.description),
        locationHint: getLocationHint(posting),
        titleHint: readString(posting.title)
      };
    } catch {
      continue;
    }
  }
  return { companyHint: "", description: "", locationHint: "", titleHint: "" };
}

function cleanHtmlText(html: string) {
  const withoutNonContent = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<\/(p|div|li|section|article|h[1-6]|tr)>/gi, "$&\n")
    .replace(/<br\s*\/?>/gi, "\n");
  return sanitizeHtml(withoutNonContent, { allowedTags: [], allowedAttributes: {} })
    .replace(/\r/g, "")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractPageTitle(html: string) {
  const match = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match ? cleanHtmlText(match[1]).slice(0, 180) : "";
}

export async function readPublicJobPage(value: string): Promise<ReadableJobPage> {
  let currentUrl = await validatePublicUrl(value);

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      headers: {
        accept: "text/html,application/xhtml+xml,text/plain;q=0.9",
        "user-agent": "HirevateJobReader/1.0 (+https://hirevate.com/about)"
      },
      redirect: "manual",
      signal: AbortSignal.timeout(12_000)
    });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirectCount === maxRedirects) {
        throw new Error("That job link redirected too many times. Paste the description instead.");
      }
      currentUrl = await validatePublicUrl(new URL(location, currentUrl).toString());
      continue;
    }

    if (!response.ok) {
      throw new Error("That job page could not be read. Paste the job description instead.");
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml") && !contentType.includes("text/plain")) {
      throw new Error("That link is not a readable job page. Paste the job description instead.");
    }

    const html = await readLimitedBody(response);
    const structured = extractStructuredJob(html);
    const structuredDescription = cleanHtmlText(structured.description);
    const pageText = [structuredDescription, cleanHtmlText(html)]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 30_000);

    if (pageText.length < 120) {
      throw new Error("That page did not expose a readable job description. Paste it instead.");
    }

    return {
      companyHint: structured.companyHint,
      locationHint: structured.locationHint,
      pageText,
      resolvedUrl: currentUrl.toString(),
      titleHint: structured.titleHint || extractPageTitle(html)
    };
  }

  throw new Error("That job page could not be read. Paste the job description instead.");
}
