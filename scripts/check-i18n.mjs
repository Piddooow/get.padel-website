#!/usr/bin/env node
/**
 * Checks that all message catalogues share the exact same key structure.
 * Run via `npm run check:i18n`.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const MESSAGES_DIR = fileURLToPath(new URL("../messages/", import.meta.url));

function keyPaths(value, prefix = "") {
  if (typeof value !== "object" || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key)
  );
}

const files = readdirSync(MESSAGES_DIR).filter((file) => file.endsWith(".json"));
if (files.length < 2) {
  console.log("check:i18n — only one catalogue found, nothing to compare.");
  process.exit(0);
}

const catalogues = new Map(
  files.map((file) => [
    file,
    new Set(keyPaths(JSON.parse(readFileSync(join(MESSAGES_DIR, file), "utf8")))),
  ])
);

const [referenceName, referenceKeys] = catalogues.entries().next().value;
let failed = false;

for (const [name, keys] of catalogues) {
  if (name === referenceName) continue;
  const missing = [...referenceKeys].filter((key) => !keys.has(key));
  const extra = [...keys].filter((key) => !referenceKeys.has(key));
  if (missing.length || extra.length) {
    failed = true;
    console.error(`✗ ${name} differs from ${referenceName}`);
    if (missing.length) console.error(`  missing: ${missing.join(", ")}`);
    if (extra.length) console.error(`  extra:   ${extra.join(", ")}`);
  } else {
    console.log(`✓ ${name} matches ${referenceName} (${keys.size} keys)`);
  }
}

process.exit(failed ? 1 : 0);
