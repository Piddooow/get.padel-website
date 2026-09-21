/**
 * GET /api/venues/[venueId]/availability — slot availability for one venue
 * on a given date (PRD Fase 1, backend).
 *
 * Query params:
 * - `date`     (required) YYYY-MM-DD or preset today|tomorrow|weekend
 * - `indoor`   (optional) true|false — filter by court type
 * - `court`    (optional) court id, e.g. "court-1"
 * - `hour`     (optional) start hour 6–21 for a bookability check
 * - `duration` (optional) consecutive hours 1–3 (requires `hour`)
 *
 * Responses: 200 `AvailabilityResponse` · 400 invalid params · 404 unknown
 * venue / out-of-range date.
 */
import { NextResponse } from "next/server";
import {
  AvailabilityQueryError,
  getSlotAvailability,
} from "@/lib/availability";

export const runtime = "nodejs";

const FIRST_HOUR = 6;
const LAST_HOUR = 21;
const MAX_DURATION = 3;

function badRequest(code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status: 400 });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const { venueId } = await params;
  const { searchParams } = new URL(request.url);

  const date = searchParams.get("date");
  if (!date) {
    return badRequest(
      "INVALID_DATE",
      "Query param `date` is required (YYYY-MM-DD or today|tomorrow|weekend)."
    );
  }

  const courtId = searchParams.get("court") ?? undefined;

  const indoorParam = searchParams.get("indoor");
  let indoor: boolean | undefined;
  if (indoorParam != null) {
    if (indoorParam !== "true" && indoorParam !== "false") {
      return badRequest(
        "INVALID_INDOOR",
        "Query param `indoor` must be `true` or `false`."
      );
    }
    indoor = indoorParam === "true";
  }

  const hourParam = searchParams.get("hour");
  const durationParam = searchParams.get("duration");

  let hour: number | undefined;
  if (hourParam != null) {
    hour = Number(hourParam);
    if (!Number.isInteger(hour) || hour < FIRST_HOUR || hour > LAST_HOUR) {
      return badRequest(
        "INVALID_HOUR",
        `Query param \`hour\` must be an integer between ${FIRST_HOUR} and ${LAST_HOUR}.`
      );
    }
  }

  let duration: number | undefined;
  if (durationParam != null) {
    duration = Number(durationParam);
    if (!Number.isInteger(duration) || duration < 1 || duration > MAX_DURATION) {
      return badRequest(
        "INVALID_DURATION",
        `Query param \`duration\` must be an integer between 1 and ${MAX_DURATION}.`
      );
    }
    if (hour == null) {
      return badRequest(
        "MISSING_HOUR",
        "Query param `hour` is required when `duration` is provided."
      );
    }
    if (hour + duration - 1 > LAST_HOUR) {
      return badRequest(
        "INVALID_RANGE",
        `A ${duration}-hour session starting at ${hour}:00 exceeds the last slot (${LAST_HOUR}:00–${LAST_HOUR + 1}:00).`
      );
    }
  }

  try {
    const result = await getSlotAvailability(date, {
      venueId,
      courtId,
      indoor,
      hour,
      duration,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof AvailabilityQueryError) {
      const status = error.detail.code === "INVALID_DATE" ? 400 : 404;
      return NextResponse.json({ error: error.detail }, { status });
    }
    console.error("venue availability endpoint failed:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Unexpected server error." } },
      { status: 500 }
    );
  }
}
