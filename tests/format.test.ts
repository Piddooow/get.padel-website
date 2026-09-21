import assert from "node:assert/strict";
import test from "node:test";
import { isSpecialPrice, SPECIAL_PRICE_MIN_DISCOUNT } from "../src/lib/format";

test("special-price rule matches the campaign rate card", () => {
  assert.equal(SPECIAL_PRICE_MIN_DISCOUNT, 30);
  // Weekday 06.00–08.00 / 11.00–14.00 promo (150k from 225k = 33%).
  assert.equal(isSpecialPrice(150_000, 225_000), true);
  // Weekend 06.00 (200k from 330k = 39%).
  assert.equal(isSpecialPrice(200_000, 330_000), true);
  // Standard discounts stay regular.
  assert.equal(isSpecialPrice(180_000, 225_000), false);
  assert.equal(isSpecialPrice(260_000, 300_000), false);
  assert.equal(isSpecialPrice(250_000, 330_000), false);
  // No strike price → never special.
  assert.equal(isSpecialPrice(260_000, 260_000), false);
  assert.equal(isSpecialPrice(260_000, 0), false);
});
