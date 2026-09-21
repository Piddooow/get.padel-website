import assert from "node:assert/strict";
import test from "node:test";
import {
  ANALYTICS_EVENTS,
  classifyAnchorClick,
} from "../src/lib/analytics";

test("classifies AYO booking links", () => {
  assert.equal(
    classifyAnchorClick("https://ayo.co.id/v/get-padel-jakarta"),
    ANALYTICS_EVENTS.bookAyo
  );
});

test("classifies WhatsApp links", () => {
  assert.equal(
    classifyAnchorClick("https://wa.me/6281188022770?text=Halo"),
    ANALYTICS_EVENTS.whatsapp
  );
});

test("classifies form links", () => {
  assert.equal(
    classifyAnchorClick("https://forms.gle/2zNxHCYW3NyUNsiF9"),
    ANALYTICS_EVENTS.form
  );
  assert.equal(
    classifyAnchorClick("https://docs.google.com/forms/d/e/abc/viewform"),
    ANALYTICS_EVENTS.form
  );
});

test("classifies mailto and social links", () => {
  assert.equal(
    classifyAnchorClick("mailto:getpadelcourt@gmail.com"),
    ANALYTICS_EVENTS.email
  );
  assert.equal(
    classifyAnchorClick("https://www.instagram.com/get.padel/"),
    ANALYTICS_EVENTS.social
  );
  assert.equal(
    classifyAnchorClick("https://www.tiktok.com/@get.padel"),
    ANALYTICS_EVENTS.social
  );
});

test("internal and empty links are ignored", () => {
  assert.equal(classifyAnchorClick("/jadwal"), null);
  assert.equal(classifyAnchorClick("#kontak"), null);
  assert.equal(classifyAnchorClick(""), null);
  assert.equal(classifyAnchorClick("https://maps.app.goo.gl/abc"), null);
});
