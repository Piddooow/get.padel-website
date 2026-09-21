import assert from "node:assert/strict";
import test from "node:test";
import {
  toAvailabilityMeta,
  toCourtAvailability,
} from "../src/lib/availability-ui";
import type { AvailabilityResponse } from "../src/lib/availability";

const response: AvailabilityResponse = {
  venue: {
    id: "get-padel-jakarta",
    name: "Get Padel Jakarta",
    tagline: "Padel court",
    courtOpenHour: 6,
    courtCloseHour: 22,
    sessionMinutes: 60,
    bookingUrl: "https://ayo.co.id/v/get-padel-jakarta",
  },
  date: "2026-09-21",
  dayType: "weekday",
  courts: [
    {
      courtId: "court-1",
      name: "Court 1",
      indoor: true,
      availableCount: 1,
      slots: [
        {
          hour: 6,
          status: "available",
          price: 150_000,
          strike: 225_000,
          peak: false,
        },
        {
          hour: 18,
          status: "booked",
          price: 260_000,
          strike: 300_000,
          peak: true,
        },
      ],
    },
  ],
  summary: {
    totalSlots: 2,
    availableSlots: 1,
    bookedSlots: 1,
    pastSlots: 0,
    minPrice: 150_000,
  },
  dataSource: "ayo",
  syncedAt: "2026-09-21T03:00:00.000Z",
};

test("maps API availability onto the UI court/slot shape", () => {
  const [court] = toCourtAvailability(response);
  assert.equal(court.court.id, "court-1");
  assert.equal(court.court.name, "Court 1");
  // Catalog data (image/surface) is resolved for known courts.
  assert.ok(court.court.image.length > 0);
  assert.deepEqual(
    court.slots.map((slot) => [slot.hour, slot.status]),
    [
      [6, "available"],
      [18, "booked"],
    ]
  );
  assert.equal(court.slots[0].price, 150_000);
  assert.equal(court.availableCount, 1);
});

test("exposes sync provenance for the source indicator", () => {
  assert.deepEqual(toAvailabilityMeta(response), {
    dataSource: "ayo",
    syncedAt: "2026-09-21T03:00:00.000Z",
  });
});
