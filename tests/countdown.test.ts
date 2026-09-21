import assert from "node:assert/strict";
import test from "node:test";
import { getCountdown } from "../src/lib/countdown";

const NOW = new Date("2026-09-21T10:00:00.000Z");

test("counts days/hours/minutes/seconds until the target", () => {
  const countdown = getCountdown("2026-09-23T12:34:56.000Z", NOW);
  assert.deepEqual(countdown, {
    days: 2,
    hours: 2,
    minutes: 34,
    seconds: 56,
    ended: false,
  });
});

test("a passed target is marked ended", () => {
  const countdown = getCountdown("2026-09-20T10:00:00.000Z", NOW);
  assert.deepEqual(countdown, {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    ended: true,
  });
});

test("an invalid target does not throw", () => {
  const countdown = getCountdown("not-a-date", NOW);
  assert.equal(countdown.ended, true);
});

test("exact target time is ended", () => {
  assert.equal(getCountdown("2026-09-21T10:00:00.000Z", NOW).ended, true);
});
