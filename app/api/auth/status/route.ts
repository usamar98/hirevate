import { NextResponse } from "next/server";
import { getCurrentUser, getProfile } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const profile = user ? await getProfile(user.id) : null;

  return NextResponse.json(
    {
      authenticated: Boolean(user),
      isAdmin: profile?.role === "admin"
    },
    {
      headers: {
        "Cache-Control": "private, no-store"
      }
    }
  );
}
