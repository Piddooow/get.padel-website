import assert from "node:assert/strict";
import test from "node:test";
import { classifyEventStatus } from "../src/lib/event-service";

const NOW = new Date("2026-09-21T10:00:00.000Z");

test("future events are upcoming", () => {
  assert.equal(
    classifyEventStatus(new Date("2026-10-01T08:00:00.000Z"), NOW),
    "upcoming"
  );
});

test("past events and archive entries are past", () => {
  assert.equal(
    classifyEventStatus(new Date("2026-08-01T08:00:00.000Z"), NOW),
    "past"
  );
  assert.equal(classifyEventStatus(null, NOW), "past");
});

test("the exact start time counts as past", () => {
  assert.equal(
    classifyEventStatus(new Date("2026-09-21T10:00:00.000Z"), NOW),
    "past"
  );
});
