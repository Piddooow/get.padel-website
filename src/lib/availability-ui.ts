/**
 * Bridges the server availability layer (official AYO sync + rate card) into
 * the display shapes used by the schedule UI.
 *
 * Server-only. There is no fabricated fallback: when the AYO sync is missing
 * or stale the loader returns an empty schedule plus an `unavailable` meta,
 * and the UI points visitors at the official booking channel.
 */
import { courts as courtCatalog, type Court } from "@/data/courts";
import {
  type AvailabilityMeta,
  type CourtAvailability,
} from "@/data/slots";
import type { AvailabilityResponse } from "@/lib/availability";
import { getSlotAvailability } from "@/lib/availability";

function resolveCourt(courtId: string, name: string, indoor: boolean): Court {
  return (
    courtCatalog.find((court) => court.id === courtId) ?? {
      id: courtId,
      name,
      indoor,
      surface: "Certified Premium Turf",
      sessionMinutes: 60,
      description: "",
      image: "",
    }
  );
}

/** Maps an API availability response into the UI's court/slot shape. */
export function toCourtAvailability(
  response: AvailabilityResponse
): CourtAvailability[] {
  return response.courts.map((court) => ({
    court: resolveCourt(court.courtId, court.name, court.indoor),
    slots: court.slots.map((slot) => ({
      courtId: court.courtId,
      hour: slot.hour,
      price: slot.price,
      strike: slot.strike,
      status: slot.status,
    })),
    availableCount: court.availableCount,
  }));
}

export function toAvailabilityMeta(
  response: AvailabilityResponse
): AvailabilityMeta {
  return {
    dataSource: response.dataSource === "ayo" ? "ayo" : "unavailable",
    syncedAt: response.syncedAt,
    ...(response.reason ? { reason: response.reason } : {}),
  };
}

export interface UiAvailability {
  availability: CourtAvailability[];
  meta: AvailabilityMeta;
}

/**
 * Server loader for one date — official AYO data only. A failure or an empty
 * sync surfaces as `dataSource: "unavailable"` with no courts.
 */
export async function loadUiAvailability(
  dateISO: string
): Promise<UiAvailability> {
  try {
    const response = await getSlotAvailability(dateISO);
    return {
      availability: toCourtAvailability(response),
      meta: toAvailabilityMeta(response),
    };
  } catch {
    return {
      availability: [],
      meta: { dataSource: "unavailable", syncedAt: null, reason: "error" },
    };
  }
}
