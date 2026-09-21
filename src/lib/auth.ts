/**
 * Visitor accounts — password hashing (scrypt, node:crypto), database-backed
 * sessions and the httpOnly session cookie.
 *
 * Sessions live in SQLite so they survive restarts and can be revoked; the
 * cookie only carries an opaque random token.
 */
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt } from "drizzle-orm";
import { db, schema } from "@/db";

export const SESSION_COOKIE = "gp_session";
const SESSION_TTL_DAYS = 30;

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  whatsapp: string | null;
}

/* ---------------------------------------------------------------- passwords */

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, salt, hash] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
}

/* ---------------------------------------------------------------- sessions */

/** Creates a session row and sets the httpOnly cookie (route handlers only). */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000);

  await db.insert(schema.sessions).values({ id: token, userId, expiresAt });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, token));
  }
  store.delete(SESSION_COOKIE);
}

/** Current signed-in user, or null. Never throws. */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;

    const [row] = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        whatsapp: schema.users.whatsapp,
      })
      .from(schema.sessions)
      .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
      .where(
        and(eq(schema.sessions.id, token), gt(schema.sessions.expiresAt, new Date()))
      )
      .limit(1);

    return row ?? null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------- credentials */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface CredentialInput {
  name: string;
  email: string;
  password: string;
  whatsapp?: string | null;
}

export type CredentialError =
  | "INVALID_NAME"
  | "INVALID_EMAIL"
  | "WEAK_PASSWORD"
  | "EMAIL_TAKEN";

/** Validates and normalises sign-up input. */
export function validateSignUp(
  input: Partial<CredentialInput>
): { value: CredentialInput } | { error: CredentialError } {
  const name = (input.name ?? "").trim();
  const email = (input.email ?? "").trim().toLowerCase();
  const password = input.password ?? "";
  const whatsapp = input.whatsapp?.trim() || null;

  if (name.length < 2) return { error: "INVALID_NAME" };
  if (!EMAIL_RE.test(email)) return { error: "INVALID_EMAIL" };
  if (password.length < 8) return { error: "WEAK_PASSWORD" };

  return { value: { name, email, password, whatsapp } };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
