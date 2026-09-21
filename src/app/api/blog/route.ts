/**
 * GET /api/blog — blog article list (newest first).
 *
 * Query params:
 * - `locale` (optional) "id" | "en" — defaults to "id"
 * - `limit`  (optional) 1–20, defaults to 20
 *
 * Responses: 200 { count, posts } · 400 invalid params.
 */
import { NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { listBlogPosts } from "@/lib/blog-service";
import { apiRoute } from "@/lib/api";

export const runtime = "nodejs";

const MAX_LIMIT = 20;

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

  const limitParam = searchParams.get("limit");
  let limit: number | undefined;
  if (limitParam != null) {
    const parsed = Number(limitParam);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_LIMIT) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_PARAM",
            message: `\`limit\` must be an integer between 1 and ${MAX_LIMIT}.`,
          },
        },
        { status: 400 }
      );
    }
    limit = parsed;
  }

  const posts = await listBlogPosts({ locale: localeParam, limit });

  return NextResponse.json(
    { count: posts.length, posts },
    {
      headers: {
        "Cache-Control": "public, max-age=600, stale-while-revalidate=1800",
      },
    }
  );
});
