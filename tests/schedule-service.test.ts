import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateBlockPricing,
  createPricingLookup,
  isPeakHour,
  summarizeSlots,
} from "../src/lib/schedule-service";
import type { SlotStatus } from "../src/data/slots";

test("peak classification matches the PRD rate card", () => {
  assert.equal(isPeakHour("weekday", 17), false);
  assert.equal(isPeakHour("weekday", 18), true);
  assert.equal(isPeakHour("weekend", 6), false);
  assert.equal(isPeakHour("weekend", 7), true);
});

test("pricing lookup falls back to the built-in rate card", () => {
  const weekday = createPricingLookup([], "weekday", "2026-09-21");
  assert.deepEqual(weekday.get(6), {
    price: 150_000,
    strike: 225_000,
    peak: false,
  });
  assert.deepEqual(weekday.get(18), {
    price: 260_000,
    strike: 300_000,
    peak: true,
  });

  const weekend = createPricingLookup([], "weekend", "2026-09-26");
  assert.deepEqual(weekend.get(6), {
    price: 200_000,
    strike: 330_000,
    peak: false,
  });
  assert.deepEqual(weekend.get(12), {
    price: 250_000,
    strike: 330_000,
    peak: true,
  });
});

test("database rules override the fallback per hour", () => {
  const lookup = createPricingLookup(
    [{ hour: 6, price: 111_000, strikePrice: 222_000, isPeak: false }],
    "weekday",
    "2026-09-21"
  );
  assert.equal(lookup.get(6).price, 111_000);
  assert.equal(lookup.get(7).price, 150_000); // fallback for untouched hour
});

test("summarizeSlots counts empty, booked and past slots", () => {
  const slots = [
    { status: "available" as SlotStatus, price: 150_000 },
    { status: "booked" as SlotStatus, price: 150_000 },
    { status: "available" as SlotStatus, price: 260_000 },
    { status: "past" as SlotStatus, price: 100_000 },
  ];
  assert.deepEqual(summarizeSlots(slots), {
    totalSlots: 4,
    availableSlots: 2,
    bookedSlots: 1,
    pastSlots: 1,
    minPrice: 150_000,
  });
  assert.equal(
    summarizeSlots([{ status: "booked" as SlotStatus, price: 1 }]).minPrice,
    null
  );
});

test("calculateBlockPricing needs every hour in the block to be open", () => {
  const slots = [
    { hour: 18, status: "available" as SlotStatus, price: 260_000, strike: 300_000 },
    { hour: 19, status: "available" as SlotStatus, price: 260_000, strike: 300_000 },
    { hour: 20, status: "booked" as SlotStatus, price: 260_000, strike: 300_000 },
  ];
  assert.deepEqual(calculateBlockPricing(slots, 18, 2), {
    startHour: 18,
    duration: 2,
    available: true,
    totalPrice: 520_000,
    strikeTotal: 600_000,
  });
  assert.equal(calculateBlockPricing(slots, 19, 2).available, false);
  assert.equal(calculateBlockPricing(slots, 21, 1).available, false);
});
