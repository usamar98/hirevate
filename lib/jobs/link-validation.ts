import "server-only";

import { isIP } from "node:net";

type JobLinkCandidate = {
  apply_url?: string | null;
  external_id: string;
  source_url?: string | null;
};

type LinkCheck = {
  reason: string;
  status: "reachable" | "uncertain" | "unreachable";
  url: string | null;
};

export type JobLinkValidation<T> = {
  acceptedJobs: T[];
  rejected: Array<{
    externalId: string;
    reason: string;
    url: string | null;
  }>;
  totalChecked: number;
  totalUncertain: number;
};

type ValidateNewJobLinksOptions<T> = {
  concurrency?: number;
  isExisting: (job: T) => boolean;
  timeoutMs?: number;
};

const defaultConcurrency = 16;
const defaultTimeoutMs = 3_500;
const maximumRedirects = 6;
const permanentHttpStatuses = new Set([404, 410]);
const getFallbackStatuses = new Set([404, 405, 410, 501]);
const permanentNetworkCodes = new Set([
  "CERT_HAS_EXPIRED",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "ENOTFOUND",
  "ERR_FR_TOO_MANY_REDIRECTS",
  "ERR_INVALID_URL",
  "ERR_SSL_CERTIFICATE_VERIFY_FAILED",
  "ERR_TLS_CERT_ALTNAME_INVALID",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE"
]);

function isPrivateIpv4(hostname: string) {
  const octets = hostname.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet))) return true;

  const [first = 0, second = 0] = octets;
  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

function isPrivateIpv6(hostname: string) {
  const value = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (value === "::" || value === "::1") return true;
  if (value.startsWith("fc") || value.startsWith("fd") || /^fe[89ab]/.test(value)) return true;

  const mappedIpv4 = value.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mappedIpv4 ? isPrivateIpv4(mappedIpv4) : false;
}

function parsePublicJobUrl(value: string | null | undefined) {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const ipVersion = isIP(hostname.replace(/^\[|\]$/g, ""));

    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      !hostname ||
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      (ipVersion === 4 && isPrivateIpv4(hostname)) ||
      (ipVersion === 6 && isPrivateIpv6(hostname))
    ) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

function getErrorCode(error: unknown) {
  if (!error || typeof error !== "object") return null;

  const directCode = "code" in error && typeof error.code === "string" ? error.code : null;
  if (directCode) return directCode;

  const cause = "cause" in error ? error.cause : null;
  return cause && typeof cause === "object" && "code" in cause && typeof cause.code === "string"
    ? cause.code
    : null;
}

async function cancelBody(response: Response) {
  try {
    await response.body?.cancel();
  } catch {
    // The status and headers are sufficient for link validation.
  }
}

