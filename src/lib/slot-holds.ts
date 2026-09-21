/**
 * Slot-hold service ("kunci slot", PRD Fase 2).
 *
 * A hold reserves a court slot locally for ~10 minutes while the visitor
 * completes checkout on the official AYO channel. It exists for UX and
 * bookkeeping only — no booking or payment records are stored (PRD §6) and
 * AYO stays the source of truth for transactions.
 */
import { randomUUID } from "node:crypto";
import { and, eq, lt } from "drizzle-orm";
import { db, schema } from "@/db";
import { FIRST_HOUR, LAST_HOUR } from "@/data/pricing";
import {
  AvailabilityQueryError,
  getSlotAvailability,
} from "@/lib/availability";

export const HOLD_WINDOW_MINUTES = 10;
export const MAX_DURATION_HOURS = 3;

/** Reference alphabet without ambiguous characters (0/O, 1/I). */
const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const REFERENCE_RE = /^GP-[A-Z2-9]{6}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type SlotHoldChannel = "ayo" | "whatsapp";
export type SlotHoldStatus = "active" | "released" | "expired" | "completed";

export interface SlotHoldInput {
  venueId?: string;
  courtId: string;
  date: string;
  startHour: number;
  durationHours?: number;
  channel?: SlotHoldChannel;
}

export interface SlotHoldDto {
  id: string;
  reference: string;
  venueId: string;
  courtId: string;
  courtName: string | null;
  date: string;
  startHour: number;
  durationHours: number;
  channel: SlotHoldChannel;
  status: SlotHoldStatus;
  createdAt: string;
  expiresAt: string;
  releasedAt: string | null;
}

/** Hold payload enriched with countdown info for API consumers. */
export interface SlotHoldResponse extends SlotHoldDto {
  remainingSeconds: number;
  expired: boolean;
}

export function withRemaining(
  hold: SlotHoldDto,
  now: Date = new Date()
): SlotHoldResponse {
  const expires = new Date(hold.expiresAt).getTime();
  return {
    ...hold,
    remainingSeconds: Math.max(0, Math.round((expires - now.getTime()) / 1000)),
    expired: expires <= now.getTime(),
  };
}

export type SlotHoldErrorCode =
  | "INVALID_INPUT"
  | "SLOT_UNAVAILABLE"
  | "HOLD_CONFLICT"
  | "NOT_FOUND";

export class SlotHoldError extends Error {
  constructor(
    public code: SlotHoldErrorCode,
    message: string
  ) {
    super(message);
  }
}

/* ---------- pure helpers (unit tested) ---------- */

/** Human-friendly hold reference, e.g. "GP-7KQ4MZ". */
export function generateHoldReference(
  random: () => number = Math.random
): string {
  let suffix = "";
  for (let index = 0; index < 6; index++) {
    suffix +=
      REFERENCE_ALPHABET[
        Math.floor(random() * REFERENCE_ALPHABET.length) % REFERENCE_ALPHABET.length
      ];
  }
  return `GP-${suffix}`;
}

export function isValidHoldReference(value: string): boolean {
  return REFERENCE_RE.test(value);
}

/** Hold expiry — `minutes` after `from` (defaults to the 10-minute window). */
export function computeExpiresAt(
  from: Date,
  minutes: number = HOLD_WINDOW_MINUTES
): Date {
  return new Date(from.getTime() + minutes * 60_000);
}

/** Whether two hourly blocks overlap (same court + date assumed). */
export function hoursOverlap(
  aStart: number,
  aDuration: number,
  bStart: number,
  bDuration: number
): boolean {
  return aStart < bStart + bDuration && bStart < aStart + aDuration;
}

/* ---------- mapping ---------- */

type SlotHoldRow = typeof schema.slotHolds.$inferSelect;

function toDto(row: SlotHoldRow, courtName: string | null): SlotHoldDto {
  return {
    id: row.id,
    reference: row.reference,
    venueId: row.venueId,
    courtId: row.courtId,
    courtName,
    date: row.date,
    startHour: row.startHour,
    durationHours: row.durationHours,
    channel: row.channel,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
    releasedAt: row.releasedAt ? row.releasedAt.toISOString() : null,
  };
}

/* ---------- db-backed operations ---------- */

/** Marks expired holds as `expired`; returns how many were swept. */
export async function expireStaleHolds(now: Date = new Date()): Promise<number> {
  const stale = await db
    .select({ id: schema.slotHolds.id })
    .from(schema.slotHolds)
    .where(
      and(
        eq(schema.slotHolds.status, "active"),
        lt(schema.slotHolds.expiresAt, now)
      )
    );

  if (stale.length === 0) return 0;

  for (const row of stale) {
    await db
      .update(schema.slotHolds)
      .set({ status: "expired" })
      .where(eq(schema.slotHolds.id, row.id));
  }
  return stale.length;
}

export async function getSlotHold(
  reference: string
): Promise<SlotHoldDto | null> {
  const rows = await db
    .select({ hold: schema.slotHolds, courtName: schema.courts.name })
    .from(schema.slotHolds)
    .leftJoin(schema.courts, eq(schema.courts.id, schema.slotHolds.courtId))
    .where(eq(schema.slotHolds.reference, reference))
    .limit(1);

  const row = rows[0];
  return row ? toDto(row.hold, row.courtName) : null;
}

