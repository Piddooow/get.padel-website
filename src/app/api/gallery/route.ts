/**
 * GET /api/gallery — venue photo gallery.
 *
 * Query params:
 * - `locale` (optional) "id" | "en" — defaults to "id"
 *
 * Responses: 200 { count, photos } · 400 invalid locale.
 */
import { NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { listGalleryPhotos } from "@/lib/gallery-service";

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

  const photos = await listGalleryPhotos({ locale: localeParam });

  return NextResponse.json(
    { count: photos.length, photos },
    {
      headers: {
        "Cache-Control": "public, max-age=600, stale-while-revalidate=1800",
      },
    }
  );
}
