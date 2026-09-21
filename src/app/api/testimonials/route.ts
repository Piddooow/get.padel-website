/**
 * GET /api/testimonials — visitor reviews plus aggregated ratings.
 *
 * Query params:
 * - `locale` (optional) "id" | "en" — defaults to "id"
 *
 * Responses: 200 { aggregate, platforms, count, testimonials } · 400 invalid.
 */
import { NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getTestimonials } from "@/lib/testimonial-service";

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

  const data = await getTestimonials({ locale: localeParam });

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}
