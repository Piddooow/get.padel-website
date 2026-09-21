/**
 * HMAC-SHA256 helpers for inbound webhooks (payment status callbacks).
 *
 * Requests must carry `x-webhook-signature: sha256=<hex>` (a bare hex digest
 * is also accepted) computed over the RAW request body with the shared
 * secret from `PAYMENT_WEBHOOK_SECRET`.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const HEADER_PREFIX = "sha256=";

export function computeWebhookSignature(
  rawBody: string,
  secret: string
): string {
  return createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
}

export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secret: string
): boolean {
  if (!signatureHeader) return false;

  const provided = signatureHeader.startsWith(HEADER_PREFIX)
    ? signatureHeader.slice(HEADER_PREFIX.length)
    : signatureHeader;

  const expected = computeWebhookSignature(rawBody, secret);
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}
