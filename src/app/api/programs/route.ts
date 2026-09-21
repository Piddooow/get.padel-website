/**
 * GET /api/programs — coaching programmes and multi-session packages.
 *
 * Query params:
 * - `locale` (optional) "id" | "en" — defaults to "id"
 * - `kind`   (optional) private | multi_session | junior | free_trial
 *
 * Responses: 200 { count, programs } · 400 invalid params.
 */
import { NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import {
  listCoachingPrograms,
  PROGRAM_KINDS,
  type ProgramKind,
} from "@/lib/program-service";

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

  const kindParam = searchParams.get("kind");
  if (kindParam != null && !PROGRAM_KINDS.includes(kindParam as ProgramKind)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_PARAM",
          message: `kind must be one of: ${PROGRAM_KINDS.join(", ")}.`,
        },
      },
      { status: 400 }
    );
  }

  const programs = await listCoachingPrograms({
    locale: localeParam,
    kind: kindParam ? (kindParam as ProgramKind) : undefined,
  });

  return NextResponse.json(
    { count: programs.length, programs },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    }
  );
}
