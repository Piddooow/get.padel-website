/**
 * GET /api/site-config — venue contact details, service hours and WhatsApp
 * settings (PRD §6 `venues`).
 *
 * Responses: 200 SiteConfigDto · 404 when the venue is not configured.
 */
import { NextResponse } from "next/server";
import { getSiteConfig } from "@/lib/site-config-service";
import { apiRoute } from "@/lib/api";

export const runtime = "nodejs";

export const GET = apiRoute(async () => {
  const config = await getSiteConfig();

  if (!config) {
    return NextResponse.json(
      {
        error: {
          code: "VENUE_NOT_CONFIGURED",
          message: "No venue configuration found.",
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json(config, {
    headers: {
      "Cache-Control": "public, max-age=600, stale-while-revalidate=1800",
    },
  });
});
