/**
 * GET /api/open-matches — joinable community sessions with real-time spots.
 *
 * Query params:
 * - `locale` (optional) "id" | "en" — defaults to "id"
 *
 * Responses: 200 { count, matches } · 400 invalid params.
 */
import { NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { listOpenMatches } from "@/lib/open-match-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const localeParam = searchParams.get("locale") ?? routing.defaultLocale;
  if (!hasLocale(routing.locales, localeParam)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_LOCALE",
          message: `locale must be one of: ${routing.locales.join(", ")}.`,
        },
      },
      { status: 400 }
    );
  }

  const matches = await listOpenMatches({ locale: localeParam });

  return NextResponse.json(
    { count: matches.length, matches },
    {
      // Real-time spots: keep the cache window short.
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
      },
    }
  );
}
