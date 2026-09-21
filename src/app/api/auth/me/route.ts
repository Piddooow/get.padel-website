/**
 * GET /api/auth/me — the signed-in visitor's profile (for client UI such as
 * the header avatar). Returns `{ user: null }` when signed out; never throws.
 */
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json(
    { user },
    { headers: { "Cache-Control": "no-store" } }
  );
}
