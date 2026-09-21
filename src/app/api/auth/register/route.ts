/**
 * POST /api/auth/register — create a visitor account and sign them in.
 * Body: { name, email, password, whatsapp? }
 * Responses: 201 { user } · 400 invalid input · 409 email already registered.
 */
import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { createSession, hashPassword, validateSignUp } from "@/lib/auth";
import { isDatabaseEnabled } from "@/db";

export const runtime = "nodejs";

const STATUS: Record<string, { status: number; message: string }> = {
  INVALID_NAME: { status: 400, message: "Name must be at least 2 characters." },
  INVALID_EMAIL: { status: 400, message: "Enter a valid email address." },
  WEAK_PASSWORD: {
    status: 400,
    message: "Password must be at least 8 characters.",
  },
  EMAIL_TAKEN: { status: 409, message: "That email is already registered." },
};

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Body must be JSON." } },
      { status: 400 }
    );
  }

  if (!isDatabaseEnabled()) {
    return NextResponse.json(
      {
        error: {
          code: "UNAVAILABLE",
          message: "Accounts are not available in this environment yet.",
        },
      },
      { status: 503 }
    );
  }

  const parsed = validateSignUp((body ?? {}) as Record<string, unknown>);
  if ("error" in parsed) {
    const detail = STATUS[parsed.error];
    return NextResponse.json(
      { error: { code: parsed.error, message: detail.message } },
      { status: detail.status }
    );
  }

  const { name, email, password, whatsapp } = parsed.value;

  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  if (existing) {
    const detail = STATUS.EMAIL_TAKEN;
    return NextResponse.json(
      { error: { code: "EMAIL_TAKEN", message: detail.message } },
      { status: detail.status }
    );
  }

  try {
    const [user] = await db
      .insert(schema.users)
      .values({
        id: randomBytes(12).toString("hex"),
        email,
        name,
        whatsapp,
        passwordHash: hashPassword(password),
      })
      .returning({
        id: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        whatsapp: schema.users.whatsapp,
      });

    await createSession(user.id);
    return NextResponse.json({ user }, { status: 201 });
  } catch {
    // Unique constraint on email lost a race — same user-facing answer.
    return NextResponse.json(
      {
        error: {
          code: "EMAIL_TAKEN",
          message: STATUS.EMAIL_TAKEN.message,
        },
      },
      { status: 409 }
    );
  }
}
