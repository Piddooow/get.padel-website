/**
 * Slot availability query layer (server-only).
 *
 * The ONLY source of slot statuses is the official AYO real-time sync
 * (`schedule_slots` rows with `source = "ayo"`). When that data is missing or
 * stale the response is an explicit `dataSource: "unavailable"` with no
 * courts — the UI then points visitors at the official booking channel
 * instead of showing a schedule that might be wrong.
 */
import { and, asc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  addDays,
  getDayType,
  nextWeekendISO,
  toISODate,
} from "@/data/pricing";
import {
  calculateBlockPricing,
  loadPricingLookup,
  summarizeSlots,
  type SlotSummary,
} from "@/lib/schedule-service";
import { summarizeSources, type DataSource } from "@/lib/ayo-sync";
import { isDatabaseEnabled } from "@/db";
import { isSlotPast, jakartaNow } from "@/lib/time";
import type { SlotStatus } from "@/data/slots";



export interface AvailabilitySlotDto {
  hour: number;
  status: SlotStatus;
  price: number;
  strike: number;
  /** Peak-hour classification from the rate card. */
  peak: boolean;
}

export interface CourtAvailabilityDto {
  courtId: string;
  name: string;
  indoor: boolean;
  availableCount: number;
  slots: AvailabilitySlotDto[];
}

export type AvailabilitySummaryDto = SlotSummary;

/** Whether a consecutive block of `duration` hours can be booked. */
export interface AvailabilityMatchDto {
  courtId: string;
  name: string;
  startHour: number;
  duration: number;
  available: boolean;
  totalPrice: number;
  strikeTotal: number;
}

export interface VenueInfoDto {
  id: string;
  name: string;
  tagline: string;
  courtOpenHour: number;
  courtCloseHour: number;
  sessionMinutes: number;
  bookingUrl: string;
}

export interface AvailabilityResponse {
  venue: VenueInfoDto;
  date: string;
  /** Echoes the preset when `date` was a preset (today|tomorrow|weekend). */
  preset?: DatePreset;
  dayType: "weekday" | "weekend";
  courts: CourtAvailabilityDto[];
  summary: AvailabilitySummaryDto;
  matches?: AvailabilityMatchDto[];
  /** Where this date's statuses came from: official AYO sync or nothing. */
  dataSource: DataSource;
  /** Last AYO check time (ISO), present only when statuses came from AYO. */
  syncedAt: string | null;
  /** Why the data is unavailable (only present in that case). */
  reason?: "not_synced" | "stale" | "unconfigured" | "error";
}

/** How long an AYO sync stays trustworthy (minutes). */
export const AYO_MAX_AGE_MINUTES = Number(
  process.env.AYO_AVAILABILITY_MAX_AGE_MINUTES ?? 15
);

export const DATE_PRESETS = ["today", "tomorrow", "weekend"] as const;
export type DatePreset = (typeof DATE_PRESETS)[number];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Venue id of the single venue this landing page represents. */
const VENUE_ID = "get-padel-jakarta";

/**
 * Resolves a `date` param that is either a preset (today | tomorrow |
 * weekend → next Saturday) or an explicit YYYY-MM-DD date.
 */
export function resolveDateParam(
  value: string,
  now: Date = new Date()
): { dateISO: string; preset?: DatePreset } {
  if ((DATE_PRESETS as readonly string[]).includes(value)) {
    const preset = value as DatePreset;
    if (preset === "today") return { dateISO: toISODate(now), preset };
    if (preset === "tomorrow")
      return { dateISO: toISODate(addDays(now, 1)), preset };
    return { dateISO: nextWeekendISO(now), preset };
  }
  if (!DATE_RE.test(value)) {
    throw new AvailabilityQueryError({
      code: "INVALID_DATE",
      message: `Invalid date "${value}". Use YYYY-MM-DD or today|tomorrow|weekend.`,
    });
  }
  return { dateISO: value };
}

