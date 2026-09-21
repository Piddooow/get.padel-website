/**
 * Slot types shared by the availability API and the schedule UI.
 *
 * Availability data itself ALWAYS comes from the venue's official channel
 * (AYO real-time sync) — this module deliberately contains no generator or
 * sample data, so the UI can never show an invented schedule.
 */

export type SlotStatus = "available" | "booked" | "past";

export interface CourtSlot {
  courtId: string;
  hour: number;
  price: number;
  strike: number;
  status: SlotStatus;
}

export interface CourtAvailability {
  court: import("./courts").Court;
  slots: CourtSlot[];
  availableCount: number;
}

export interface ScheduleSummary {
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  pastSlots: number;
  minPrice: number | null;
  firstAvailableHour: number | null;
  lastAvailableHour: number | null;
}

/**
 * Provenance of the shown schedule: "ayo" when the statuses come from the
 * official real-time sync, "unavailable" when they cannot be trusted (no
 * sync yet, stale sync, or the channel is not configured).
 */
export interface AvailabilityMeta {
  dataSource: "ayo" | "unavailable";
  /** Last AYO check time (ISO), only when statuses came from AYO. */
  syncedAt: string | null;
  /** Machine-readable cause when dataSource is "unavailable". */
  reason?: "not_synced" | "stale" | "unconfigured" | "error";
}
