/**
 * Venue-time helpers (Asia/Jakarta). Every availability decision — which day
 * is "today", which hours have already passed, when a slot hold expires — is
 * derived from the real system clock in the venue's timezone, never from
 * seeded or cached values.
 */

export const VENUE_TIME_ZONE = "Asia/Jakarta";

interface JakartaParts {
  /** YYYY-MM-DD in Asia/Jakarta. */
  dateISO: string;
  hour: number;
  minute: number;
  second: number;
}

const PARTS_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: VENUE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

/** Current wall-clock time at the venue (Asia/Jakarta). */
export function jakartaNow(base: Date = new Date()): JakartaParts {
  const parts = Object.fromEntries(
    PARTS_FORMATTER.formatToParts(base)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
  return {
    dateISO: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

/**
 * Whether an hourly slot has already started at the venue. A session that
 * starts in the current hour is treated as gone — bookings must be made
 * before the slot begins.
 */
export function isSlotPast(
  dateISO: string,
  hour: number,
  now: JakartaParts = jakartaNow()
): boolean {
  if (dateISO < now.dateISO) return true;
  if (dateISO > now.dateISO) return false;
  return hour <= now.hour;
}
