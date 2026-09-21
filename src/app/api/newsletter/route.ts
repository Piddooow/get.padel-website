/**
 * POST /api/newsletter — subscribe an email to the venue newsletter.
 *
 * Body: { email, locale?, source? }
 *
 * Responses: 201 { subscription } (new) · 200 { subscription } (existing /
 * re-subscribed) · 400 invalid payload · 500 venue not configured.
 */
import { NextResponse } from "next/server";
import {
  subscribeToNewsletter,
  validateNewsletterInput,
} from "@/lib/newsletter-service";

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

  const validation = validateNewsletterInput(body);
  if (!validation.ok) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: validation.error } },
      { status: 400 }
    );
  }

  try {
    const subscription = await subscribeToNewsletter(validation.data);
    return NextResponse.json(
      { subscription },
      { status: subscription.status === "subscribed" ? 201 : 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "SERVICE_UNAVAILABLE",
          message:
            error instanceof Error
              ? error.message
              : "Newsletter service unavailable.",
        },
      },
      { status: 500 }
    );
  }
}