export interface AvailabilityQuery {
  /** Venue id; defaults to the first venue when omitted. */
  venueId?: string;
  courtId?: string;
  /** Filter courts by type (all Get Padel courts are indoor). */
  indoor?: boolean;
  /** Start hour for a bookability check (6–21). */
  hour?: number;
  /** Consecutive hours for the check (1–3). */
  duration?: number;
}

export interface AvailabilityError {
  code:
    | "INVALID_DATE"
    | "OUT_OF_RANGE"
    | "UNKNOWN_COURT"
    | "VENUE_NOT_FOUND";
  message: string;
}

export class AvailabilityQueryError extends Error {
  constructor(public detail: AvailabilityError) {
    super(detail.message);
  }
}

/** Synced window of official AYO data (YYYY-MM-DD → YYYY-MM-DD). */
export async function getAyoRange(): Promise<{
  from: string | null;
  to: string | null;
}> {
  const [row] = await db
    .select({
      from: sql<string | null>`min(${schema.scheduleSlots.date})`,
      to: sql<string | null>`max(${schema.scheduleSlots.date})`,
    })
    .from(schema.scheduleSlots)
    .where(eq(schema.scheduleSlots.source, "ayo"));
  return { from: row?.from ?? null, to: row?.to ?? null };
}

function fallbackVenueInfo(): VenueInfoDto {
  return {
    id: VENUE_ID,
    name: "Get Padel Jakarta",
    tagline: "Get Padel, Get Well",
    courtOpenHour: 6,
    courtCloseHour: 22,
    sessionMinutes: 60,
    bookingUrl: "https://ayo.co.id/v/get-padel-jakarta",
  };
}

function unavailableResponse(
  dateISO: string,
  preset: DatePreset | undefined,
  reason: NonNullable<AvailabilityResponse["reason"]>
): AvailabilityResponse {
  return {
    venue: fallbackVenueInfo(),
    date: dateISO,
    ...(preset ? { preset } : {}),
    dayType: getDayType(dateISO),
    courts: [],
    summary: summarizeSlots([]),
    dataSource: "unavailable",
    syncedAt: null,
    reason,
  };
}

export async function getSlotAvailability(
  dateParam: string,
  query: AvailabilityQuery = {}
): Promise<AvailabilityResponse> {
  const { dateISO, preset } = resolveDateParam(dateParam);
  const now = jakartaNow();

  // A missing/unreachable database must not surface as a 500: the schedule is
  // honestly reported as unavailable so the UI can point at the official
  // booking channel.
  if (!isDatabaseEnabled()) {
    return unavailableResponse(dateISO, preset, "error");
  }

  try {
    return await queryAvailability(dateISO, preset, query, now);
  } catch (error) {
    if (error instanceof AvailabilityQueryError) throw error;
    return unavailableResponse(dateISO, preset, "error");
  }
}

