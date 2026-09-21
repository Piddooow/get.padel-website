import assert from "node:assert/strict";
import test from "node:test";
import { deliverNotification } from "../src/lib/notifications";

const WHATSAPP_MESSAGE = {
  channel: "whatsapp" as const,
  to: "0811 8802 2770",
  body: "Konfirmasi booking GP-ABCDEF",
  reference: "GP-ABCDEF",
};

test("WhatsApp falls back to a wa.me link when the API is not configured", async () => {
  const result = await deliverNotification(WHATSAPP_MESSAGE, { env: {} });
  assert.equal(result.status, "fallback");
  assert.equal(result.provider, "wa.me");
  assert.ok(result.link?.startsWith("https://wa.me/6281188022770?text="));
  assert.ok(decodeURIComponent(result.link ?? "").includes("GP-ABCDEF"));
});

test("WhatsApp posts a Cloud-API shaped payload when configured", async () => {
  const calls: { url: string; body: unknown; auth?: string }[] = [];
  const result = await deliverNotification(WHATSAPP_MESSAGE, {
    env: {
      WHATSAPP_API_URL: "https://graph.example.test/messages",
      WHATSAPP_API_TOKEN: "token-123",
    },
    fetchImpl: async (url, init) => {
      calls.push({
        url,
        body: JSON.parse(String(init?.body ?? "{}")),
        auth: init?.headers?.Authorization,
      });
      return { ok: true, status: 200 };
    },
  });

  assert.equal(result.status, "sent");
  assert.equal(result.provider, "whatsapp-cloud");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://graph.example.test/messages");
  assert.equal(calls[0].auth, "Bearer token-123");
  assert.deepEqual(calls[0].body, {
    messaging_product: "whatsapp",
    to: "6281188022770",
    type: "text",
    text: { body: WHATSAPP_MESSAGE.body },
  });
});

test("provider errors and invalid recipients are reported, not thrown", async () => {
  const failing = await deliverNotification(WHATSAPP_MESSAGE, {
    env: {
      WHATSAPP_API_URL: "https://graph.example.test/messages",
      WHATSAPP_API_TOKEN: "token-123",
    },
    fetchImpl: async () => ({ ok: false, status: 429 }),
  });
  assert.equal(failing.status, "failed");
  assert.match(failing.detail ?? "", /429/);

  const invalid = await deliverNotification(
    { ...WHATSAPP_MESSAGE, to: "12345" },
    { env: {} }
  );
  assert.equal(invalid.status, "failed");
  assert.equal(invalid.provider, "validation");
});

test("email uses the Resend-compatible API when configured", async () => {
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  const result = await deliverNotification(
    {
      channel: "email",
      to: "rizky@example.com",
      subject: "Booking GP-ABCDEF",
      body: "Terima kasih!",
      reference: "GP-ABCDEF",
    },
    {
      env: {
        EMAIL_API_URL: "https://mail.example.test/send",
        EMAIL_API_KEY: "key-456",
        EMAIL_FROM: "Get Padel <hello@getpadel.test>",
      },
      fetchImpl: async (url, init) => {
        calls.push({ url, body: JSON.parse(String(init?.body ?? "{}")) });
        return { ok: true, status: 200 };
      },
    }
  );

  assert.equal(result.status, "sent");
  assert.equal(calls[0].url, "https://mail.example.test/send");
  assert.equal(calls[0].body.from, "Get Padel <hello@getpadel.test>");
  assert.equal(calls[0].body.to, "rizky@example.com");
});

test("email falls back to manual when not configured", async () => {
  const result = await deliverNotification(
    {
      channel: "email",
      to: "rizky@example.com",
      body: "Terima kasih!",
      reference: "GP-ABCDEF",
    },
    { env: {} }
  );
  assert.equal(result.status, "fallback");
  assert.equal(result.provider, "manual");
});
