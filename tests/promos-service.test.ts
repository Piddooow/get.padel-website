import assert from "node:assert/strict";
import test from "node:test";
import { isPromoActive } from "../src/lib/promos-service";

test("promos without a validity window are always active", () => {
  assert.equal(
    isPromoActive({ isActive: true, startsOn: null, endsOn: null }, "2026-09-21"),
    true
  );
});

test("validity windows are inclusive on both boundaries", () => {
  const promo = {
    isActive: true,
    startsOn: "2026-09-01",
    endsOn: "2026-09-30",
  };
  assert.equal(isPromoActive(promo, "2026-08-31"), false);
  assert.equal(isPromoActive(promo, "2026-09-01"), true);
  assert.equal(isPromoActive(promo, "2026-09-21"), true);
  assert.equal(isPromoActive(promo, "2026-09-30"), true);
  assert.equal(isPromoActive(promo, "2026-10-01"), false);
});

test("archived promos are inactive regardless of dates", () => {
  assert.equal(
    isPromoActive(
      { isActive: false, startsOn: null, endsOn: null },
      "2026-09-21"
    ),
    false
  );
  assert.equal(
    isPromoActive(
      { isActive: false, startsOn: "2020-01-01", endsOn: "2030-01-01" },
      "2026-09-21"
    ),
    false
  );
});

test("one-sided windows work in both directions", () => {
  assert.equal(
    isPromoActive(
      { isActive: true, startsOn: "2026-09-09", endsOn: null },
      "2026-09-21"
    ),
    true
  );
  assert.equal(
    isPromoActive(
      { isActive: true, startsOn: "2026-09-09", endsOn: null },
      "2026-09-08"
    ),
    false
  );
  assert.equal(
    isPromoActive(
      { isActive: true, startsOn: null, endsOn: "2026-03-20" },
      "2026-09-21"
    ),
    false
  );
});
