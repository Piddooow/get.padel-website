/**
 * Booking guarantees: input guards, expired-hold release and the database-level
 * promise that one court/date/hour can never have two live bookings.
 *
 * Uses the local dev database with explicit cleanup (test rows are created and
 * removed again; the venue's real data is never touched).
 */
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { db, schema } from "../src/db";
import {
  applyPaymentNotification,
  createBooking,
  expireStaleBookings,
} from "../src/lib/bookings";
import { isSlotPast } from "../src/lib/time";

const TEST_DATE = "2027-01-05"; // far future weekday, never real data
const TEST_COURT = "court-1";
const TEST_HOUR = 9;
const userId = `test-user-${randomBytes(4).toString("hex")}`;
const createdBookingIds: string[] = [];

async function insertBooking(options: {
  status: "pending_payment" | "paid" | "expired";
  startHour: number;
  expiresAt?: Date;
}) {
  const id = randomBytes(12).toString("hex");
  createdBookingIds.push(id);
  await db.insert(schema.bookings).values({
    id,
    reference: `GP-TEST-${randomBytes(3).toString("hex").toUpperCase()}`,
    userId,
    venueId: "get-padel-jakarta",
    courtId: TEST_COURT,
    date: TEST_DATE,
    startHour: options.startHour,
    durationHours: 1,
    amountIdr: 150_000,
    status: options.status,
    paymentStatus: options.status === "paid" ? "settlement" : "pending",
    provider: "midtrans",
    providerOrderId: `test-order-${randomBytes(4).toString("hex")}`,
    expiresAt: options.expiresAt ?? new Date(Date.now() + 15 * 60_000),
  });
  return id;
}

before(async () => {
  await db.insert(schema.users).values({
    id: userId,
    email: `${userId}@example.test`,
    name: "Booking Test",
    passwordHash: "scrypt:test:test",
  });
});

after(async () => {
  // Cascade removes the bookings created by this suite.
  await db.delete(schema.users).where(eq(schema.users.id, userId));
  const leftovers = await db
    .select({ id: schema.bookings.id })
    .from(schema.bookings)
    .where(
      and(
        eq(schema.bookings.courtId, TEST_COURT),
        eq(schema.bookings.date, TEST_DATE)
      )
    );
  const ids = leftovers
    .map((row) => row.id)
    .filter((id) => createdBookingIds.includes(id));
  if (ids.length > 0) {
    await db.delete(schema.bookings).where(inArray(schema.bookings.id, ids));
  }
});

describe("slot clock", () => {
  it("treats started hours as past and future hours as bookable", () => {
    const now = { dateISO: "2027-01-05", hour: 12, minute: 30, second: 0 };
    assert.equal(isSlotPast("2027-01-05", 11, now), true);
    // The current hour counts as started — never bookable mid-session.
    assert.equal(isSlotPast("2027-01-05", 12, now), true);
    assert.equal(isSlotPast("2027-01-05", 13, now), false);
    assert.equal(isSlotPast("2027-01-04", 23, now), true);
    assert.equal(isSlotPast("2027-01-06", 6, now), false);
  });
});

