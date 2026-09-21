import assert from "node:assert/strict";
import test from "node:test";
import { resendCooldownRemaining } from "../src/lib/order-notifications";

const NOW = new Date("2026-09-21T10:00:00.000Z");

test("no prior notification means no cooldown", () => {
  assert.equal(resendCooldownRemaining(null, NOW), 0);
});

test("cooldown counts down from the last notification", () => {
  const thirtySecondsAgo = new Date(NOW.getTime() - 30_000);
  assert.equal(resendCooldownRemaining(thirtySecondsAgo, NOW), 30);

  const oneMinuteAgo = new Date(NOW.getTime() - 60_000);
  assert.equal(resendCooldownRemaining(oneMinuteAgo, NOW), 0);

  const inFuture = new Date(NOW.getTime() + 5_000);
  assert.equal(
    resendCooldownRemaining(inFuture, NOW),
    60,
    "clock skew clamps to the full cooldown"
  );

  assert.equal(
    resendCooldownRemaining(thirtySecondsAgo, NOW, 120),
    90,
    "custom cooldown length is respected"
  );
});
