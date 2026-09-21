import assert from "node:assert/strict";
import test from "node:test";
import { parseParagraphs } from "../src/lib/blog-service";

test("parses paragraph arrays", () => {
  assert.deepEqual(parseParagraphs('["One","Two"]'), ["One", "Two"]);
});

test("tolerates malformed or non-array payloads", () => {
  assert.deepEqual(parseParagraphs(null), []);
  assert.deepEqual(parseParagraphs(""), []);
  assert.deepEqual(parseParagraphs("not json"), []);
  assert.deepEqual(parseParagraphs('{"a":1}'), []);
  assert.deepEqual(parseParagraphs('["ok", 42, null]'), ["ok"]);
});
