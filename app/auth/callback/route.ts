import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");
  const nextPath = getSafeNextPath(request.nextUrl.searchParams.get("next"));

  const supabase = await createSupabaseServerClient();
  const result = supabase
    ? code
      ? await supabase.auth.exchangeCodeForSession(code)
      : tokenHash && type === "recovery"
        ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" })
        : { error: new Error("Missing authentication code.") }
    : { error: new Error("Supabase is not configured.") };

  if (!result.error) {
    return NextResponse.redirect(new URL(nextPath, request.nextUrl.origin));
  }

  if (nextPath === "/reset-password") {
    return NextResponse.redirect(
      new URL("/forgot-password?error=invalid-reset-link", request.nextUrl.origin)
    );
  }

  return NextResponse.redirect(new URL("/login", request.nextUrl.origin));
}
