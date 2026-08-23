import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    {
      source: "/",
      has: [{ type: "query", key: "code" }]
    },
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/trial/:path*",
    "/account/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    "/adminhirevate01"
  ]
};
