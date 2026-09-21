/**
 * GET    /api/slot-holds/[reference] — hold status + remaining seconds
 * DELETE /api/slot-holds/[reference] — release the hold (idempotent)
 *
 * References look like "GP-7KQ4MZ".
 */
import { NextResponse } from "next/server";
import {
  HOLD_WINDOW_MINUTES,
  releaseSlotHold,
  SlotHoldError,
  getSlotHold,
  withRemaining,
} from "@/lib/slot-holds";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

function notFound(reference: string) {
  return NextResponse.json(
    { error: { code: "NOT_FOUND", message: `Unknown hold "${reference}".` } },
    { status: 404 }
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params;
  const hold = await getSlotHold(reference);
  if (!hold) return notFound(reference);
  return NextResponse.json(
    { hold: withRemaining(hold), windowMinutes: HOLD_WINDOW_MINUTES },
    { headers: NO_STORE }
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params;
  try {
    const hold = await releaseSlotHold(reference);
    return NextResponse.json({ hold: withRemaining(hold) }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof SlotHoldError && error.code === "NOT_FOUND") {
      return notFound(reference);
    }
    console.error("slot hold release failed:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Unexpected server error." } },
      { status: 500 }
    );
  }
}