async function findActiveConflict(
  courtId: string,
  date: string,
  startHour: number,
  durationHours: number,
  now: Date
): Promise<SlotHoldDto | null> {
  const rows = await db
    .select({ hold: schema.slotHolds, courtName: schema.courts.name })
    .from(schema.slotHolds)
    .leftJoin(schema.courts, eq(schema.courts.id, schema.slotHolds.courtId))
    .where(
      and(
        eq(schema.slotHolds.courtId, courtId),
        eq(schema.slotHolds.date, date),
        eq(schema.slotHolds.status, "active")
      )
    );

  const conflict = rows.find(
    (row) =>
      row.hold.expiresAt > now &&
      hoursOverlap(
        startHour,
        durationHours,
        row.hold.startHour,
        row.hold.durationHours
      )
  );
  return conflict ? toDto(conflict.hold, conflict.courtName) : null;
}

/**
 * Creates a hold for an available slot. Validates the block against the
 * availability engine, sweeps stale holds, then rejects overlapping active
 * holds for the same court.
 */
export async function createSlotHold(
  input: SlotHoldInput,
  now: Date = new Date()
): Promise<SlotHoldDto> {
  const durationHours = input.durationHours ?? 1;

  if (!DATE_RE.test(input.date)) {
    throw new SlotHoldError(
      "INVALID_INPUT",
      `Invalid date "${input.date}" — expected YYYY-MM-DD.`
    );
  }
  if (
    !Number.isInteger(input.startHour) ||
    input.startHour < FIRST_HOUR ||
    input.startHour > LAST_HOUR
  ) {
    throw new SlotHoldError(
      "INVALID_INPUT",
      `startHour must be an integer between ${FIRST_HOUR} and ${LAST_HOUR}.`
    );
  }
  if (
    !Number.isInteger(durationHours) ||
    durationHours < 1 ||
    durationHours > MAX_DURATION_HOURS ||
    input.startHour + durationHours - 1 > LAST_HOUR
  ) {
    throw new SlotHoldError(
      "INVALID_INPUT",
      `durationHours must be 1–${MAX_DURATION_HOURS} and fit before ${LAST_HOUR + 1}:00.`
    );
  }

  let availability;
  try {
    availability = await getSlotAvailability(input.date, {
      venueId: input.venueId,
      courtId: input.courtId,
      hour: input.startHour,
      duration: durationHours,
    });
  } catch (error) {
    if (error instanceof AvailabilityQueryError) {
      throw new SlotHoldError("SLOT_UNAVAILABLE", error.detail.message);
    }
    throw error;
  }

  const match = availability.matches?.find(
    (item) => item.courtId === input.courtId
  );
  if (!match?.available) {
    throw new SlotHoldError(
      "SLOT_UNAVAILABLE",
      `Slot ${input.startHour}:00 (${durationHours}h) on ${input.courtId} is not available.`
    );
  }

  await expireStaleHolds(now);
  const conflict = await findActiveConflict(
    input.courtId,
    input.date,
    input.startHour,
    durationHours,
    now
  );
  if (conflict) {
    throw new SlotHoldError(
      "HOLD_CONFLICT",
      `Slot already held — reference ${conflict.reference} until ${conflict.expiresAt}.`
    );
  }

  const expiresAt = computeExpiresAt(now);

  for (let attempt = 0; attempt < 3; attempt++) {
    const reference = generateHoldReference();
    try {
      await db.insert(schema.slotHolds).values({
        id: randomUUID(),
        reference,
        venueId: availability.venue.id,
        courtId: input.courtId,
        date: input.date,
        startHour: input.startHour,
        durationHours,
        channel: input.channel ?? "ayo",
        status: "active",
        createdAt: now,
        expiresAt,
      });
      const hold = await getSlotHold(reference);
      if (hold) return hold;
    } catch {
      // reference collision — retry with a fresh one
    }
  }

  throw new SlotHoldError(
    "INVALID_INPUT",
    "Could not allocate a unique hold reference."
  );
}

/**
 * Marks an active hold as fulfilled (payment succeeded on the official
 * channel). Idempotent — expired/released/completed holds are returned as-is.
 */
export async function completeSlotHold(
  reference: string,
  now: Date = new Date()
): Promise<SlotHoldDto> {
  const hold = await getSlotHold(reference);
  if (!hold) {
    throw new SlotHoldError("NOT_FOUND", `Unknown hold "${reference}".`);
  }
  if (hold.status !== "active" || new Date(hold.expiresAt) <= now) {
    return hold;
  }

  await db
    .update(schema.slotHolds)
    .set({ status: "completed", releasedAt: now })
    .where(eq(schema.slotHolds.reference, reference));

  return (await getSlotHold(reference)) as SlotHoldDto;
}

/** Releases an active hold (idempotent for already released/expired holds). */
export async function releaseSlotHold(
  reference: string,
  now: Date = new Date()
): Promise<SlotHoldDto> {
  const hold = await getSlotHold(reference);
  if (!hold) {
    throw new SlotHoldError("NOT_FOUND", `Unknown hold "${reference}".`);
  }
  if (hold.status !== "active") return hold;

  await db
    .update(schema.slotHolds)
    .set({ status: "released", releasedAt: now })
    .where(eq(schema.slotHolds.reference, reference));

  return (await getSlotHold(reference)) as SlotHoldDto;
}
