/**
 * GET /api/faqs — bilingual FAQ list (Location & Help pages).
 *
 * Query params:
 * - `locale` (optional) "id" | "en" — defaults to "id"
 *
 * Responses: 200 { count, faqs } · 400 invalid locale.
 */
import { NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { listFaqs } from "@/lib/faq-service";
import { apiRoute } from "@/lib/api";

export const runtime = "nodejs";

export const GET = apiRoute(async (request: Request) => {
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

  const faqs = await listFaqs({ locale: localeParam });

  return NextResponse.json(
    { count: faqs.length, faqs },
    {
      headers: {
        "Cache-Control": "public, max-age=600, stale-while-revalidate=1800",
      },
    }
  );
});
