/**
 * Pricing — mirrors the `pricing_rules` table (PRD §6, §8.4).
 * Prices are per 60-minute session and already include 2 boxes of
 * 240 ml mineral water (PRD §8.4 notes).
 */

export type DayType = "weekday" | "weekend";

export interface SlotPrice {
  price: number;
  strike: number;
}

/** 06.00–22.00 → 16 hourly slots. */
export const FIRST_HOUR = 6;
export const LAST_HOUR = 21;

const WEEKDAY: Record<number, SlotPrice> = {
  6: { price: 150_000, strike: 225_000 },
  7: { price: 150_000, strike: 225_000 },
  8: { price: 180_000, strike: 225_000 },
  9: { price: 180_000, strike: 225_000 },
  10: { price: 180_000, strike: 225_000 },
  11: { price: 150_000, strike: 225_000 },
  12: { price: 150_000, strike: 225_000 },
  13: { price: 150_000, strike: 225_000 },
  14: { price: 180_000, strike: 225_000 },
  15: { price: 180_000, strike: 225_000 },
  16: { price: 180_000, strike: 225_000 },
  17: { price: 180_000, strike: 225_000 },
  18: { price: 260_000, strike: 300_000 },
  19: { price: 260_000, strike: 300_000 },
  20: { price: 260_000, strike: 300_000 },
  21: { price: 260_000, strike: 300_000 },
};

const WEEKEND: Record<number, SlotPrice> = {
  6: { price: 200_000, strike: 330_000 },
  7: { price: 260_000, strike: 300_000 },
  8: { price: 260_000, strike: 300_000 },
  9: { price: 260_000, strike: 300_000 },
  10: { price: 260_000, strike: 300_000 },
  11: { price: 260_000, strike: 300_000 },
  12: { price: 250_000, strike: 330_000 },
  13: { price: 250_000, strike: 330_000 },
  14: { price: 250_000, strike: 330_000 },
  15: { price: 260_000, strike: 300_000 },
  16: { price: 260_000, strike: 300_000 },
  17: { price: 260_000, strike: 300_000 },
  18: { price: 260_000, strike: 300_000 },
  19: { price: 260_000, strike: 300_000 },
  20: { price: 260_000, strike: 300_000 },
  21: { price: 260_000, strike: 300_000 },
};

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Saturday = 6, Sunday = 0. */
export function getDayType(dateISO: string): DayType {
  const weekday = new Date(`${dateISO}T00:00:00`).getDay();
  return weekday === 0 || weekday === 6 ? "weekend" : "weekday";
}

export function getSlotPrice(dateISO: string, hour: number): SlotPrice {
  const table = getDayType(dateISO) === "weekend" ? WEEKEND : WEEKDAY;
  return table[hour] ?? { price: 0, strike: 0 };
}

/** Next Saturday (or today when it already is the weekend). */
export function nextWeekendISO(from: Date = new Date()): string {
  const day = from.getDay();
  if (day === 6 || day === 0) return toISODate(from);
  return toISODate(addDays(from, 6 - day));
}