async function queryAvailability(
  dateISO: string,
  preset: DatePreset | undefined,
  query: AvailabilityQuery,
  now: ReturnType<typeof jakartaNow>
): Promise<AvailabilityResponse> {
  const venueRows = await db
    .select()
    .from(schema.venues)
    .orderBy(asc(schema.venues.id));

  const venue = query.venueId
    ? venueRows.find((row) => row.id === query.venueId)
    : venueRows[0];

  if (!venue) {
    throw new AvailabilityQueryError({
      code: "VENUE_NOT_FOUND",
      message: `Unknown venue "${query.venueId}".`,
    });
  }

  const courtRows = await db
    .select()
    .from(schema.courts)
    .where(
      query.indoor == null
        ? eq(schema.courts.venueId, venue.id)
        : and(
            eq(schema.courts.venueId, venue.id),
            eq(schema.courts.indoor, query.indoor)
          )
    )
    .orderBy(asc(schema.courts.sortOrder));

  if (query.courtId && !courtRows.some((c) => c.id === query.courtId)) {
    throw new AvailabilityQueryError({
      code: "UNKNOWN_COURT",
      message: `Unknown court "${query.courtId}".`,
    });
  }

  const selectedCourts = query.courtId
    ? courtRows.filter((court) => court.id === query.courtId)
    : courtRows;

  // Official AYO rows only — a missing/stale sync is reported, not guessed.
  const slotRows = await db
    .select()
    .from(schema.scheduleSlots)
    .where(
      query.courtId
        ? and(
            eq(schema.scheduleSlots.date, dateISO),
            eq(schema.scheduleSlots.source, "ayo"),
            eq(schema.scheduleSlots.courtId, query.courtId)
          )
        : and(
            eq(schema.scheduleSlots.date, dateISO),
            eq(schema.scheduleSlots.source, "ayo")
          )
    )
    .orderBy(asc(schema.scheduleSlots.courtId), asc(schema.scheduleSlots.hour));

  const latestCheck = slotRows.reduce<number | null>((latest, slot) => {
    const ts = slot.checkedAt?.getTime() ?? null;
    if (ts == null) return latest;
    return latest == null || ts > latest ? ts : latest;
  }, null);

  const maxAgeMs = AYO_MAX_AGE_MINUTES * 60_000;
  const unavailableReason: AvailabilityResponse["reason"] | null =
    slotRows.length === 0
      ? "not_synced"
      : latestCheck == null || Date.now() - latestCheck > maxAgeMs
        ? "stale"
        : null;

  if (unavailableReason) {
    const emptySummary = summarizeSlots([]);
    const response: AvailabilityResponse = {
      venue: {
        id: venue.id,
        name: venue.name,
        tagline: venue.tagline,
        courtOpenHour: venue.courtOpenHour,
        courtCloseHour: venue.courtCloseHour,
        sessionMinutes: venue.sessionMinutes,
        bookingUrl: venue.bookingUrl,
      },
      date: dateISO,
      ...(preset ? { preset } : {}),
      dayType: getDayType(dateISO),
      courts: [],
      summary: emptySummary,
      dataSource: "unavailable",
      syncedAt: latestCheck == null ? null : new Date(latestCheck).toISOString(),
      reason: unavailableReason,
    };
    return response;
  }

  const byCourt = new Map<string, typeof slotRows>();
  for (const slot of slotRows) {
    const list = byCourt.get(slot.courtId) ?? [];
    list.push(slot);
    byCourt.set(slot.courtId, list);
  }

  const dayType = getDayType(dateISO);
  const pricing = await loadPricingLookup(dateISO);

  const courts: CourtAvailabilityDto[] = selectedCourts.map((court) => {
    const slots = (byCourt.get(court.id) ?? []).map((slot) => {
      const { price, strike, peak } = pricing.get(slot.hour);
      // Real-time clock beats cached status: a slot that has already started
      // is never shown as bookable.
      const status: SlotStatus = isSlotPast(dateISO, slot.hour, now)
        ? "past"
        : (slot.status as SlotStatus);
      return {
        hour: slot.hour,
        status,
        price,
        strike,
        peak,
      };
    });
    return {
      courtId: court.id,
      name: court.name,
      indoor: court.indoor,
      availableCount: slots.filter((slot) => slot.status === "available")
        .length,
      slots,
    };
  });

  const summary = summarizeSlots(courts.flatMap((court) => court.slots));

  // Provenance: official AYO statuses only (enforced by the query above).
  const dataSource = summarizeSources(slotRows.map((slot) => slot.source));
  const syncedAt = latestCheck == null ? null : new Date(latestCheck).toISOString();

  const response: AvailabilityResponse = {
    venue: {
      id: venue.id,
      name: venue.name,
      tagline: venue.tagline,
      courtOpenHour: venue.courtOpenHour,
      courtCloseHour: venue.courtCloseHour,
      sessionMinutes: venue.sessionMinutes,
      bookingUrl: venue.bookingUrl,
    },
    date: dateISO,
    ...(preset ? { preset } : {}),
    dayType,
    courts,
    summary,
    dataSource,
    syncedAt,
  };

  // Optional bookability check for a consecutive block (search widget).
  if (query.hour != null && query.duration != null) {
    response.matches = courts.map((court) => ({
      courtId: court.courtId,
      name: court.name,
      ...calculateBlockPricing(court.slots, query.hour!, query.duration!),
    }));
  }

  return response;
}
