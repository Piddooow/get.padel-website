/**
 * AYO.co.id availability sync adapter.
 *
 * The landing page shows slot availability served from `schedule_slots`.
 * This module pulls the LATEST statuses from AYO so visitors see real-time
 * availability, and falls back gracefully to the local data when the AYO
 * integration is not configured or unreachable.
 *
 * Configuration (server env):
 * - `AYO_AVAILABILITY_API_URL` — AYO availability endpoint. The sync calls
 *   `${url}?date=YYYY-MM-DD` and expects JSON:
 *     { "date": "YYYY-MM-DD",
 *       "courts": [ { "courtId": "court-1" | "Court 1",
 *                     "slots": [ { "hour": 18 | "18:00", "status": "available" | "booked" } ] } ] }
 *   (Extra fields are ignored; courts/slots may also come as `data`/array.)
 * - `AYO_AVAILABILITY_API_TOKEN` — optional bearer token.
 *
 * No payment data is involved — only per-hour availability statuses.
 */
import { db, schema } from "@/db";
import { courts } from "@/data/courts";

export type AyoSyncStatus = "available" | "booked";

export interface NormalizedSlot {
  courtId: string;
  hour: number;
  status: AyoSyncStatus;
}

export interface NormalizeResult {
  slots: NormalizedSlot[];
  warnings: string[];
}

export type DataSource = "ayo" | "unavailable";

/**
 * Aggregates per-slot sources into the response-level data source. Anything
 * that is not official AYO data makes the whole day untrustworthy — we never
 * mix in locally invented statuses.
 */
export function summarizeSources(sources: string[]): DataSource {
  if (sources.length === 0) return "unavailable";
  return sources.every((source) => source === "ayo") ? "ayo" : "unavailable";
}

const STATUS_SYNONYMS: Record<string, AyoSyncStatus> = {
  available: "available",
  open: "available",
  free: "available",
  tersedia: "available",
  booked: "booked",
  closed: "booked",
  full: "booked",
  terisi: "booked",
};

function parseHour(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string") {
    const match = value.match(/^(\d{1,2})[:.]/);
    if (match) return Number(match[1]);
    const plain = Number(value);
    if (Number.isInteger(plain)) return plain;
  }
  return null;
}

function parseStatus(value: unknown): AyoSyncStatus | null {
  if (typeof value !== "string") return null;
  return STATUS_SYNONYMS[value.trim().toLowerCase()] ?? null;
}

function matchCourt(
  ref: { courtId?: unknown; courtName?: unknown },
  known: { id: string; name: string }[]
): string | null {
  const id = typeof ref.courtId === "string" ? ref.courtId : undefined;
  const name = typeof ref.courtName === "string" ? ref.courtName : undefined;
  const byId = id ? known.find((court) => court.id === id) : undefined;
  if (byId) return byId.id;
  if (name) {
    const needle = name.trim().toLowerCase();
    const byName = known.find(
      (court) => court.name.toLowerCase() === needle
    );
    if (byName) return byName.id;
  }
  return null;
}

