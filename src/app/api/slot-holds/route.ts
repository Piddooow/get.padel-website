/**
 * POST /api/slot-holds — lock a slot for the 10-minute window.
 *
 * This is the low-level primitive used by the booking flow (the guest-order
 * endpoint wraps it too). Holds are advisory local state; AYO remains the
 * booking source of truth and no payment data is stored (PRD §6).
 *
 * Body: { courtId, date, startHour, durationHours?, channel?, venueId? }
 * Responses: 201 { hold } · 400 invalid input · 404 unknown venue/court ·
 * 409 slot unavailable / already held.
 */
import { NextResponse } from "next/server";
import {
  createSlotHold,
  HOLD_WINDOW_MINUTES,
  SlotHoldError,
  withRemaining,
} from "@/lib/slot-holds";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Body must be valid JSON." } },
      { status: 400 }
    );
  }

  const input = (body ?? {}) as Record<string, unknown>;
  const courtId = typeof input.courtId === "string" ? input.courtId : null;
  const date = typeof input.date === "string" ? input.date : null;
  const startHour =
    typeof input.startHour === "number" ? input.startHour : null;

  if (!courtId || !date || startHour == null) {
    return NextResponse.json(
      {
        error: {
          code: "MISSING_FIELDS",
          message: "`courtId`, `date` and `startHour` are required.",
        },
      },
      { status: 400 }
    );
  }

  try {
    const hold = await createSlotHold({
      courtId,
      date,
      startHour,
      durationHours:
        typeof input.durationHours === "number"
          ? input.durationHours
          : undefined,
      channel:
        input.channel === "ayo" || input.channel === "whatsapp"
          ? input.channel
          : undefined,
      venueId: typeof input.venueId === "string" ? input.venueId : undefined,
    });

    return NextResponse.json(
      { hold: withRemaining(hold), windowMinutes: HOLD_WINDOW_MINUTES },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof SlotHoldError) {
      const status =
        error.code === "INVALID_INPUT"
          ? 400
          : error.code === "NOT_FOUND"
            ? 404
            : 409; // SLOT_UNAVAILABLE / HOLD_CONFLICT
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status }
      );
    }
    console.error("slot hold create failed:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Unexpected server error." } },
      { status: 500 }
    );
  }
}
