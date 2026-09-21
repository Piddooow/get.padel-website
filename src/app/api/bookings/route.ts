/**
 * /api/bookings — the visitor's own bookings.
 *
 * GET  → list the signed-in visitor's bookings (history + statuses).
 * POST → create a booking + Midtrans Snap payment page.
 *        Body: { courtId, date, startHour, durationHours? }
 *
 * Availability is re-validated against the official AYO feed before the slot
 * is held, and the database enforces one live booking per court/date/hour.
 * Responses: 200/201 · 400 invalid · 401 signed out · 409 slot taken/again
 *            · 503 AYO or payment channel unavailable.
 */
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createBooking, listBookingsForUser } from "@/lib/bookings";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json(
    { error: { code: "UNAUTHORIZED", message: "Sign in to continue." } },
    { status: 401 }
  );
}

const ERROR_STATUS: Record<string, number> = {
  INVALID_INPUT: 400,
  OUT_OF_HOURS: 400,
  PAST: 409,
  SLOT_UNAVAILABLE: 409,
  SLOT_TAKEN: 409,
  AYO_UNAVAILABLE: 503,
  PAYMENT_UNCONFIGURED: 503,
  PAYMENT_ERROR: 502,
};

function unavailable() {
  return NextResponse.json(
    {
      error: {
        code: "SERVICE_UNAVAILABLE",
        message: "Bookings aren't available in this environment yet.",
      },
    },
    { status: 503 }
  );
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return unauthorized();

    const bookings = await listBookingsForUser(user.id);
    return NextResponse.json({ bookings });
  } catch {
    return unavailable();
  }
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Body must be JSON." } },
      { status: 400 }
    );
  }

  const source = (body ?? {}) as Record<string, unknown>;
  const courtId = typeof source.courtId === "string" ? source.courtId : "";
  const date = typeof source.date === "string" ? source.date : "";
  const startHour = Number(source.startHour);
  const durationHours = Number(source.durationHours ?? 1);
  const rawContact = (source.contact ?? {}) as Record<string, unknown>;
  const contact = {
    name: typeof rawContact.name === "string" ? rawContact.name : undefined,
    whatsapp:
      typeof rawContact.whatsapp === "string" ? rawContact.whatsapp : undefined,
  };

  if (!courtId || !date || !Number.isFinite(startHour)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "courtId, date and startHour are required.",
        },
      },
      { status: 400 }
    );
  }

  const origin = new URL(request.url).origin;
  let result;
  try {
    result = await createBooking({
      userId: user.id,
      courtId,
      date,
      startHour,
      durationHours,
      contact,
      finishUrl: `${origin}/id/akun?paid=1`,
    });
  } catch {
    return unavailable();
  }

  if (!result.ok) {
    return NextResponse.json(
      { error: { code: result.code, message: result.message } },
      { status: ERROR_STATUS[result.code] ?? 400 }
    );
  }

  return NextResponse.json({ booking: result.booking }, { status: 201 });
}