async function requestWithSafeRedirects(
  initialUrl: URL,
  method: "GET" | "HEAD",
  timeoutMs: number
) {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= maximumRedirects; redirectCount += 1) {
    const response = await fetch(currentUrl, {
      cache: "no-store",
      headers: {
        accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "user-agent": "HirevateJobLinkChecker/1.0 (+https://www.hirevate.com)"
      },
      method,
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (response.status < 300 || response.status >= 400) {
      return response;
    }

    const location = response.headers.get("location");
    await cancelBody(response);
    if (!location) {
      throw Object.assign(new Error("Redirect response has no destination."), {
        code: "INVALID_REDIRECT"
      });
    }

    const nextUrl = parsePublicJobUrl(new URL(location, currentUrl).toString());
    if (!nextUrl) {
      throw Object.assign(new Error("Redirect destination is not a public HTTP URL."), {
        code: "INVALID_REDIRECT"
      });
    }

    currentUrl = nextUrl;
  }

  throw Object.assign(new Error("Job link exceeded the redirect limit."), {
    code: "ERR_FR_TOO_MANY_REDIRECTS"
  });
}

function hasNotFoundDestination(response: Response) {
  try {
    const pathname = new URL(response.url).pathname.toLowerCase();
    return /\/(404|410|not[-_]?found|job[-_]?not[-_]?found)(?:\/|$)/.test(pathname);
  } catch {
    return false;
  }
}

export async function checkJobLinkReachability(
  value: string | null | undefined,
  timeoutMs = defaultTimeoutMs
): Promise<LinkCheck> {
  const url = parsePublicJobUrl(value);
  if (!url) {
    return { reason: "missing, malformed, or non-public URL", status: "unreachable", url: value ?? null };
  }

  try {
    const headResponse = await requestWithSafeRedirects(url, "HEAD", timeoutMs);
    const headStatus = headResponse.status;
    const headLooksMissing = hasNotFoundDestination(headResponse);
    await cancelBody(headResponse);

    if (!getFallbackStatuses.has(headStatus) && !headLooksMissing) {
      if (headStatus >= 200 && headStatus < 400) {
        return { reason: `HTTP ${headStatus}`, status: "reachable", url: url.toString() };
      }

      return { reason: `temporary or guarded HTTP ${headStatus}`, status: "uncertain", url: url.toString() };
    }

    const getResponse = await requestWithSafeRedirects(url, "GET", timeoutMs);
    const getStatus = getResponse.status;
    const getLooksMissing = hasNotFoundDestination(getResponse);
    await cancelBody(getResponse);

    if (permanentHttpStatuses.has(getStatus) || getLooksMissing) {
      return { reason: `confirmed HTTP ${getStatus}`, status: "unreachable", url: url.toString() };
    }

    if (getStatus >= 200 && getStatus < 400) {
      return { reason: `HTTP ${getStatus}`, status: "reachable", url: url.toString() };
    }

    return { reason: `temporary or guarded HTTP ${getStatus}`, status: "uncertain", url: url.toString() };
  } catch (error) {
    const code = getErrorCode(error);
    const isPermanent = code === "INVALID_REDIRECT" || Boolean(code && permanentNetworkCodes.has(code));
    return {
      reason: code ?? (error instanceof Error ? error.message : "link check failed"),
      status: isPermanent ? "unreachable" : "uncertain",
      url: url.toString()
    };
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      const item = items[index];
      if (item !== undefined) results[index] = await mapper(item);
    }
  }

  const workerCount = Math.min(Math.max(1, concurrency), items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

export async function validateNewJobLinks<T extends JobLinkCandidate>(
  jobs: T[],
  options: ValidateNewJobLinksOptions<T>
): Promise<JobLinkValidation<T>> {
  const newJobs = jobs.filter((job) => !options.isExisting(job));
  const timeoutMs = Math.min(Math.max(options.timeoutMs ?? defaultTimeoutMs, 1_000), 10_000);
  const checksByUrl = new Map<string, Promise<LinkCheck>>();

  const checks = await mapWithConcurrency(
    newJobs,
    options.concurrency ?? defaultConcurrency,
    async (job) => {
      const value = job.apply_url ?? job.source_url;
      const cacheKey = value?.trim() ?? "";
      let pendingCheck = checksByUrl.get(cacheKey);

      if (!pendingCheck) {
        pendingCheck = checkJobLinkReachability(value, timeoutMs);
        checksByUrl.set(cacheKey, pendingCheck);
      }

      return { check: await pendingCheck, job };
    }
  );

  const rejectedJobs = new Set<T>();
  const rejected: JobLinkValidation<T>["rejected"] = [];
  let totalUncertain = 0;

  for (const { check, job } of checks) {
    if (check.status === "unreachable") {
      rejectedJobs.add(job);
      rejected.push({
        externalId: job.external_id,
        reason: check.reason,
        url: check.url
      });
    } else if (check.status === "uncertain") {
      totalUncertain += 1;
    }
  }

  for (const item of rejected) {
    console.warn(
      JSON.stringify({
        event: "job_link_excluded",
        externalId: item.externalId,
        reason: item.reason,
        url: item.url
      })
    );
  }

  return {
    acceptedJobs: jobs.filter((job) => !rejectedJobs.has(job)),
    rejected,
    totalChecked: newJobs.length,
    totalUncertain
  };
}
