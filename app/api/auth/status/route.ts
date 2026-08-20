import { NextResponse } from "next/server";
import { hasAdminHirevateSession } from "@/lib/admin/password-session";
import { getCurrentUser, getProfile, isAdminProfile } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const [user, privateAdmin] = await Promise.all([
    getCurrentUser(),
    hasAdminHirevateSession()
  ]);
  const profile = user ? await getProfile(user.id) : null;

  return NextResponse.json(
    {
      authenticated: Boolean(user),
      isAdmin: isAdminProfile(profile),
      privateAdmin
    },
    {
      headers: {
        "Cache-Control": "private, no-store"
      }
    }
  );
}