describe("createBooking guards", () => {
  it("rejects a start time that already passed", async () => {
    const result = await createBooking({
      userId,
      courtId: TEST_COURT,
      date: "2020-01-01",
      startHour: TEST_HOUR,
      durationHours: 1,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "PAST");
  });

  it("rejects sessions outside opening hours", async () => {
    const result = await createBooking({
      userId,
      courtId: TEST_COURT,
      date: TEST_DATE,
      startHour: 21,
      durationHours: 2,
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "OUT_OF_HOURS");
  });

  it("refuses to book while online payment is not configured", async () => {
    const previous = process.env.MIDTRANS_SERVER_KEY;
    delete process.env.MIDTRANS_SERVER_KEY;
    const result = await createBooking({
      userId,
      courtId: TEST_COURT,
      date: TEST_DATE,
      startHour: TEST_HOUR,
      durationHours: 1,
    });
    if (previous) process.env.MIDTRANS_SERVER_KEY = previous;
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, "PAYMENT_UNCONFIGURED");
  });
});

describe("double-booking protection", () => {
  it("the database refuses a second live booking for the same slot", async () => {
    await insertBooking({ status: "pending_payment", startHour: TEST_HOUR });
    await assert.rejects(() =>
      insertBooking({ status: "pending_payment", startHour: TEST_HOUR })
    );
  });

  it("a paid slot stays locked against other bookings", async () => {
    await insertBooking({ status: "paid", startHour: TEST_HOUR + 1 });
    await assert.rejects(() =>
      insertBooking({ status: "pending_payment", startHour: TEST_HOUR + 1 })
    );
  });

  it("expired holds release the slot for the next visitor", async () => {
    await insertBooking({
      status: "pending_payment",
      startHour: TEST_HOUR + 2,
      expiresAt: new Date(Date.now() - 60_000),
    });
    await expireStaleBookings();
    const [row] = await db
      .select({ status: schema.bookings.status })
      .from(schema.bookings)
      .where(
        and(
          eq(schema.bookings.courtId, TEST_COURT),
          eq(schema.bookings.date, TEST_DATE),
          eq(schema.bookings.startHour, TEST_HOUR + 2),
          eq(schema.bookings.userId, userId)
        )
      );
    assert.equal(row?.status, "expired");
    // The slot is claimable again.
    await insertBooking({ status: "pending_payment", startHour: TEST_HOUR + 2 });
  });
});

describe("payment notifications", () => {
  it("settlement marks the booking paid and keeps the slot locked", async () => {
    const id = await insertBooking({ status: "pending_payment", startHour: TEST_HOUR + 3 });
    const [row] = await db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.id, id));

    const result = await applyPaymentNotification({
      orderId: row.providerOrderId,
      transactionStatus: "settlement",
      fraudStatus: "accept",
      grossAmount: String(row.amountIdr),
      statusCode: "200",
      transactionId: "txn-test-1",
      raw: { transaction_status: "settlement" },
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.applied, true);
      assert.equal(result.status, "paid");
    }

    const [updated] = await db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.id, id));
    assert.equal(updated.status, "paid");
    assert.equal(updated.paymentStatus, "settlement");
    assert.ok(updated.paidAt);

    // The paid slot stays locked for everyone else.
    await assert.rejects(() =>
      insertBooking({ status: "pending_payment", startHour: TEST_HOUR + 3 })
    );
  });

  it("is idempotent and never downgrades a paid booking", async () => {
    const id = await insertBooking({ status: "pending_payment", startHour: TEST_HOUR + 4 });
    const [row] = await db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.id, id));

    await applyPaymentNotification({
      orderId: row.providerOrderId,
      transactionStatus: "settlement",
      fraudStatus: "accept",
      grossAmount: String(row.amountIdr),
      statusCode: "200",
      transactionId: "txn-test-2",
      raw: {},
    });
    const duplicate = await applyPaymentNotification({
      orderId: row.providerOrderId,
      transactionStatus: "settlement",
      fraudStatus: "accept",
      grossAmount: String(row.amountIdr),
      statusCode: "200",
      transactionId: "txn-test-2",
      raw: {},
    });
    assert.equal(duplicate.ok, true);
    if (duplicate.ok) assert.equal(duplicate.applied, false);

    // An out-of-order "pending" retry must not un-pay the booking.
    await applyPaymentNotification({
      orderId: row.providerOrderId,
      transactionStatus: "pending",
      fraudStatus: null,
      grossAmount: String(row.amountIdr),
      statusCode: "201",
      transactionId: "txn-test-2",
      raw: {},
    });
    const [updated] = await db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.id, id));
    assert.equal(updated.status, "paid");
  });

  it("rejects unknown orders and tampered amounts", async () => {
    const unknown = await applyPaymentNotification({
      orderId: "GP-does-not-exist",
      transactionStatus: "settlement",
      fraudStatus: null,
      grossAmount: "150000.00",
      statusCode: "200",
      transactionId: null,
      raw: {},
    });
    assert.equal(unknown.ok, false);
    if (!unknown.ok) assert.equal(unknown.reason, "unknown_order");

    const id = await insertBooking({ status: "pending_payment", startHour: TEST_HOUR + 5 });
    const [row] = await db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.id, id));
    const tampered = await applyPaymentNotification({
      orderId: row.providerOrderId,
      transactionStatus: "settlement",
      fraudStatus: null,
      grossAmount: "1.00",
      statusCode: "200",
      transactionId: null,
      raw: {},
    });
    assert.equal(tampered.ok, false);
    if (!tampered.ok) assert.equal(tampered.reason, "amount_mismatch");
  });

  it("expire releases the slot", async () => {
    const id = await insertBooking({ status: "pending_payment", startHour: TEST_HOUR + 6 });
    const [row] = await db
      .select()
      .from(schema.bookings)
      .where(eq(schema.bookings.id, id));
    await applyPaymentNotification({
      orderId: row.providerOrderId,
      transactionStatus: "expire",
      fraudStatus: null,
      grossAmount: String(row.amountIdr),
      statusCode: "407",
      transactionId: null,
      raw: {},
    });
    await insertBooking({ status: "pending_payment", startHour: TEST_HOUR + 6 });
  });
});
