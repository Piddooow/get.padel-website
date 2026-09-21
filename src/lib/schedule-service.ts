/**
 * Schedule service — pure calculators for empty-slot counts and pricing,
 * plus DB-backed loaders for the peak/off-peak rate card.
 *
 * Pure functions take their data as arguments so they can be unit-tested
 * without a database; DB-backed helpers wrap them for production use.
 */
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  FIRST_HOUR,
  LAST_HOUR,
  getDayType,
  getSlotPrice,
} from "@/data/pricing";
import type { SlotStatus } from "@/data/slots";

export interface PricedHour {
  price: number;
  strike: number;
  peak: boolean;
}

export interface PricingLookup {
  get(hour: number): PricedHour;
}

export interface RateCardRow extends PricedHour {
  hour: number;
}

export interface SlotSummary {
  totalSlots: number;
  availableSlots: number;
  bookedSlots: number;
  pastSlots: number;
  minPrice: number | null;
}

export interface BlockPricing {
  startHour: number;
  duration: number;
  available: boolean;
  totalPrice: number;
  strikeTotal: number;
}

/** Peak classification used across the app (PRD §8.4 price tiers). */
export function isPeakHour(dayType: "weekday" | "weekend", hour: number): boolean {
  return dayType === "weekend" ? hour >= 7 : hour >= 18;
}

/**
 * Builds a pricing lookup from rate-card rows; hours missing from the rows
 * fall back to the built-in pricing module (same data as the seed).
 */
export function createPricingLookup(
  rules: { hour: number; price: number; strikePrice: number; isPeak: boolean }[],
  dayType: "weekday" | "weekend",
  dateISO: string
): PricingLookup {
  const map = new Map<number, PricedHour>(
    rules.map((rule) => [
      rule.hour,
      { price: rule.price, strike: rule.strikePrice, peak: rule.isPeak },
    ])
  );

  return {
    get(hour: number): PricedHour {
      const rule = map.get(hour);
      if (rule) return rule;
      const { price, strike } = getSlotPrice(dateISO, hour);
      return { price, strike, peak: isPeakHour(dayType, hour) };
    },
  };
}

/** Loads the rate card for a day type from `pricing_rules`. */
export async function loadPricingLookup(
  dateISO: string
): Promise<PricingLookup> {
  const dayType = getDayType(dateISO);
  const rules = await db
    .select()
    .from(schema.pricingRules)
    .where(eq(schema.pricingRules.dayType, dayType));
  return createPricingLookup(rules, dayType, dateISO);
}

/** Full hourly rate card (16 rows) for a day type — for API consumers. */
export async function getRateCard(
  dayType: "weekday" | "weekend"
): Promise<RateCardRow[]> {
  const sampleISO = dayType === "weekday" ? "2026-09-21" : "2026-09-26";
  const lookup = await loadPricingLookup(sampleISO);
  const rows: RateCardRow[] = [];
  for (let hour = FIRST_HOUR; hour <= LAST_HOUR; hour++) {
    rows.push({ hour, ...lookup.get(hour) });
  }
  return rows;
}

/** Counts empty/past slots and finds the cheapest open price. */
export function summarizeSlots(
  slots: { status: SlotStatus; price: number }[]
): SlotSummary {
  const open = slots.filter((slot) => slot.status === "available");
  return {
    totalSlots: slots.length,
    availableSlots: open.length,
    bookedSlots: slots.filter((slot) => slot.status === "booked").length,
    pastSlots: slots.filter((slot) => slot.status === "past").length,
    minPrice: open.length ? Math.min(...open.map((slot) => slot.price)) : null,
  };
}

/**
 * Prices a consecutive block of hours and reports whether every hour in the
 * block is still bookable.
 */
export function calculateBlockPricing(
  slots: { hour: number; status: SlotStatus; price: number; strike: number }[],
  startHour: number,
  duration: number
): BlockPricing {
  const block = slots.filter(
    (slot) => slot.hour >= startHour && slot.hour < startHour + duration
  );
  return {
    startHour,
    duration,
    available:
      block.length === duration &&
      block.every((slot) => slot.status === "available"),
    totalPrice: block.reduce((sum, slot) => sum + slot.price, 0),
    strikeTotal: block.reduce((sum, slot) => sum + slot.strike, 0),
  };
}
