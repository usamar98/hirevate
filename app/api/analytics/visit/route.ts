import { createHash, randomUUID } from "node:crypto";
import { type NextRequest, NextResponse } from "next/server";
import { cookieConsentKey } from "@/lib/analytics/consent";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const visitorCookieName = "hirevate-visitor-id";
const visitorCookieMaxAge = 60 * 60 * 24 * 180;

function getSafePath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value.slice(0, 500);
}

function getVisitorHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export async function POST(request: NextRequest) {
  if (request.cookies.get(cookieConsentKey)?.value !== "optional") {
    return new NextResponse(null, { status: 204 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) return new NextResponse(null, { status: 204 });

  const payload = (await request.json().catch(() => null)) as { path?: unknown } | null;
  const path = getSafePath(payload?.path);
  const countryCode =
    request.headers.get("x-vercel-ip-country") ||
    request.headers.get("cf-ipcountry") ||
    request.headers.get("x-country-code");
  const countryName =
    request.headers.get("x-vercel-ip-country-name") ||
    request.headers.get("x-country-name") ||
    countryCode;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const userId = userData.user?.id ?? null;
  const existingVisitorId = request.cookies.get(visitorCookieName)?.value;
  const anonymousVisitorId = existingVisitorId || randomUUID();
  const identity = userId ? `user:${userId}` : `anonymous:${anonymousVisitorId}`;

  const { error } = await admin.rpc("record_daily_visit", {
    p_visitor_hash: getVisitorHash(identity),
    p_visit_date: new Date().toISOString().slice(0, 10),
    p_user_id: userId,
    p_path: path,
    p_country_code: countryCode?.toUpperCase() ?? null,
    p_country_name: countryName ?? null
  });

  if (error) {
    console.error("Unable to record daily visitor", error.message);
  }

  const response = new NextResponse(null, { status: 204 });
  if (!userId && !existingVisitorId) {
    response.cookies.set(visitorCookieName, anonymousVisitorId, {
      httpOnly: true,
      maxAge: visitorCookieMaxAge,
      path: "/",
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:"
    });
  }

  return response;
}
