import assert from "node:assert/strict";
import test from "node:test";
import { isValidEmail, normalizeEmail } from "../src/lib/newsletter";

test("accepts common email shapes", () => {
  assert.equal(isValidEmail("budi@example.com"), true);
  assert.equal(isValidEmail("  budi.santoso+promo@mail.co.id  "), true);
});

test("rejects malformed emails", () => {
  assert.equal(isValidEmail(""), false);
  assert.equal(isValidEmail("budi"), false);
  assert.equal(isValidEmail("budi@example"), false);
  assert.equal(isValidEmail("budi @example.com"), false);
  assert.equal(isValidEmail("budi@example .com"), false);
});

test("normalizes for submission", () => {
  assert.equal(normalizeEmail("  Budi@Example.COM "), "budi@example.com");
});
