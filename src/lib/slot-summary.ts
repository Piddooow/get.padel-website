/**
 * Pure helpers for summarising a court's slot list. Client-safe (no database
 * imports) so both server and client components can use them.
 */
import type { CourtAvailability, ScheduleSummary } from "@/data/slots";

export type { ScheduleSummary } from "@/data/slots";

/** Aggregates court slots into the headline numbers shown above the grid. */
export function summarizeAvailability(
  availability: CourtAvailability[]
): ScheduleSummary {
  const slots = availability.flatMap((item) => item.slots);
  const prices = slots
    .filter((slot) => slot.status === "available")
    .map((slot) => slot.price);

  return {
    totalSlots: slots.length,
    availableSlots: slots.filter((slot) => slot.status === "available").length,
    bookedSlots: slots.filter((slot) => slot.status === "booked").length,
    pastSlots: slots.filter((slot) => slot.status === "past").length,
    minPrice: prices.length > 0 ? Math.min(...prices) : null,
    firstAvailableHour:
      slots.find((slot) => slot.status === "available")?.hour ?? null,
    lastAvailableHour:
      [...slots].reverse().find((slot) => slot.status === "available")?.hour ??
      null,
  };
}
