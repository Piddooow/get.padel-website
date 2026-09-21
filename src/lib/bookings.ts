/**
 * Booking engine for the "Book & Pay" flow.
 *
 * Guarantees:
 * - Availability is re-validated against the official AYO feed immediately
 *   before a booking (and its payment window) is created — never from cache.
 * - The database enforces one live booking per court/date/hour via a partial
 *   unique index, so two visitors can never take the same slot.
 * - Payment follows the official Midtrans Snap flow; the webhook signature is
 *   verified before any state changes and updates are idempotent.
 */
import { randomBytes } from "node:crypto";
import { and, desc, eq, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSlotAvailability } from "@/lib/availability";
import { isSlotPast } from "@/lib/time";
import {
  createSnapTransaction,
  DEFAULT_EXPIRY_MINUTES,
  fetchTransactionStatus,
  isMidtransConfigured,
  mapMidtransStatus,
  MidtransError,
  verifyMidtransSignature,
  type MidtransTransactionStatus,
} from "@/lib/midtrans";

export type BookingErrorCode =
  | "INVALID_INPUT"
  | "PAST"
  | "OUT_OF_HOURS"
  | "AYO_UNAVAILABLE"
  | "SLOT_UNAVAILABLE"
  | "SLOT_TAKEN"
  | "PAYMENT_UNCONFIGURED"
  | "PAYMENT_ERROR";

export interface CreateBookingInput {
  userId: string;
  courtId: string;
  date: string;
  startHour: number;
  durationHours: number;
  /** Where Snap returns the visitor after paying (or failing). */
  finishUrl?: string;
}

export interface BookingView {
  reference: string;
  courtId: string;
  courtName: string;
  date: string;
  startHour: number;
  durationHours: number;
  amountIdr: number;
  status: schema.Booking["status"];
  paymentStatus: schema.Booking["paymentStatus"];
  redirectUrl: string | null;
  createdAt: string;
  expiresAt: string;
  paidAt: string | null;
}

function toView(
  booking: schema.Booking,
  courtName: string
): BookingView {
  return {
    reference: booking.reference,
    courtId: booking.courtId,
    courtName,
    date: booking.date,
    startHour: booking.startHour,
    durationHours: booking.durationHours,
    amountIdr: booking.amountIdr,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    redirectUrl: booking.snapRedirectUrl ?? null,
    createdAt: booking.createdAt.toISOString(),
    expiresAt: booking.expiresAt.toISOString(),
    paidAt: booking.paidAt ? booking.paidAt.toISOString() : null,
  };
}

/** Human-friendly booking reference, e.g. GP-20260921-4F7A2C. */
function newReference(dateISO: string): string {
  const compact = dateISO.replaceAll("-", "");
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `GP-${compact}-${suffix}`;
}

/**
 * Releases slots whose payment window elapsed. Called before every new
 * booking so abandoned checkouts never block a court.
 */
export async function expireStaleBookings(): Promise<number> {
  const result = await db
    .update(schema.bookings)
    .set({
      status: "expired",
      paymentStatus: "expire",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.bookings.status, "pending_payment"),
        lt(schema.bookings.expiresAt, new Date())
      )
    )
    .returning({ id: schema.bookings.id });
  return result.length;
}

export type CreateBookingResult =
  | { ok: true; booking: BookingView }
  | { ok: false; code: BookingErrorCode; message: string };

/**
 * Creates a booking + its Midtrans Snap payment page. The slot is validated
 * against AYO right before the insert and again by the database constraint.
 */
