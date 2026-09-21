import assert from "node:assert/strict";
import test from "node:test";
import { parseHighlights } from "../src/lib/program-service";
import { parseIDR } from "../src/lib/format";

test("parseIDR reads rupiah strings", () => {
  assert.equal(parseIDR("Rp2.625.000"), 2_625_000);
  assert.equal(parseIDR("Rp450.000/pax"), 450_000);
  assert.equal(parseIDR("Rp150.000 – Rp260.000"), 150_000);
  assert.equal(parseIDR("gratis"), null);
  assert.equal(parseIDR(""), null);
});

test("parseHighlights resolves the locale from stored JSON", () => {
  const json = JSON.stringify([
    { id: "Maksimal 2 orang", en: "Max 2 players" },
    { id: "Termasuk court", en: "Court included" },
  ]);
  assert.deepEqual(parseHighlights(json, "id"), [
    "Maksimal 2 orang",
    "Termasuk court",
  ]);
  assert.deepEqual(parseHighlights(json, "en"), [
    "Max 2 players",
    "Court included",
  ]);
});

test("parseHighlights tolerates empty and malformed payloads", () => {
  assert.deepEqual(parseHighlights(null, "id"), []);
  assert.deepEqual(parseHighlights("not json", "id"), []);
  assert.deepEqual(parseHighlights('{"a":1}', "id"), []);
  assert.deepEqual(parseHighlights('[{"id":"x"}]', "id"), []);
});
