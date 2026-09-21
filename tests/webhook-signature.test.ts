import assert from "node:assert/strict";
import test from "node:test";
import {
  computeWebhookSignature,
  verifyWebhookSignature,
} from "../src/lib/webhook-signature";

const SECRET = "test-secret";
const BODY = '{"reference":"GP-ABCDEF","status":"paid"}';

test("signature verification accepts the matching digest", () => {
  const signature = computeWebhookSignature(BODY, SECRET);
  assert.equal(verifyWebhookSignature(BODY, signature, SECRET), true);
  assert.equal(
    verifyWebhookSignature(BODY, `sha256=${signature}`, SECRET),
    true
  );
});

test("signature verification rejects tampered bodies and wrong secrets", () => {
  const signature = computeWebhookSignature(BODY, SECRET);
  assert.equal(
    verifyWebhookSignature(`${BODY} `, signature, SECRET),
    false
  );
  assert.equal(verifyWebhookSignature(BODY, signature, "other-secret"), false);
  assert.equal(verifyWebhookSignature(BODY, null, SECRET), false);
  assert.equal(verifyWebhookSignature(BODY, "sha256=deadbeef", SECRET), false);
});
