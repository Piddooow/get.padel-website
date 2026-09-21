/**
 * End-to-end check for the AYO real-time availability sync.
 *
 * Spins a local fake AYO endpoint that serves the documented payload, points
 * `AYO_AVAILABILITY_API_URL` at it, runs the sync, verifies that availability
 * queries switch to `dataSource: "ayo"`, then restores the original rows.
 *
 * Usage: npx tsx scripts/check-ayo-sync.ts
 */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { and, asc, desc, eq } from "drizzle-orm";
import { db, schema } from "../src/db";
import { syncAvailabilityFromAyo } from "../src/lib/ayo-sync";
import { getSlotAvailability } from "../src/lib/availability";

const COURTS = ["court-1", "court-2"];
const HOURS = Array.from({ length: 16 }, (_, index) => 6 + index);

async function main() {
  const [firstDay] = await db
    .select({ date: schema.scheduleSlots.date })
    .from(schema.scheduleSlots)
    .orderBy(asc(schema.scheduleSlots.date))
    .limit(1);
  const [lastDay] = await db
    .select({ date: schema.scheduleSlots.date })
    .from(schema.scheduleSlots)
    .orderBy(desc(schema.scheduleSlots.date))
    .limit(1);

  const allRows = await db
    .select()
    .from(schema.scheduleSlots)
    .orderBy(asc(schema.scheduleSlots.date));
  const date = allRows[allRows.length - 1].date;
  console.log(`Checking sync for ${date} (slot window: ${firstDay?.date} → ${lastDay?.date})`);

  const original = allRows.filter((row) => row.date === date);

  const payload = {
    date,
    courts: COURTS.map((courtId, courtIndex) => ({
      courtId,
      slots: HOURS.map((hour) => ({
        hour,
        status: (hour + courtIndex) % 2 === 0 ? "available" : "booked",
      })),
    })),
  };

  const server = createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    if (url.pathname !== "/availability" || url.searchParams.get("date") !== date) {
      response.writeHead(404).end();
      return;
    }
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(payload));
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  process.env.AYO_AVAILABILITY_API_URL = `http://127.0.0.1:${address.port}/availability`;

  try {
    const result = await syncAvailabilityFromAyo(date);
    console.log("sync result:", {
      requested: result.requested,
      updated: result.updated,
      source: result.source,
      syncedAt: result.syncedAt,
      warnings: result.warnings,
    });
    assert.equal(result.requested, true);
    assert.equal(result.source, "ayo");
    assert.equal(result.updated, COURTS.length * HOURS.length);

    const after = await getSlotAvailability(date);
    console.log("query provenance:", {
      dataSource: after.dataSource,
      syncedAt: after.syncedAt,
      court1: after.courts[0].slots
        .slice(0, 3)
        .map((slot) => `${slot.hour}:${slot.status}`),
    });
    assert.equal(after.dataSource, "ayo");
    assert.ok(after.syncedAt);
    assert.equal(after.courts[0].slots[0].status, "available");
    assert.equal(after.courts[0].slots[1].status, "booked");

    console.log("✓ AYO sync path verified (statuses + provenance)");
  } finally {
    for (const row of original) {
      await db
        .update(schema.scheduleSlots)
        .set({ status: row.status, source: row.source, checkedAt: row.checkedAt })
        .where(
          and(eq(schema.scheduleSlots.id, row.id))
        );
    }
    const restored = await getSlotAvailability(date);
    console.log(`restored ${original.length} rows — dataSource back to "${restored.dataSource}"`);
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
