import assert from "node:assert/strict";
import test from "node:test";
import { deriveSpotsStatus } from "../src/lib/open-match-service";

test("open state when spots remain", () => {
  assert.equal(deriveSpotsStatus(5, 8), "open");
  assert.equal(deriveSpotsStatus(3, 8), "open");
});

test("almost full when two or fewer spots remain", () => {
  assert.equal(deriveSpotsStatus(2, 8), "almost_full");
  assert.equal(deriveSpotsStatus(1, 8), "almost_full");
});

test("full when no spots remain", () => {
  assert.equal(deriveSpotsStatus(0, 8), "full");
});

test("small sessions scale the almost-full threshold", () => {
  // 4-spot sessions: 2 left = half full → almost full
  assert.equal(deriveSpotsStatus(2, 4), "almost_full");
  // ...but 3 left is still open
  assert.equal(deriveSpotsStatus(3, 4), "open");
});
