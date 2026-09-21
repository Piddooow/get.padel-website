import assert from "node:assert/strict";
import test from "node:test";
import {
  computeExpiresAt,
  generateHoldReference,
  HOLD_WINDOW_MINUTES,
  hoursOverlap,
  isValidHoldReference,
} from "../src/lib/slot-holds";

test("hold references use the GP- prefix without ambiguous characters", () => {
  const reference = generateHoldReference(() => 0.42);
  assert.match(reference, /^GP-[A-Z2-9]{6}$/);
  assert.equal(isValidHoldReference(reference), true);
  assert.equal(isValidHoldReference("GP-ABC"), false);
  assert.equal(isValidHoldReference("XX-ABC123"), false);
  // ambiguous glyphs never appear
  for (let i = 0; i < 200; i++) {
    const value = generateHoldReference();
    assert.equal(/[01IO]/.test(value.slice(3)), false, value);
  }
});

test("hold expiry is exactly the 10-minute window", () => {
  const start = new Date("2026-09-21T10:00:00.000Z");
  const expiry = computeExpiresAt(start);
  assert.equal(
    expiry.getTime() - start.getTime(),
    HOLD_WINDOW_MINUTES * 60_000
  );
  assert.equal(expiry.toISOString(), "2026-09-21T10:10:00.000Z");
});

test("hour blocks overlap only when they share time", () => {
  // same start
  assert.equal(hoursOverlap(18, 1, 18, 1), true);
  // 18:00–20:00 vs 19:00–20:00
  assert.equal(hoursOverlap(18, 2, 19, 1), true);
  // 18:00–19:00 vs 19:00–20:00 -> back-to-back, no overlap
  assert.equal(hoursOverlap(18, 1, 19, 1), false);
  // 18:00–19:00 vs 21:00–22:00
  assert.equal(hoursOverlap(18, 1, 21, 1), false);
  // 19:00–21:00 vs 18:00–20:00
  assert.equal(hoursOverlap(19, 2, 18, 2), true);
});
