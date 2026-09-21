/**
 * Verification helper for the My Booking end-to-end check.
 *
 * Creates (or removes) two demo bookings for a given user so the account page
 * can be exercised with a paid and an awaiting-payment record. Refuses to run
 * against a production build.
 *
 * Usage:
 *   npx tsx scripts/verify-demo-booking.ts seed <userId>
 *   npx tsx scripts/verify-demo-booking.ts cleanup <userId>
 */
import { eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db, schema } from "../src/db";

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to run in production.");
    process.exit(1);
  }

  const [mode, userId] = process.argv.slice(2);
  if (!mode || !userId) {
    console.error("Usage: verify-demo-booking.ts <seed|cleanup> <userId>");
    process.exit(1);
  }

  if (mode === "seed") {
    await db.insert(schema.bookings).values([
      {
        id: randomBytes(12).toString("hex"),
        reference: "GP-DEMO-PAID1",
        userId,
        venueId: "get-padel-jakarta",
        courtId: "court-1",
        date: "2027-02-10",
        startHour: 18,
        durationHours: 2,
        amountIdr: 520000,
        status: "paid",
        paymentStatus: "settlement",
        provider: "midtrans",
        providerOrderId: "demo-paid-1",
        paidAt: new Date(),
        expiresAt: new Date(Date.now() + 900000),
      },
      {
        id: randomBytes(12).toString("hex"),
        reference: "GP-DEMO-PEND1",
        userId,
        venueId: "get-padel-jakarta",
        courtId: "court-2",
        date: "2027-02-12",
        startHour: 20,
        durationHours: 1,
        amountIdr: 260000,
        status: "pending_payment",
        paymentStatus: "pending",
        provider: "midtrans",
        providerOrderId: "demo-pending-1",
        snapRedirectUrl:
          "https://app.sandbox.midtrans.com/snap/v4/redirection/demo",
        expiresAt: new Date(Date.now() + 900000),
      },
    ]);
    console.log("seeded GP-DEMO-PAID1 + GP-DEMO-PEND1");
    return;
  }

  if (mode === "cleanup") {
    // Deleting the user cascades to their bookings + payments.
    await db.delete(schema.users).where(eq(schema.users.id, userId));
    console.log("cleaned");
  }
}

void main();
