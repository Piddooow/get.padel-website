/**
 * GET /api/blog/[slug] — one blog article with its full body.
 *
 * Query params:
 * - `locale` (optional) "id" | "en" — defaults to "id"
 *
 * Responses: 200 BlogPostDetailDto · 400 invalid params · 404 unknown post.
 */
import { NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getBlogPost } from "@/lib/blog-service";

export const runtime = "nodejs";

const MAX_SLUG_LENGTH = 120;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
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

  if (!slug || slug.length > MAX_SLUG_LENGTH) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_PARAM",
          message: `\`slug\` must be 1–${MAX_SLUG_LENGTH} characters.`,
        },
      },
      { status: 400 }
    );
  }

  const post = await getBlogPost({ locale: localeParam, slug });
  if (!post) {
    return NextResponse.json(
      {
        error: {
          code: "POST_NOT_FOUND",
          message: `Unknown article "${slug}".`,
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json(post, {
    headers: {
      "Cache-Control": "public, max-age=600, stale-while-revalidate=1800",
    },
  });
}
