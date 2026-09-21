import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAyoPayload, summarizeSources } from "../src/lib/ayo-sync";

const KNOWN = [
  { id: "court-1", name: "Court 1" },
  { id: "court-2", name: "Court 2" },
];

test("normalizes the documented AYO payload shape", () => {
  const { slots, warnings } = normalizeAyoPayload(
    {
      date: "2026-09-21",
      courts: [
        {
          courtId: "court-1",
          slots: [
            { hour: 6, status: "available" },
            { hour: "18:00", status: "booked" },
          ],
        },
        {
          courtName: "Court 2",
          slots: [{ startTime: "07.00", state: "open" }],
        },
      ],
    },
    KNOWN
  );

  assert.deepEqual(slots, [
    { courtId: "court-1", hour: 6, status: "available" },
    { courtId: "court-1", hour: 18, status: "booked" },
    { courtId: "court-2", hour: 7, status: "available" },
  ]);
  assert.equal(warnings.length, 0);
});

test("accepts object-keyed slots and reports unknown courts", () => {
  const { slots, warnings } = normalizeAyoPayload(
    {
      courts: {
        "court-2": { slots: { "21": "terisi" } },
        "court-9": { slots: { "6": "available" } },
      },
    },
    KNOWN
  );
  assert.deepEqual(slots, [
    { courtId: "court-2", hour: 21, status: "booked" },
  ]);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /court-9/);
});

test("skips malformed slots without throwing", () => {
  const { slots, warnings } = normalizeAyoPayload(
    {
      courts: [
        {
          courtId: "court-1",
          slots: [{ hour: null, status: "available" }, { hour: 9 }, "junk"],
        },
      ],
    },
    KNOWN
  );
  assert.deepEqual(slots, []);
  assert.equal(warnings.length, 2);
});

test("summarizeSources only trusts fully-AYO data", () => {
  assert.equal(summarizeSources([]), "unavailable");
  assert.equal(summarizeSources(["ayo", "ayo"]), "ayo");
  // Anything that is not official AYO data makes the day untrustworthy.
  assert.equal(summarizeSources(["mock", "mock"]), "unavailable");
  assert.equal(summarizeSources(["ayo", "mock"]), "unavailable");
});
