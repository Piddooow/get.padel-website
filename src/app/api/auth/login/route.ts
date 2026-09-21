/**
 * POST /api/auth/login — sign in with email + password.
 * Body: { email, password }
 * Responses: 200 { user } · 400 invalid input · 401 wrong credentials.
 */
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { createSession, normalizeEmail, verifyPassword } from "@/lib/auth";
import { isDatabaseEnabled } from "@/db";

export const runtime = "nodejs";

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

  const source = (body ?? {}) as Record<string, unknown>;
  const email = typeof source.email === "string" ? normalizeEmail(source.email) : "";
  const password = typeof source.password === "string" ? source.password : "";

  if (!email || !password) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "Email and password are required.",
        },
      },
      { status: 400 }
    );
  }

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json(
      { error: { code: "INVALID_CREDENTIALS", message: "Wrong email or password." } },
      { status: 401 }
    );
  }

  await createSession(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      whatsapp: user.whatsapp,
    },
  });
}
