/**
 * GET /api/bookings/[reference] — one booking, owner only.
 * Responses: 200 { booking } · 401 signed out · 404 not found / not yours.
 */
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getBookingForUser } from "@/lib/bookings";
import { isDatabaseEnabled } from "@/db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Sign in to continue." } },
      { status: 401 }
    );
  }

  if (!isDatabaseEnabled()) {
    return NextResponse.json(
      { error: { code: "SERVICE_UNAVAILABLE", message: "Bookings aren't available yet." } },
      { status: 503 }
    );
  }

  const { reference } = await params;
  const booking = await getBookingForUser(reference, user.id);
  if (!booking) {
    // Same answer whether the reference is unknown or belongs to someone
    // else — booking data is never exposed to unauthorized visitors.
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Booking not found." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ booking });
}
