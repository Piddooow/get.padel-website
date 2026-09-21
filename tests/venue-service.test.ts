import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeCity,
  venueMatchesCity,
} from "../src/lib/venue-service";

const VENUE = {
  addressStreet: "Billy Moon Blok L V/9, Jl. Raya Kalimalang, RT 007 RW 010",
  addressDistrict: "Kel. Pondok Kelapa, Kec. Duren Sawit",
  addressCity: "Jakarta Timur 13450",
};

test("empty city query matches every venue", () => {
  assert.equal(venueMatchesCity(VENUE, ""), true);
  assert.equal(venueMatchesCity(VENUE, "   "), true);
});

test("matches the address city and district (case-insensitive)", () => {
  assert.equal(venueMatchesCity(VENUE, "jakarta timur"), true);
  assert.equal(venueMatchesCity(VENUE, "JAKARTA"), true);
  assert.equal(venueMatchesCity(VENUE, "pondok kelapa"), true);
  assert.equal(venueMatchesCity(VENUE, "duren sawit"), true);
  assert.equal(venueMatchesCity(VENUE, "kalimalang"), true);
});

test("matches the served areas (Jakarta Timur–Bekasi border)", () => {
  assert.equal(venueMatchesCity(VENUE, "Bekasi"), true);
  assert.equal(venueMatchesCity(VENUE, "bekasi"), true);
});

test("does not match unrelated cities", () => {
  assert.equal(venueMatchesCity(VENUE, "Bandung"), false);
  assert.equal(venueMatchesCity(VENUE, "Surabaya"), false);
});

test("normalizeCity trims and lowercases", () => {
  assert.equal(normalizeCity("  Jakarta Timur "), "jakarta timur");
  assert.equal(normalizeCity("BEKASI"), "bekasi");
});
