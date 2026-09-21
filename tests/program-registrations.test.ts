import assert from "node:assert/strict";
import test from "node:test";
import {
  generateRegistrationReference,
  isValidRegistrationReference,
  normalizeWhatsapp,
  validateRegistration,
} from "../src/lib/program-registrations";

test("registration references use the REG- prefix without ambiguous glyphs", () => {
  const reference = generateRegistrationReference(() => 0.42);
  assert.match(reference, /^REG-[A-Z2-9]{6}$/);
  assert.equal(isValidRegistrationReference(reference), true);
  assert.equal(isValidRegistrationReference("REG-ABC"), false);
  assert.equal(isValidRegistrationReference("GP-ABC123"), false);
  for (let i = 0; i < 200; i++) {
    assert.equal(/[01IO]/.test(generateRegistrationReference().slice(4)), false);
  }
});

test("normalizeWhatsapp converts local numbers to 62-prefixed digits", () => {
  assert.equal(normalizeWhatsapp("0811 8802 2770"), "6281188022770");
  assert.equal(normalizeWhatsapp("+62 811-8802-2770"), "6281188022770");
  assert.equal(normalizeWhatsapp("6281188022770"), "6281188022770");
  assert.equal(normalizeWhatsapp("12345"), null);
  assert.equal(normalizeWhatsapp("81188022770"), null);
});

test("validateRegistration accepts a complete payload", () => {
  const result = validateRegistration({
    name: "Budi Santoso",
    whatsapp: "081188022770",
    email: "budi@example.com",
    preferredSchedule: "Sabtu pagi",
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.data, {
      name: "Budi Santoso",
      whatsapp: "6281188022770",
      email: "budi@example.com",
      preferredSchedule: "Sabtu pagi",
      notes: null,
    });
  }
});

test("validateRegistration rejects missing and malformed fields", () => {
  assert.equal(validateRegistration(null).ok, false);
  assert.equal(validateRegistration({}).ok, false);
  const bad = validateRegistration({
    name: "B",
    whatsapp: "not-a-number",
    email: "nope",
  });
  assert.equal(bad.ok, false);
  if (!bad.ok) {
    assert.equal(bad.errors.length, 3);
  }
});

test("optional fields default to null", () => {
  const result = validateRegistration({
    name: "Ani",
    whatsapp: "081188022770",
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.email, null);
    assert.equal(result.data.preferredSchedule, null);
    assert.equal(result.data.notes, null);
  }
});