export async function createBooking(
  input: CreateBookingInput
): Promise<CreateBookingResult> {
  const duration = Math.trunc(input.durationHours || 1);
  const startHour = Math.trunc(input.startHour);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
    !Number.isInteger(startHour) ||
    duration < 1 ||
    duration > 3
  ) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message: "Invalid court, date or duration.",
    };
  }

  if (startHour < 6 || startHour + duration > 22) {
    return {
      ok: false,
      code: "OUT_OF_HOURS",
      message: "Sessions run between 06.00 and 22.00.",
    };
  }

  // Real system clock (venue timezone): a slot that already started is gone.
  if (isSlotPast(input.date, startHour)) {
    return {
      ok: false,
      code: "PAST",
      message: "That start time has already passed.",
    };
  }

  if (!isMidtransConfigured()) {
    return {
      ok: false,
      code: "PAYMENT_UNCONFIGURED",
      message: "Online payment is not configured.",
    };
  }

  // Re-validate against the official AYO availability right now.
  const availability = await getSlotAvailability(input.date, {
    courtId: input.courtId,
  });
  if (availability.dataSource !== "ayo") {
    return {
      ok: false,
      code: "AYO_UNAVAILABLE",
      message: "Real-time availability is not available.",
    };
  }

  const court = availability.courts.find((c) => c.courtId === input.courtId);
  if (!court) {
    return {
      ok: false,
      code: "INVALID_INPUT",
      message: "Unknown court.",
    };
  }

  const hours = Array.from({ length: duration }, (_, index) => startHour + index);
  const slots = hours.map((hour) => court.slots.find((slot) => slot.hour === hour));
  if (slots.some((slot) => !slot || slot.status !== "available")) {
    return {
      ok: false,
      code: "SLOT_UNAVAILABLE",
      message: "That slot is no longer available.",
    };
  }
  const amountIdr = slots.reduce((sum, slot) => sum + (slot?.price ?? 0), 0);

  // Free slots from abandoned checkouts before claiming one.
  await expireStaleBookings();

  // Idempotency: the same visitor returning to an open checkout keeps it.
  const [existing] = await db
    .select()
    .from(schema.bookings)
    .where(
      and(
        eq(schema.bookings.userId, input.userId),
        eq(schema.bookings.courtId, input.courtId),
        eq(schema.bookings.date, input.date),
        eq(schema.bookings.startHour, startHour),
        eq(schema.bookings.status, "pending_payment")
      )
    )
    .limit(1);
  if (existing?.snapRedirectUrl) {
    return {
      ok: true,
      booking: toView(existing, court.name),
    };
  }

  const [venueRow] = await db.select().from(schema.venues).limit(1);
  if (!venueRow) {
    return { ok: false, code: "INVALID_INPUT", message: "Venue not found." };
  }

  const expiresAt = new Date(Date.now() + DEFAULT_EXPIRY_MINUTES * 60_000);
  const reference = newReference(input.date);
  const providerOrderId = reference;

  let inserted: schema.Booking;
  try {
    const [row] = await db
      .insert(schema.bookings)
      .values({
        id: randomBytes(12).toString("hex"),
        reference,
        userId: input.userId,
        venueId: venueRow.id,
        courtId: input.courtId,
        date: input.date,
        startHour,
        durationHours: duration,
        amountIdr,
        status: "pending_payment",
        paymentStatus: "pending",
        provider: "midtrans",
        providerOrderId,
        expiresAt,
      })
      .returning();
    inserted = row;
  } catch {
    // Unique index hit: another visitor claimed the slot first.
    return {
      ok: false,
      code: "SLOT_TAKEN",
      message: "Someone else just booked that slot.",
    };
  }

  // Create the payment page. On failure the hold is released immediately.
  try {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, input.userId))
      .limit(1);
    const hourLabel = `${String(startHour).padStart(2, "0")}.00`;
    const snap = await createSnapTransaction({
      orderId: providerOrderId,
      amountIdr,
      itemName: `${court.name} · ${input.date} ${hourLabel}`,
      customer: {
        name: user?.name ?? "Get Padel Player",
        email: user?.email ?? "",
        whatsapp: user?.whatsapp ?? null,
      },
      finishUrl: input.finishUrl,
    });

    const [updated] = await db
      .update(schema.bookings)
      .set({
        snapToken: snap.token,
        snapRedirectUrl: snap.redirectUrl,
        updatedAt: new Date(),
      })
      .where(eq(schema.bookings.id, inserted.id))
      .returning();
    inserted = updated;
  } catch (error) {
    await db
      .update(schema.bookings)
      .set({
        status: "failed",
        paymentStatus: "failure",
        updatedAt: new Date(),
      })
      .where(eq(schema.bookings.id, inserted.id));
    return {
      ok: false,
      code: "PAYMENT_ERROR",
      message:
        error instanceof MidtransError
          ? error.message
          : "Could not start the payment.",
    };
  }

  return { ok: true, booking: toView(inserted, court.name) };
}

