/**
 * POST /api/orders — create a guest order (no account) for a slot.
 *
 * The order wraps a temporary slot hold and the chosen handoff channel.
 * No payment data is stored — AYO completes payment/booking (PRD §6).
 *
 * Body: { courtId, date, startHour, durationHours?, channel?, paymentMethod?,
 *         venueId?, guest? { name?, whatsapp?, email? } }
 * Responses: 201 { order } · 400 invalid input · 404 unknown venue/court ·
 * 409 slot unavailable / already held.
 */
import { NextResponse } from "next/server";
import {
  createGuestOrder,
  GuestOrderError,
  type CreateGuestOrderInput,
  type GuestContact,
} from "@/lib/guest-orders";

export const runtime = "nodejs";

function badRequest(code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status: 400 });
}

function parseGuest(value: unknown): GuestContact | undefined {
  if (value == null) return undefined;
  if (typeof value !== "object") {
    throw new GuestOrderError("INVALID_INPUT", "guest must be an object.");
  }
  const guest = value as Record<string, unknown>;
  const pick = (key: string) =>
    typeof guest[key] === "string" ? (guest[key] as string) : undefined;
  return { name: pick("name"), whatsapp: pick("whatsapp"), email: pick("email") };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("INVALID_JSON", "Request body must be valid JSON.");
  }
  if (typeof body !== "object" || body === null) {
    return badRequest("INVALID_JSON", "Request body must be a JSON object.");
  }

  const input = body as Record<string, unknown>;
  const courtId = typeof input.courtId === "string" ? input.courtId : null;
  const date = typeof input.date === "string" ? input.date : null;
  const startHour =
    typeof input.startHour === "number" ? input.startHour : null;

  if (!courtId || !date || startHour == null) {
    return badRequest(
      "MISSING_FIELDS",
      "`courtId`, `date` and `startHour` are required."
    );
  }

  try {
    const payload: CreateGuestOrderInput = {
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
      paymentMethod:
        typeof input.paymentMethod === "string"
          ? (input.paymentMethod as CreateGuestOrderInput["paymentMethod"])
          : undefined,
      venueId: typeof input.venueId === "string" ? input.venueId : undefined,
      guest: parseGuest(input.guest),
    };

    const order = await createGuestOrder(payload);
    return NextResponse.json(
      { order },
      { status: 201, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof GuestOrderError) {
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
    console.error("create guest order failed:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Unexpected server error." } },
      { status: 500 }
    );
  }
}
