/**
 * Database client — Drizzle ORM with two interchangeable SQLite drivers:
 *
 * - Hosted/libSQL (Turso, Vercel-friendly): used when `TURSO_DATABASE_URL`
 *   (or `LIBSQL_URL`) is set. Data survives serverless invocations.
 * - Local file (Node's built-in `node:sqlite`, no native deps): the default
 *   outside serverless, used for development and self-hosted runs.
 *
 * When neither is available (e.g. a serverless deployment with no persistent
 * database configured) the client stays disabled: every caller already falls
 * back to bundled content or an honest "not connected" state, so the app never
 * crashes because a database is missing.
 */
import { DatabaseSync } from "node:sqlite";
import { createClient } from "@libsql/client";
import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import {
  drizzle as drizzleProxy,
  type SqliteRemoteDatabase,
} from "drizzle-orm/sqlite-proxy";
import * as schema from "./schema";

const DB_PATH = process.env.DATABASE_PATH ?? "./data/getpadel.db";
const LIBSQL_URL =
  process.env.TURSO_DATABASE_URL ?? process.env.LIBSQL_URL ?? "";
const LIBSQL_AUTH_TOKEN =
  process.env.TURSO_AUTH_TOKEN ?? process.env.LIBSQL_AUTH_TOKEN ?? "";

const DATABASE_ENABLED =
  Boolean(LIBSQL_URL) ||
  Boolean(process.env.DATABASE_PATH) ||
  process.env.VERCEL !== "1";

export type AppDatabase = SqliteRemoteDatabase<typeof schema>;

export function isDatabaseEnabled(): boolean {
  return DATABASE_ENABLED;
}

/** True when the persistent hosted driver is in use (Turso/libSQL). */
export function isHostedDatabase(): boolean {
  return Boolean(LIBSQL_URL);
}

function createNodeSqliteDatabase(): AppDatabase {
  let database: DatabaseSync | null = null;

  const getDatabase = (): DatabaseSync => {
    if (!database) {
      if (!DATABASE_ENABLED) {
        throw new Error(
          "Database is not configured for this environment (set TURSO_DATABASE_URL or DATABASE_PATH to a persistent location)."
        );
      }
      database = new DatabaseSync(DB_PATH);
      database.exec("PRAGMA foreign_keys = ON;");
    }
    return database;
  };

  return drizzleProxy(
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
  ) as unknown as AppDatabase;
}

function createHostedDatabase(): AppDatabase {
  const client = createClient({
    url: LIBSQL_URL,
    ...(LIBSQL_AUTH_TOKEN ? { authToken: LIBSQL_AUTH_TOKEN } : {}),
  });
  return drizzleLibsql(client, { schema }) as unknown as AppDatabase;
}

export const db: AppDatabase = LIBSQL_URL
  ? createHostedDatabase()
  : createNodeSqliteDatabase();

export { schema };