/* ------------------------------------------------------------------ reads */

export async function listBookingsForUser(
  userId: string
): Promise<BookingView[]> {
  const rows = await db
    .select({ booking: schema.bookings, courtName: schema.courts.name })
    .from(schema.bookings)
    .innerJoin(schema.courts, eq(schema.courts.id, schema.bookings.courtId))
    .where(eq(schema.bookings.userId, userId))
    .orderBy(desc(schema.bookings.createdAt));

  return rows.map((row) => toView(row.booking, row.courtName));
}

/** Owner-scoped lookup — returns null for anyone else's reference. */
export async function getBookingForUser(
  reference: string,
  userId: string
): Promise<BookingView | null> {
  const [row] = await db
    .select({ booking: schema.bookings, courtName: schema.courts.name })
    .from(schema.bookings)
    .innerJoin(schema.courts, eq(schema.courts.id, schema.bookings.courtId))
    .where(
      and(
        eq(schema.bookings.reference, reference),
        eq(schema.bookings.userId, userId)
      )
    )
    .limit(1);

  return row ? toView(row.booking, row.courtName) : null;
}

/**
 * Reconciles the visitor's own booking with the gateway before rendering it:
 * frees expired holds, and re-checks pending payments against Midtrans'
 * official status endpoint so My Booking always shows the real state even if
 * a webhook notification is delayed.
 */
export async function syncBookingWithGateway(
  reference: string,
  userId: string
): Promise<BookingView | null> {
  await expireStaleBookings();

  const [row] = await db
    .select({ booking: schema.bookings, courtName: schema.courts.name })
    .from(schema.bookings)
    .innerJoin(schema.courts, eq(schema.courts.id, schema.bookings.courtId))
    .where(
      and(
        eq(schema.bookings.reference, reference),
        eq(schema.bookings.userId, userId)
      )
    )
    .limit(1);

  if (!row) return null;
  if (row.booking.status !== "pending_payment" || !isMidtransConfigured()) {
    return toView(row.booking, row.courtName);
  }

  const status = await fetchTransactionStatus(row.booking.providerOrderId);
  const transactionStatus =
    typeof status?.transaction_status === "string"
      ? (status.transaction_status as MidtransTransactionStatus)
      : null;
  const statusCode =
    typeof status?.status_code === "string" ? status.status_code : null;
  const grossAmount =
    typeof status?.gross_amount === "string"
      ? status.gross_amount
      : typeof status?.gross_amount === "number"
        ? String(status.gross_amount)
        : null;
  const signatureKey =
    typeof status?.signature_key === "string" ? status.signature_key : null;

  if (transactionStatus && statusCode && grossAmount) {
    const trusted =
      !signatureKey ||
      verifyMidtransSignature({
        orderId: row.booking.providerOrderId,
        statusCode,
        grossAmount,
        signatureKey,
      });
    if (trusted) {
      await applyPaymentNotification({
        orderId: row.booking.providerOrderId,
        transactionStatus,
        fraudStatus:
          typeof status?.fraud_status === "string" ? status.fraud_status : null,
        grossAmount,
        transactionId:
          typeof status?.transaction_id === "string" ? status.transaction_id : null,
        statusCode,
        raw: status,
      });
    }
  }

  const [refreshed] = await db
    .select({ booking: schema.bookings, courtName: schema.courts.name })
    .from(schema.bookings)
    .innerJoin(schema.courts, eq(schema.courts.id, schema.bookings.courtId))
    .where(eq(schema.bookings.id, row.booking.id))
    .limit(1);

  return refreshed ? toView(refreshed.booking, refreshed.courtName) : null;
}

