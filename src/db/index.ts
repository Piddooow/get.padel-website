/**
 * Database client — Drizzle ORM on top of Node's built-in SQLite
 * (`node:sqlite`, no native dependencies).
 *
 * The `sqlite-proxy` driver is wired to a synchronous `DatabaseSync`
 * executor; call sites keep Drizzle's typed query builder.
 */
import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

const DB_PATH = process.env.DATABASE_PATH ?? "./data/getpadel.db";

/**
 * Serverless platforms (Vercel) have an ephemeral filesystem: a local SQLite
 * file cannot hold accounts or bookings across requests. Instead of silently
 * losing data we switch the database OFF there unless an explicit, persistent
 * `DATABASE_PATH` is provided — every caller already handles the failure with
 * an honest fallback (content falls back to the bundled data, availability
 * reports itself as unavailable).
 */
const DATABASE_ENABLED =
  Boolean(process.env.DATABASE_PATH) || process.env.VERCEL !== "1";

let database: DatabaseSync | null = null;

export function isDatabaseEnabled(): boolean {
  return DATABASE_ENABLED;
}

function getDatabase(): DatabaseSync {
  if (!database) {
    if (!DATABASE_ENABLED) {
      throw new Error(
        "Database is not configured for this environment (set DATABASE_PATH to a persistent location)."
      );
    }
    database = new DatabaseSync(DB_PATH);
    database.exec("PRAGMA foreign_keys = ON;");
  }
  return database;
}

export const db = drizzle(
  async (sqlText, params, method) => {
    const statement = getDatabase().prepare(sqlText);
    statement.setReturnArrays(true);

    if (method === "run") {
      statement.run(...params);
      return { rows: [] };
    }

    // `setReturnArrays(true)` makes the driver return value arrays (the
    // shape the Drizzle proxy expects), which the runtime types don't model.
    const rows = statement.all(...params) as unknown as unknown[][];
    return { rows: method === "get" ? (rows[0] ?? []) : rows };
  },
  { schema }
);

export { schema };
