/**
 * POST /api/webhooks/payments — Midtrans payment notification.
 *
 * Security: every notification is authenticated with Midtrans' signature
 * (sha512 of order_id + status_code + gross_amount + server key) before any
 * state changes. Unknown orders, tampered amounts and duplicate retries are
 * handled idempotently.
 *
 * Effects: the booking's status/payment_status advance (settlement/capture →
 * paid, so the slot stays locked) or release the slot (deny/cancel/expire/
 * failure) — a paid booking is never downgraded.
 *
 * Responses: 200 { received, applied, status } · 401 bad signature ·
 * 404 unknown order · 503 gateway not configured.
 */
import { NextResponse } from "next/server";
import { applyPaymentNotification } from "@/lib/bookings";
import { isMidtransConfigured, verifyMidtransSignature } from "@/lib/midtrans";

export const runtime = "nodejs";

interface MidtransNotification {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  fraud_status?: string | null;
  transaction_id?: string | null;
}

export async function POST(request: Request) {
  if (!isMidtransConfigured()) {
    return NextResponse.json(
      {
        error: {
          code: "WEBHOOK_DISABLED",
          message: "MIDTRANS_SERVER_KEY is not configured.",
        },
      },
      { status: 503 }
    );
  }

  let payload: MidtransNotification;
  try {
    payload = (await request.json()) as MidtransNotification;
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_PAYLOAD", message: "Body must be JSON." } },
      { status: 400 }
    );
  }

  const orderId = payload.order_id;
  const statusCode = payload.status_code;
  const grossAmount = payload.gross_amount;
  const signatureKey = payload.signature_key;
  const transactionStatus = payload.transaction_status;

  if (!orderId || !statusCode || !grossAmount || !signatureKey || !transactionStatus) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_PAYLOAD",
          message: "Notification is missing required fields.",
        },
      },
      { status: 400 }
    );
  }

  if (
    !verifyMidtransSignature({
      orderId,
      statusCode,
      grossAmount,
      signatureKey,
    })
  ) {
    return NextResponse.json(
      { error: { code: "INVALID_SIGNATURE", message: "Signature mismatch." } },
      { status: 401 }
    );
  }

  const result = await applyPaymentNotification({
    orderId,
    statusCode,
    grossAmount,
    transactionStatus,
    fraudStatus: payload.fraud_status ?? null,
    transactionId: payload.transaction_id ?? null,
    raw: payload,
  });

  if (!result.ok) {
    const status = result.reason === "unknown_order" ? 404 : 400;
    return NextResponse.json(
      { error: { code: result.reason.toUpperCase(), message: result.reason } },
      { status }
    );
  }

  return NextResponse.json({
    received: true,
    applied: result.applied,
    status: result.status,
  });
}
