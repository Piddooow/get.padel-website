import assert from "node:assert/strict";
import test from "node:test";
import { validateNewsletterInput } from "../src/lib/newsletter-service";

test("accepts a valid payload and normalizes the email", () => {
  const result = validateNewsletterInput({
    email: "  Budi@Example.COM ",
    locale: "en",
    source: "proof-section",
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.data, {
      email: "budi@example.com",
      locale: "en",
      source: "proof-section",
    });
  }
});

test("rejects invalid emails and unknown locales", () => {
  assert.equal(validateNewsletterInput(null).ok, false);
  assert.equal(validateNewsletterInput({}).ok, false);
  assert.equal(validateNewsletterInput({ email: "nope" }).ok, false);
  assert.equal(
    validateNewsletterInput({ email: "a@b.com", locale: "de" }).ok,
    false
  );
});

test("optional fields default to null and source is truncated", () => {
  const result = validateNewsletterInput({
    email: "a@b.com",
    source: "x".repeat(120),
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.locale, null);
    assert.equal(result.data.source?.length, 60);
  }
});