/* --------------------------------------------------------------- payments */

export interface PaymentNotification {
  orderId: string;
  transactionStatus: MidtransTransactionStatus;
  fraudStatus?: string | null;
  grossAmount: string;
  transactionId?: string | null;
  statusCode: string;
  raw: unknown;
}

export type PaymentApplyResult =
  | { ok: true; applied: boolean; status: schema.Booking["status"] }
  | { ok: false; reason: "unknown_order" | "amount_mismatch" | "ignored" };

/**
 * Applies a verified gateway notification to its booking. Idempotent: repeat
 * notifications (Midtrans retries) never change an already-final state, and a
 * paid booking is never downgraded.
 */
export async function applyPaymentNotification(
  notification: PaymentNotification
): Promise<PaymentApplyResult> {
  const [booking] = await db
    .select()
    .from(schema.bookings)
    .where(eq(schema.bookings.providerOrderId, notification.orderId))
    .limit(1);

  if (!booking) return { ok: false, reason: "unknown_order" };

  const grossAmount = Number(notification.grossAmount);
  if (Number.isFinite(grossAmount) && grossAmount !== booking.amountIdr) {
    return { ok: false, reason: "amount_mismatch" };
  }

  const mapped = mapMidtransStatus(
    notification.transactionStatus,
    notification.fraudStatus
  );

  const alreadyFinal =
    booking.status === "paid" &&
    (notification.transactionStatus === "settlement" ||
      notification.transactionStatus === "capture");

  if (!mapped || (alreadyFinal && mapped.bookingStatus === "paid")) {
    // Still record the event for auditing.
    await db.insert(schema.payments).values({
      id: randomBytes(12).toString("hex"),
      bookingId: booking.id,
      provider: "midtrans",
      providerOrderId: notification.orderId,
      transactionId: notification.transactionId ?? null,
      transactionStatus: notification.transactionStatus,
      fraudStatus: notification.fraudStatus ?? null,
      grossAmount: Number.isFinite(grossAmount) ? Math.round(grossAmount) : null,
      payload: JSON.stringify(notification.raw).slice(0, 4000),
    });
    return { ok: true, applied: false, status: booking.status };
  }

  // Never downgrade a paid booking (e.g. an out-of-order "pending" retry).
  const nextStatus =
    booking.status === "paid" ? "paid" : mapped.bookingStatus;
  const nextPaymentStatus =
    booking.status === "paid" && mapped.paymentStatus !== "refund"
      ? booking.paymentStatus
      : mapped.paymentStatus;

  await db
    .update(schema.bookings)
    .set({
      status: nextStatus,
      paymentStatus: nextPaymentStatus,
      paidAt:
        nextStatus === "paid" ? (booking.paidAt ?? new Date()) : booking.paidAt,
      updatedAt: new Date(),
    })
    .where(eq(schema.bookings.id, booking.id));

  await db.insert(schema.payments).values({
    id: randomBytes(12).toString("hex"),
    bookingId: booking.id,
    provider: "midtrans",
    providerOrderId: notification.orderId,
    transactionId: notification.transactionId ?? null,
    transactionStatus: notification.transactionStatus,
    fraudStatus: notification.fraudStatus ?? null,
    grossAmount: Number.isFinite(grossAmount) ? Math.round(grossAmount) : null,
    payload: JSON.stringify(notification.raw).slice(0, 4000),
  });

  return { ok: true, applied: true, status: nextStatus };
}
