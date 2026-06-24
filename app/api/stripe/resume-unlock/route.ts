import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getStripe, resumeBuilderProduct } from "@/lib/stripe/server";

export async function GET(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "You must be logged in." }, { status: 401 });
  }

  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing checkout session." }, { status: 400 });
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const isResumeExport = session.metadata?.product === resumeBuilderProduct.key;
  const isCurrentUser = session.metadata?.userId === user.id || session.client_reference_id === user.id;

  if (!isResumeExport || !isCurrentUser) {
    return NextResponse.json({ error: "This checkout session does not match your account." }, { status: 403 });
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json({ error: "Payment has not completed yet." }, { status: 402 });
  }

  return NextResponse.json({ unlocked: true });
}
