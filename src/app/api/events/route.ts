/**
 * GET /api/events — tournaments, social days and community classes.
 *
 * Query params:
 * - `locale` (optional) "id" | "en" — defaults to "id"
 * - `status` (optional) upcoming | past
 *
 * Responses: 200 { count, events } · 400 invalid params.
 */
import { NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import {
  EVENT_STATUSES,
  listEvents,
  type EventStatus,
} from "@/lib/event-service";
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

  const statusParam = searchParams.get("status");
  if (
    statusParam != null &&
    !EVENT_STATUSES.includes(statusParam as EventStatus)
  ) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_PARAM",
          message: `status must be one of: ${EVENT_STATUSES.join(", ")}.`,
        },
      },
      { status: 400 }
    );
  }

  const events = await listEvents({
    locale: localeParam,
    status: statusParam ? (statusParam as EventStatus) : undefined,
  });

  return NextResponse.json(
    { count: events.length, events },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    }
  );
});
