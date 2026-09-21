import assert from "node:assert/strict";
import test from "node:test";
import { isAdminResource, resolveAdminAuth } from "../src/lib/admin-service";

test("admin auth states", () => {
  assert.equal(resolveAdminAuth("secret", undefined), "unconfigured");
  assert.equal(resolveAdminAuth(null, "secret"), "missing");
  assert.equal(resolveAdminAuth("wrong", "secret"), "forbidden");
  assert.equal(resolveAdminAuth("secret", "secret"), "ok");
});

test("admin resources are whitelisted", () => {
  assert.equal(isAdminResource("testimonials"), true);
  assert.equal(isAdminResource("gallery"), true);
  assert.equal(isAdminResource("blog"), true);
  assert.equal(isAdminResource("venues"), false);
  assert.equal(isAdminResource(42), false);
});
