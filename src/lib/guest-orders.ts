/**
 * Guest-order service ("pesanan tamu tanpa akun", PRD Fase 2).
 *
 * A guest order pairs the temporary slot hold with the guest's chosen
 * handoff channel (AYO or WhatsApp) and — when provided — contact details so
 * CS can help with confirmations. No payment credentials or payment status
 * are stored; AYO completes the booking (PRD §6).
 */
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getSlotAvailability, AvailabilityQueryError } from "@/lib/availability";
import {
  createSlotHold,
  isValidHoldReference,
  releaseSlotHold,
  SlotHoldError,
  type SlotHoldChannel,
} from "@/lib/slot-holds";

export const PAYMENT_METHODS = [
  "qris",
  "va",
  "ewallet",
  "card",
  "installment",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type GuestOrderStatus = "created" | "handed_off" | "cancelled";

const PHONE_RE = /^(\+?62|0)8\d{7,12}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface GuestContact {
  name?: string;
  whatsapp?: string;
  email?: string;
}

export interface CreateGuestOrderInput {
  venueId?: string;
  courtId: string;
  date: string;
  startHour: number;
  durationHours?: number;
  channel?: SlotHoldChannel;
  paymentMethod?: PaymentMethod;
  guest?: GuestContact;
}

export interface GuestOrderDto {
  id: string;
  reference: string;
  status: GuestOrderStatus;
  channel: SlotHoldChannel;
  paymentMethod: PaymentMethod | null;
  venueId: string;
  venueName: string | null;
  courtId: string;
  courtName: string | null;
  date: string;
  startHour: number;
  durationHours: number;
  totals: {
    price: number;
    strike: number;
    discountPercent: number;
  };
  guest: {
    name: string | null;
    whatsapp: string | null;
    email: string | null;
  } | null;
  hold: {
    id: string;
    status: string;
    expiresAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  lastNotifiedAt: string | null;
}

export type GuestOrderErrorCode =
  | "INVALID_INPUT"
  | "SLOT_UNAVAILABLE"
  | "HOLD_CONFLICT"
  | "NOT_FOUND"
  | "HOLD_EXPIRED"
  | "INVALID_STATE";

export class GuestOrderError extends Error {
  constructor(
    public code: GuestOrderErrorCode,
    message: string
  ) {
    super(message);
  }
}

/* ---------- validation (pure, unit tested) ---------- */

export interface NormalizedGuest {
  name: string | null;
  whatsapp: string | null;
  email: string | null;
}

export function normalizePhone(value: string): string {
  return value.replace(/[\s().-]/g, "");
}

export function validateGuestContact(
  guest: GuestContact | undefined,
  channel: SlotHoldChannel
): NormalizedGuest {
  const name = guest?.name?.trim() ?? "";
  const whatsappRaw = guest?.whatsapp?.trim() ?? "";
  const email = guest?.email?.trim() ?? "";
  const whatsapp = whatsappRaw ? normalizePhone(whatsappRaw) : "";

  if (channel === "whatsapp" && (!name || !whatsapp)) {
    throw new GuestOrderError(
      "INVALID_INPUT",
      "channel=whatsapp requires guest.name and guest.whatsapp."
    );
  }
  if (whatsapp && !PHONE_RE.test(whatsapp)) {
    throw new GuestOrderError(
      "INVALID_INPUT",
      "guest.whatsapp must be a valid Indonesian number (e.g. 0811… or 62811…)."
    );
  }
  if (email && !EMAIL_RE.test(email)) {
    throw new GuestOrderError("INVALID_INPUT", "guest.email is invalid.");
  }

  return {
    name: name || null,
    whatsapp: whatsapp || null,
    email: email || null,
  };
}

export function validatePaymentMethod(
  value: string | undefined
): PaymentMethod | null {
  if (value == null || value === "") return null;
  if (!(PAYMENT_METHODS as readonly string[]).includes(value)) {
    throw new GuestOrderError(
      "INVALID_INPUT",
      `paymentMethod must be one of: ${PAYMENT_METHODS.join(", ")}.`
    );
  }
  return value as PaymentMethod;
}

/* ---------- db-backed operations ---------- */

type GuestOrderRow = typeof schema.guestOrders.$inferSelect;
type SlotHoldRow = typeof schema.slotHolds.$inferSelect;

function toDto(
  row: GuestOrderRow,
  hold: SlotHoldRow | null,
  venueName: string | null,
  courtName: string | null,
  totals: GuestOrderDto["totals"]
): GuestOrderDto {
  return {
    id: row.id,
    reference: row.reference,
    status: row.status,
    channel: row.channel,
    paymentMethod: row.paymentMethod ?? null,
    venueId: row.venueId,
    venueName,
    courtId: row.courtId,
    courtName,
    date: row.date,
    startHour: row.startHour,
    durationHours: row.durationHours,
    totals,
    guest:
      row.guestName || row.guestWhatsapp || row.guestEmail
        ? {
            name: row.guestName,
            whatsapp: row.guestWhatsapp,
            email: row.guestEmail,
          }
        : null,
    hold: hold
      ? {
          id: hold.id,
          status: hold.status,
          expiresAt: hold.expiresAt.toISOString(),
        }
      : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    lastNotifiedAt: row.lastNotifiedAt ? row.lastNotifiedAt.toISOString() : null,
  };
}

async function loadContext(reference: string): Promise<{
  row: GuestOrderRow;
  hold: SlotHoldRow | null;
  venueName: string | null;
  courtName: string | null;
  totals: GuestOrderDto["totals"];
} | null> {
  const rows = await db
    .select({
      order: schema.guestOrders,
      hold: schema.slotHolds,
      venueName: schema.venues.name,
      courtName: schema.courts.name,
    })
    .from(schema.guestOrders)
    .leftJoin(
      schema.slotHolds,
      eq(schema.slotHolds.id, schema.guestOrders.holdId)
    )
    .leftJoin(schema.venues, eq(schema.venues.id, schema.guestOrders.venueId))
    .leftJoin(schema.courts, eq(schema.courts.id, schema.guestOrders.courtId))
    .where(eq(schema.guestOrders.reference, reference))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const pricing = await getSlotAvailability(row.order.date, {
    courtId: row.order.courtId,
    hour: row.order.startHour,
    duration: row.order.durationHours,
  });
  const match = pricing.matches?.find(
    (item) => item.courtId === row.order.courtId
  );
  const totals = {
    price: match?.totalPrice ?? 0,
    strike: match?.strikeTotal ?? 0,
    discountPercent:
      match && match.strikeTotal > match.totalPrice
        ? Math.round((1 - match.totalPrice / match.strikeTotal) * 100)
        : 0,
  };

  return {
    row: row.order,
    hold: row.hold,
    venueName: row.venueName,
    courtName: row.courtName,
    totals,
  };
}

/**
 * Guards the payment handoff: the order must not be cancelled and its local
 * slot hold must still be active (the ~10-minute window).
 */
export function assertOrderReadyForHandoff(
  order: GuestOrderDto,
  now: Date = new Date()
): void {
  if (order.status === "cancelled") {
    throw new GuestOrderError(
      "INVALID_STATE",
      `Order "${order.reference}" was cancelled.`
    );
  }
  const hold = order.hold;
  if (
    !hold ||
    hold.status !== "active" ||
    new Date(hold.expiresAt).getTime() <= now.getTime()
  ) {
    throw new GuestOrderError(
      "HOLD_EXPIRED",
      `The slot hold for "${order.reference}" is no longer active. Create a new hold before paying.`
    );
  }
}

/** Creates a slot hold plus the guest order that references it. */
export async function createGuestOrder(
  input: CreateGuestOrderInput,
  now: Date = new Date()
): Promise<GuestOrderDto> {
  const channel: SlotHoldChannel = input.channel ?? "ayo";
  const guest = validateGuestContact(input.guest, channel);
  const paymentMethod = validatePaymentMethod(input.paymentMethod);

  let hold;
  try {
    hold = await createSlotHold(
      {
        venueId: input.venueId,
        courtId: input.courtId,
        date: input.date,
        startHour: input.startHour,
        durationHours: input.durationHours ?? 1,
        channel,
      },
      now
    );
  } catch (error) {
    if (error instanceof SlotHoldError) {
      throw new GuestOrderError(error.code, error.message);
    }
    throw error;
  }

  await db.insert(schema.guestOrders).values({
    id: randomUUID(),
    reference: hold.reference,
    holdId: hold.id,
    venueId: hold.venueId,
    courtId: hold.courtId,
    date: hold.date,
    startHour: hold.startHour,
    durationHours: hold.durationHours,
    channel,
    paymentMethod,
    guestName: guest.name,
    guestWhatsapp: guest.whatsapp,
    guestEmail: guest.email,
    status: "created",
    createdAt: now,
    updatedAt: now,
  });

  const order = await getGuestOrder(hold.reference);
  if (!order) {
    throw new GuestOrderError("INVALID_INPUT", "Guest order insert failed.");
  }
  return order;
}

export async function getGuestOrder(
  reference: string
): Promise<GuestOrderDto | null> {
  if (!isValidHoldReference(reference)) return null;
  const context = await loadContext(reference);
  if (!context) return null;
  return toDto(
    context.row,
    context.hold,
    context.venueName,
    context.courtName,
    context.totals
  );
}

/** Records that the booking proof was (re)sent — drives the resend cooldown. */
export async function markOrderNotified(
  reference: string,
  now: Date = new Date()
): Promise<GuestOrderDto | null> {
  await db
    .update(schema.guestOrders)
    .set({ lastNotifiedAt: now, updatedAt: now })
    .where(eq(schema.guestOrders.reference, reference));
  return getGuestOrder(reference);
}

/** Marks the order as handed off to AYO/WhatsApp (idempotent). */
export async function markGuestOrderHandedOff(
  reference: string,
  now: Date = new Date()
): Promise<GuestOrderDto> {
  const existing = await getGuestOrder(reference);
  if (!existing) {
    throw new GuestOrderError("NOT_FOUND", `Unknown order "${reference}".`);
  }
  if (existing.status === "handed_off") return existing;

  await db
    .update(schema.guestOrders)
    .set({ status: "handed_off", updatedAt: now })
    .where(eq(schema.guestOrders.reference, reference));

  return (await getGuestOrder(reference)) as GuestOrderDto;
}

/** Cancels the order and releases its slot hold (idempotent). */
export async function cancelGuestOrder(
  reference: string,
  now: Date = new Date()
): Promise<GuestOrderDto> {
  const existing = await getGuestOrder(reference);
  if (!existing) {
    throw new GuestOrderError("NOT_FOUND", `Unknown order "${reference}".`);
  }
  if (existing.status === "cancelled") return existing;

  try {
    await releaseSlotHold(reference, now);
  } catch (error) {
    if (
      !(error instanceof SlotHoldError) ||
      error.code !== "NOT_FOUND"
    ) {
      throw error;
    }
  }

  await db
    .update(schema.guestOrders)
    .set({ status: "cancelled", updatedAt: now })
    .where(eq(schema.guestOrders.reference, reference));

  return (await getGuestOrder(reference)) as GuestOrderDto;
}

export { AvailabilityQueryError };
