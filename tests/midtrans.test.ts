import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mapMidtransStatus,
  verifyMidtransSignature,
} from "../src/lib/midtrans";

describe("midtrans signature", () => {
  it("accepts the sha512 signature Midtrans sends", () => {
    process.env.MIDTRANS_SERVER_KEY = "SB-Mid-server-TESTKEY";
    const orderId = "GP-20260921-ABC123";
    const statusCode = "200";
    const grossAmount = "150000.00";
    const signature = createHash("sha512")
      .update(`${orderId}${statusCode}${grossAmount}SB-Mid-server-TESTKEY`)
      .digest("hex");

    assert.equal(
      verifyMidtransSignature({ orderId, statusCode, grossAmount, signatureKey: signature }),
      true
    );
    assert.equal(
      verifyMidtransSignature({
        orderId,
        statusCode,
        grossAmount,
        signatureKey: signature.toUpperCase(),
      }),
      true
    );
  });

  it("rejects tampered payloads", () => {
    process.env.MIDTRANS_SERVER_KEY = "SB-Mid-server-TESTKEY";
    assert.equal(
      verifyMidtransSignature({
        orderId: "GP-1",
        statusCode: "200",
        grossAmount: "150000.00",
        signatureKey: "deadbeef",
      }),
      false
    );
    const signature = createHash("sha512")
      .update("GP-1" + "200" + "150000.00" + "SB-Mid-server-TESTKEY")
      .digest("hex");
    assert.equal(
      verifyMidtransSignature({
        orderId: "GP-1",
        statusCode: "200",
        grossAmount: "999999.00",
        signatureKey: signature,
      }),
      false
    );
  });
});

describe("midtrans status mapping", () => {
  it("locks the slot once payment settles or captures", () => {
    for (const status of ["settlement", "capture"]) {
      const mapped = mapMidtransStatus(status);
      assert.equal(mapped?.bookingStatus, "paid");
      assert.equal(mapped?.locksSlot, true);
    }
  });

  it("keeps the slot held while a payment is pending", () => {
    const mapped = mapMidtransStatus("pending");
    assert.equal(mapped?.bookingStatus, "pending_payment");
    assert.equal(mapped?.locksSlot, true);
  });

  it("releases the slot on deny, cancel, expire and failure", () => {
    for (const status of ["deny", "cancel", "expire", "failure"]) {
      const mapped = mapMidtransStatus(status);
      assert.equal(mapped?.locksSlot, false);
      assert.notEqual(mapped?.bookingStatus, "paid");
    }
  });

  it("keeps a refunded booking recorded as paid", () => {
    const mapped = mapMidtransStatus("refund");
    assert.equal(mapped?.bookingStatus, "paid");
    assert.equal(mapped?.paymentStatus, "refund");
  });

  it("ignores unknown statuses", () => {
    assert.equal(mapMidtransStatus("something_new"), null);
  });
});
