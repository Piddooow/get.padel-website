/**
 * GET /api/venues — venue listing with an optional city filter.
 *
 * Query params:
 * - `city` (optional) city/area name, e.g. "Jakarta Timur" | "Bekasi"
 *   (matches the address and the venue's served areas, case-insensitive).
 *
 * Responses: 200 { city, count, venues } · 400 invalid params.
 */
import { NextResponse } from "next/server";
import { listVenues } from "@/lib/venue-service";

export const runtime = "nodejs";

const MAX_CITY_LENGTH = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityParam = searchParams.get("city")?.trim() ?? "";

  if (cityParam.length > MAX_CITY_LENGTH) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_PARAM",
          message: `\`city\` must be at most ${MAX_CITY_LENGTH} characters.`,
        },
      },
      { status: 400 }
    );
  }

  const venues = await listVenues({ city: cityParam || undefined });

  return NextResponse.json(
    {
      city: cityParam || null,
      count: venues.length,
      venues,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    }
  );
}
