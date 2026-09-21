/**
 * GET /api/promos — running promos with expiry filtering.
 *
 * Query params:
 * - `locale`          (optional) "id" | "en" — defaults to "id"
 * - `include_expired` (optional) "true" | "false" — defaults to "false"
 *   (expired = outside the structured starts_on/ends_on window or archived)
 *
 * Responses: 200 { date, count, promos } · 400 invalid params.
 */
import { NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { listPromos } from "@/lib/promos-service";

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

  const includeExpiredParam = searchParams.get("include_expired");
  if (
    includeExpiredParam != null &&
    includeExpiredParam !== "true" &&
    includeExpiredParam !== "false"
  ) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_PARAM",
          message: '`include_expired` must be "true" or "false".',
        },
      },
      { status: 400 }
    );
  }

  const dateISO = new Date().toISOString().slice(0, 10);
  const promos = await listPromos({
    includeExpired: includeExpiredParam === "true",
    dateISO,
    locale: localeParam,
  });

  return NextResponse.json(
    { date: dateISO, count: promos.length, promos },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    }
  );
}
