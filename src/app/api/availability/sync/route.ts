import { NextResponse } from "next/server";
import { syncAvailabilityFromAyo } from "@/lib/ayo-sync";
import {
  AvailabilityQueryError,
  resolveDateParam,
} from "@/lib/availability";

export const dynamic = "force-dynamic";

/**
 * Pulls a date's slot statuses from AYO and stores them in `schedule_slots`.
 *
 * Body: { "date": "YYYY-MM-DD" | "today" | "tomorrow" | "weekend" }
 * Auth: set `AYO_SYNC_TOKEN` to require the `x-sync-token` header.
 * Always answers 200 with a result payload — sync never breaks availability.
 */
export async function POST(request: Request) {
  const expectedToken = process.env.AYO_SYNC_TOKEN;
  if (expectedToken && request.headers.get("x-sync-token") !== expectedToken) {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Invalid sync token." },
      { status: 401 }
    );
  }

  let dateParam: string | undefined;
  try {
    const body = (await request.json()) as { date?: unknown } | null;
    if (typeof body?.date === "string") dateParam = body.date;
  } catch {
    // Empty body → treated as a missing date below.
  }

  if (!dateParam) {
    return NextResponse.json(
      {
        error: "MISSING_DATE",
        message: 'JSON body { "date": "YYYY-MM-DD" } is required.',
      },
      { status: 400 }
    );
  }

  try {
    const { dateISO, preset } = resolveDateParam(dateParam);
    const result = await syncAvailabilityFromAyo(dateISO);
    return NextResponse.json({ ...result, preset: preset ?? null });
  } catch (error) {
    if (error instanceof AvailabilityQueryError) {
      return NextResponse.json(
        { error: error.detail.code, message: error.detail.message },
        { status: 400 }
      );
    }
    throw error;
  }
}