/** Normalizes an AYO payload into court/hour/status rows (pure). */
export function normalizeAyoPayload(
  payload: unknown,
  knownCourts: { id: string; name: string }[] = courts.map((court) => ({
    id: court.id,
    name: court.name,
  }))
): NormalizeResult {
  const warnings: string[] = [];
  const slots: NormalizedSlot[] = [];

  const root =
    typeof payload === "object" && payload !== null
      ? (payload as Record<string, unknown>)
      : null;
  const rawCourts = root?.courts ?? root?.data ?? payload;
  const courtList = Array.isArray(rawCourts)
    ? rawCourts
    : typeof rawCourts === "object" && rawCourts !== null
      ? Object.entries(rawCourts).map(([key, value]) => ({
          courtId: key,
          ...(typeof value === "object" && value !== null ? value : {}),
        }))
      : [];

  for (const rawCourt of courtList) {
    if (typeof rawCourt !== "object" || rawCourt === null) continue;
    const courtRecord = rawCourt as Record<string, unknown>;
    const courtId = matchCourt(courtRecord, knownCourts);
    if (!courtId) {
      warnings.push(
        `Unknown court "${String(courtRecord.courtId ?? courtRecord.courtName ?? "?")}" — skipped.`
      );
      continue;
    }

    const rawSlots = Array.isArray(courtRecord.slots)
      ? courtRecord.slots
      : typeof courtRecord.slots === "object" && courtRecord.slots !== null
        ? Object.entries(courtRecord.slots).map(([hour, status]) => ({
            hour,
            status,
          }))
        : [];

    for (const rawSlot of rawSlots) {
      if (typeof rawSlot !== "object" || rawSlot === null) continue;
      const slotRecord = rawSlot as Record<string, unknown>;
      const hour = parseHour(
        slotRecord.hour ?? slotRecord.startHour ?? slotRecord.startTime
      );
      const status = parseStatus(slotRecord.status ?? slotRecord.state);
      if (hour == null || status == null) {
        warnings.push(`Skipped malformed slot on ${courtId}.`);
        continue;
      }
      slots.push({ courtId, hour, status });
    }
  }

  return { slots, warnings };
}

export interface SyncResult {
  date: string;
  requested: boolean;
  skipped?: string;
  updated: number;
  source: DataSource;
  syncedAt: string | null;
  warnings: string[];
}

/**
 * Pulls availability for one date from AYO and upserts it into
 * `schedule_slots` (source = "ayo"). Never throws and never fabricates data:
 * when the official channel is unavailable the result is simply
 * `source: "unavailable"` with nothing written to the database.
 */
export async function syncAvailabilityFromAyo(
  dateISO: string,
  now: Date = new Date()
): Promise<SyncResult> {
  const url = process.env.AYO_AVAILABILITY_API_URL;
  if (!url) {
    return {
      date: dateISO,
      requested: false,
      skipped: "AYO_AVAILABILITY_API_URL is not configured.",
      updated: 0,
      source: "unavailable",
      syncedAt: null,
      warnings: [],
    };
  }

  let payload: unknown;
  try {
    const endpoint = `${url}${url.includes("?") ? "&" : "?"}date=${dateISO}`;
    const response = await fetch(endpoint, {
      headers: process.env.AYO_AVAILABILITY_API_TOKEN
        ? {
            Authorization: `Bearer ${process.env.AYO_AVAILABILITY_API_TOKEN}`,
          }
        : undefined,
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
    if (!response.ok) {
      return {
        date: dateISO,
        requested: true,
        skipped: `AYO responded ${response.status}.`,
        updated: 0,
        source: "unavailable",
        syncedAt: null,
        warnings: [],
      };
    }
    payload = await response.json();
  } catch (error) {
    return {
      date: dateISO,
      requested: true,
      skipped:
        error instanceof Error ? error.message : "AYO request failed.",
      updated: 0,
      source: "unavailable",
      syncedAt: null,
      warnings: [],
    };
  }

  const { slots, warnings } = normalizeAyoPayload(payload);
  if (slots.length === 0) {
    return {
      date: dateISO,
      requested: true,
      skipped: "AYO returned no usable slots.",
      updated: 0,
      source: "unavailable",
      syncedAt: null,
      warnings,
    };
  }

  let updated = 0;
  for (const slot of slots) {
    const id = `${slot.courtId}:${dateISO}:${slot.hour}`;
    try {
      await db
        .insert(schema.scheduleSlots)
        .values({
          id,
          courtId: slot.courtId,
          date: dateISO,
          hour: slot.hour,
          status: slot.status,
          source: "ayo",
          checkedAt: now,
        })
        .onConflictDoUpdate({
          target: schema.scheduleSlots.id,
          set: {
            status: slot.status,
            source: "ayo",
            checkedAt: now,
          },
        });
      updated += 1;
    } catch {
      // ignore individual row failures — availability keeps working
    }
  }

  return {
    date: dateISO,
    requested: true,
    updated,
    source: "ayo",
    syncedAt: now.toISOString(),
    warnings,
  };
}
