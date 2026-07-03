import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, getProfile } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { syncDailyFreshJobs } from "@/lib/jobs/daily-fresh-sync";

const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQUESTS = 3;
const buckets = new Map<string, { count: number; resetAt: number }>();

function getClientKey(request: NextRequest, userId: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${userId}:${forwarded ?? "local"}`;
}

function rateLimit(request: NextRequest, userId: string) {
  const key = getClientKey(request, userId);
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (bucket.count >= MAX_REQUESTS) {
    return false;
  }

  bucket.count += 1;
  return true;
}

function hasValidSyncSecret(request: NextRequest) {
  const providedSecret = request.headers.get("x-job-sync-secret");
  return Boolean(env.jobSyncSecret && providedSecret && providedSecret === env.jobSyncSecret);
}

function hasValidCronSecret(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  return Boolean(env.cronSecret && authorization === `Bearer ${env.cronSecret}`);
}

async function runSync() {
  try {
    const result = await syncDailyFreshJobs();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync jobs." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!hasValidCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized cron request." }, { status: 401 });
  }

  return runSync();
}

export async function POST(request: NextRequest) {
  const isSecretAuthorized = hasValidSyncSecret(request);
  let actorId = "sync-secret";

  if (!isSecretAuthorized) {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const profile = await getProfile(user.id);
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    actorId = user.id;
  }

  // Basic in-memory rate limiting reduces accidental sync abuse. Production deployments can
  // replace this with Redis, Upstash, or Vercel KV without changing the route contract.
  if (!rateLimit(request, actorId)) {
    return NextResponse.json({ error: "Too many sync requests. Try again later." }, { status: 429 });
  }

  return runSync();
}
