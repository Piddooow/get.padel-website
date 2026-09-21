/** POST /api/auth/logout — revoke the current session. */
import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST() {
  await destroySession();
  return NextResponse.json({ ok: true });
}
