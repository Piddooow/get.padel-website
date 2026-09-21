import assert from "node:assert/strict";
import test from "node:test";
import { averageRating } from "../src/lib/testimonial-service";

test("averages ratings with two decimals", () => {
  assert.equal(averageRating([5, 5, 5]), 5);
  assert.equal(averageRating([5, 4, 4, 5]), 4.5);
  assert.equal(averageRating([5, 4, 4]), 4.33);
});

test("empty input has no average", () => {
  assert.equal(averageRating([]), null);
});
