/**
 * GET /api/venues/[venueId] — venue detail with court specs and facilities.
 *
 * Responses: 200 `VenueDetailDto` · 400 invalid venue id · 404 unknown venue.
 */
import { NextResponse } from "next/server";
import { getVenueDetail } from "@/lib/venue-service";

export const runtime = "nodejs";

const MAX_ID_LENGTH = 80;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ venueId: string }> }
) {
  const { venueId } = await params;

  if (!venueId || venueId.length > MAX_ID_LENGTH) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_PARAM",
          message: `\`venueId\` must be 1–${MAX_ID_LENGTH} characters.`,
        },
      },
      { status: 400 }
    );
  }

  const venue = await getVenueDetail(venueId);
  if (!venue) {
    return NextResponse.json(
      {
        error: {
          code: "VENUE_NOT_FOUND",
          message: `Unknown venue "${venueId}".`,
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json(venue, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
