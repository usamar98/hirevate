import { NextResponse } from "next/server";
import {
  getCurrentUserIfSessionPresent,
  getProfile,
  hasProductAccess,
  isAdminProfile
} from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUserIfSessionPresent();
  const profile = user ? await getProfile(user.id) : null;

  return NextResponse.json(
    {
      authenticated: Boolean(user),
      hasProductAccess: hasProductAccess(profile),
      isAdmin: isAdminProfile(profile)
    },
    {
      headers: {
        "Cache-Control": "private, no-store"
      }
    }
  );
}
