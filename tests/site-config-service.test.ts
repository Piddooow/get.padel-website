import assert from "node:assert/strict";
import test from "node:test";
import { formatWhatsappDisplay } from "../src/lib/site-config-service";

test("formats 62-prefixed numbers into the local display format", () => {
  assert.equal(formatWhatsappDisplay("6281188022770"), "0811 8802 2770");
  assert.equal(formatWhatsappDisplay("+62 811-8802-2770"), "0811 8802 2770");
});

test("keeps local numbers as-is (grouped)", () => {
  assert.equal(formatWhatsappDisplay("081188022770"), "0811 8802 2770");
});

test("handles short and odd-length numbers gracefully", () => {
  assert.equal(formatWhatsappDisplay("0811"), "0811");
  assert.equal(formatWhatsappDisplay("08118802277"), "0811 8802 277");
});
