import assert from "node:assert/strict";
import test from "node:test";
import {
  GuestOrderError,
  normalizePhone,
  validateGuestContact,
  validatePaymentMethod,
} from "../src/lib/guest-orders";

test("guest contact is optional for the AYO channel", () => {
  assert.deepEqual(validateGuestContact(undefined, "ayo"), {
    name: null,
    whatsapp: null,
    email: null,
  });
});

test("WhatsApp channel requires name and number", () => {
  assert.throws(
    () => validateGuestContact({ name: "Rizky" }, "whatsapp"),
    (error: unknown) =>
      error instanceof GuestOrderError && error.code === "INVALID_INPUT"
  );
  assert.throws(
    () => validateGuestContact({ whatsapp: "081188022770" }, "whatsapp"),
    GuestOrderError
  );
});

test("phone numbers are normalized and validated", () => {
  assert.equal(normalizePhone("0811 8802-2770"), "081188022770");
  assert.equal(normalizePhone("+62 811-8802-2770"), "+6281188022770");

  const valid = validateGuestContact(
    { name: " Rizky Pratama ", whatsapp: "+62 811-8802-2770" },
    "whatsapp"
  );
  assert.equal(valid.name, "Rizky Pratama");
  assert.equal(valid.whatsapp, "+6281188022770");

  assert.throws(
    () => validateGuestContact({ name: "X", whatsapp: "12345" }, "whatsapp"),
    GuestOrderError
  );
});

test("emails are validated only when provided", () => {
  assert.equal(
    validateGuestContact({ email: "" }, "ayo").email,
    null
  );
  assert.equal(
    validateGuestContact({ email: "rizky@example.com" }, "ayo").email,
    "rizky@example.com"
  );
  assert.throws(
    () => validateGuestContact({ email: "not-an-email" }, "ayo"),
    GuestOrderError
  );
});

test("payment method accepts only the supported enum", () => {
  assert.equal(validatePaymentMethod(undefined), null);
  assert.equal(validatePaymentMethod(""), null);
  assert.equal(validatePaymentMethod("qris"), "qris");
  assert.equal(validatePaymentMethod("installment"), "installment");
  assert.throws(() => validatePaymentMethod("crypto"), GuestOrderError);
});
