/**
 * Midtrans payment gateway (official Snap API).
 *
 * Configured through environment variables — nothing is hardcoded and no
 * transaction is ever faked:
 *
 *   MIDTRANS_SERVER_KEY      server key from the Midtrans dashboard
 *   MIDTRANS_IS_PRODUCTION   "true" for the live environment (default sandbox)
 *   MIDTRANS_EXPIRY_MINUTES  payment window for a booking (default 15)
 *
 * Flow: the server creates a Snap transaction, the visitor pays on Midtrans'
 * hosted page, and the gateway notifies us via `POST /api/webhooks/payments`
 * (signature verified with SHA512 before anything is trusted).
 */
import { createHash, timingSafeEqual } from "node:crypto";

export const DEFAULT_EXPIRY_MINUTES = Number(
  process.env.MIDTRANS_EXPIRY_MINUTES ?? 15
);

export function isMidtransConfigured(): boolean {
  return Boolean(process.env.MIDTRANS_SERVER_KEY);
}

function isProduction(): boolean {
  return process.env.MIDTRANS_IS_PRODUCTION === "true";
}

function snapBaseUrl(): string {
  return isProduction()
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
}

/** Public client key (safe to expose) — used only for diagnostics. */
export function midtransClientKey(): string | null {
  return process.env.MIDTRANS_CLIENT_KEY ?? null;
}

export class MidtransError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = "MidtransError";
  }
}

export interface SnapTransactionInput {
  orderId: string;
  amountIdr: number;
  itemName: string;
  customer: { name: string; email: string; whatsapp?: string | null };
  expiryMinutes?: number;
  /** Where Snap sends the visitor back after paying / on failure. */
  finishUrl?: string;
  errorUrl?: string;
}

export interface SnapTransaction {
  token: string;
  redirectUrl: string;
}

/** Creates a Snap transaction and returns its token + hosted payment URL. */
export async function createSnapTransaction(
  input: SnapTransactionInput
): Promise<SnapTransaction> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    throw new MidtransError("MIDTRANS_SERVER_KEY is not configured.");
  }

  const response = await fetch(`${snapBaseUrl()}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: input.orderId,
        gross_amount: input.amountIdr,
      },
      item_details: [
        {
          id: "padel-slot",
          price: input.amountIdr,
          quantity: 1,
          name: input.itemName.slice(0, 50),
        },
      ],
      customer_details: {
        first_name: input.customer.name.slice(0, 50),
        email: input.customer.email,
        ...(input.customer.whatsapp
          ? { phone: input.customer.whatsapp }
          : {}),
      },
      expiry: {
        unit: "minutes",
        duration: input.expiryMinutes ?? DEFAULT_EXPIRY_MINUTES,
      },
      credit_card: { secure: true },
      ...(input.finishUrl || input.errorUrl
        ? {
            callbacks: {
              ...(input.finishUrl ? { finish: input.finishUrl } : {}),
              ...(input.errorUrl ? { error: input.errorUrl } : {}),
            },
          }
        : {}),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new MidtransError(
      `Snap transaction failed (${response.status})${body ? `: ${body.slice(0, 200)}` : ""}`,
      response.status
    );
  }

  const data = (await response.json()) as {
    token?: string;
    redirect_url?: string;
  };
  if (!data.token || !data.redirect_url) {
    throw new MidtransError("Snap response is missing token/redirect_url.");
  }

  return { token: data.token, redirectUrl: data.redirect_url };
}

/**
 * Verifies a Midtrans notification signature:
 * sha512(order_id + status_code + gross_amount + server_key).
 */
export function verifyMidtransSignature(params: {
  orderId: string;
  statusCode: string;
  grossAmount: string;
  signatureKey: string;
}): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return false;

  const expected = createHash("sha512")
    .update(
      `${params.orderId}${params.statusCode}${params.grossAmount}${serverKey}`
    )
    .digest("hex");

  const received = params.signatureKey.trim().toLowerCase();
  if (received.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

export type MidtransTransactionStatus =
  | "capture"
  | "settlement"
  | "pending"
  | "deny"
  | "cancel"
  | "expire"
  | "failure"
  | "refund"
  | "partial_refund"
  | string;

export interface BookingStatusUpdate {
  bookingStatus: "paid" | "pending_payment" | "failed" | "cancelled" | "expired";
  paymentStatus:
    | "pending"
    | "settlement"
    | "capture"
    | "deny"
    | "cancel"
    | "expire"
    | "failure"
    | "refund";
  /** True when the slot must stay locked for this booking. */
  locksSlot: boolean;
}

/**
 * Maps a Midtrans transaction status to our booking + payment states.
 * Returns null for unknown statuses so the caller can ignore them safely.
 */
export function mapMidtransStatus(
  transactionStatus: MidtransTransactionStatus,
  fraudStatus?: string | null
): BookingStatusUpdate | null {
  switch (transactionStatus) {
    case "capture":
      return fraudStatus === "challenge"
        ? { bookingStatus: "pending_payment", paymentStatus: "pending", locksSlot: true }
        : { bookingStatus: "paid", paymentStatus: "capture", locksSlot: true };
    case "settlement":
      return { bookingStatus: "paid", paymentStatus: "settlement", locksSlot: true };
    case "pending":
      return {
        bookingStatus: "pending_payment",
        paymentStatus: "pending",
        locksSlot: true,
      };
    case "deny":
      return { bookingStatus: "failed", paymentStatus: "deny", locksSlot: false };
    case "cancel":
      return {
        bookingStatus: "cancelled",
        paymentStatus: "cancel",
        locksSlot: false,
      };
    case "expire":
      return {
        bookingStatus: "expired",
        paymentStatus: "expire",
        locksSlot: false,
      };
    case "failure":
      return {
        bookingStatus: "failed",
        paymentStatus: "failure",
        locksSlot: false,
      };
    case "refund":
    case "partial_refund":
      // Refunds are handled by the venue; the booking stays recorded as paid.
      return { bookingStatus: "paid", paymentStatus: "refund", locksSlot: true };
    default:
      return null;
  }
}

/**
 * Queries the gateway for a transaction's current status (official status
 * endpoint). Used to reconcile a booking when a notification is delayed —
 * returns null when the channel is unconfigured or unreachable.
 */
export async function fetchTransactionStatus(
  orderId: string
): Promise<Record<string, unknown> | null> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) return null;

  try {
    const response = await fetch(
      `${snapBaseUrl()}/v2/${encodeURIComponent(orderId)}/status`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      }
    );
    if (!response.ok) return null;
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
