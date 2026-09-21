/**
 * POST /api/analytics/events — first-party recording of outbound CTA clicks
 * (AYO booking, WhatsApp, forms, email, socials). Fire-and-forget semantics:
 * the client sends the event with `keepalive` and never blocks navigation.
 *
 * Body: { name, pagePath?, linkUrl?, linkText? }
 *
 * Responses: 202 { recorded: true } · 400 invalid payload.
 */
import { NextResponse } from "next/server";
import {
  recordAnalyticsEvent,
  validateAnalyticsEvent,
} from "@/lib/analytics-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_BODY",
          message: "Request body must be valid JSON.",
        },
      },
      { status: 400 }
    );
  }

  const validation = validateAnalyticsEvent(body);
  if (!validation.ok) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: validation.error } },
      { status: 400 }
    );
  }

  try {
    await recordAnalyticsEvent(validation.data);
  } catch {
    // Analytics must never break the visitor experience.
  }

  return NextResponse.json({ recorded: true }, { status: 202 });
}
