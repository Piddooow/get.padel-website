import assert from "node:assert/strict";
import test from "node:test";
import { validateAnalyticsEvent } from "../src/lib/analytics-service";

test("accepts known CTA event names", () => {
  const result = validateAnalyticsEvent({
    name: "whatsapp_click",
    pagePath: "/id/program",
    linkUrl: "https://wa.me/6281188022770",
    linkText: "WhatsApp",
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.data, {
      name: "whatsapp_click",
      pagePath: "/id/program",
      linkUrl: "https://wa.me/6281188022770",
      linkText: "WhatsApp",
    });
  }
});

test("rejects unknown names and malformed bodies", () => {
  assert.equal(validateAnalyticsEvent(null).ok, false);
  assert.equal(validateAnalyticsEvent({}).ok, false);
  assert.equal(validateAnalyticsEvent({ name: "page_view" }).ok, false);
  assert.equal(validateAnalyticsEvent({ name: "click" }).ok, false);
});

test("truncates long context fields and nulls empty ones", () => {
  const result = validateAnalyticsEvent({
    name: "booking_ayo_click",
    pagePath: "  ",
    linkUrl: "https://ayo.co.id/" + "x".repeat(600),
    linkText: "A".repeat(200),
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.data.pagePath, null);
    assert.equal(result.data.linkUrl?.length, 500);
    assert.equal(result.data.linkText?.length, 120);
  }
});
