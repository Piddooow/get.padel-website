/**
 * GET    /api/orders/[reference] — read a guest order + its hold status
 * PATCH  /api/orders/[reference] — { status: "handed_off" } marks the handoff
 * DELETE /api/orders/[reference] — cancels the order and releases the hold
 *
 * References look like "GP-7KQ4MZ" and are safe to share with CS.
 */
import { NextResponse } from "next/server";
import {
  cancelGuestOrder,
  getGuestOrder,
  GuestOrderError,
  markGuestOrderHandedOff,
} from "@/lib/guest-orders";

export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

function notFound(reference: string) {
  return NextResponse.json(
    { error: { code: "NOT_FOUND", message: `Unknown order "${reference}".` } },
    { status: 404 }
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params;
  const order = await getGuestOrder(reference);
  if (!order) return notFound(reference);
  return NextResponse.json({ order }, { headers: NO_STORE });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_JSON", message: "Body must be valid JSON." } },
      { status: 400 }
    );
  }

  const status = (body as Record<string, unknown> | null)?.status;
  if (status !== "handed_off") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: 'Only { "status": "handed_off" } is accepted.',
        },
      },
      { status: 400 }
    );
  }

  try {
    const order = await markGuestOrderHandedOff(reference);
    return NextResponse.json({ order }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof GuestOrderError && error.code === "NOT_FOUND") {
      return notFound(reference);
    }
    console.error("handoff update failed:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Unexpected server error." } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params;
  try {
    const order = await cancelGuestOrder(reference);
    return NextResponse.json({ order }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof GuestOrderError && error.code === "NOT_FOUND") {
      return notFound(reference);
    }
    console.error("cancel order failed:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Unexpected server error." } },
      { status: 500 }
    );
  }
}
