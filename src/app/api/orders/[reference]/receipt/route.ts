/**
 * POST /api/orders/[reference]/receipt?locale=id|en — resend booking proof.
 *
 * Server-side counterpart of the "kirim ulang bukti booking" help flow: the
 * stored contact(s) receive the booking summary again (email and/or WhatsApp
 * with graceful fallback). A short cooldown prevents spam on this public
 * route. No payment data is included (PRD §6).
 *
 * Body: { channel?: "email" | "whatsapp" }
 * Responses: 200 { reference, resentAt, results } · 400 invalid input ·
 * 404 unknown order · 429 resend cooldown active.
 */
import { NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getGuestOrder, markOrderNotified } from "@/lib/guest-orders";
import {
  resendCooldownRemaining,
  sendOrderNotifications,
  RESEND_COOLDOWN_SECONDS,
} from "@/lib/order-notifications";
import type { NotificationChannel } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  const { reference } = await params;
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? routing.defaultLocale;

  if (!hasLocale(routing.locales, locale)) {
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

  let channel: NotificationChannel | null = null;
  try {
    const body = await request.json();
    const value = (body as Record<string, unknown> | null)?.channel;
    if (value != null) {
      if (value !== "email" && value !== "whatsapp") {
        return NextResponse.json(
          {
            error: {
              code: "INVALID_INPUT",
              message: '`channel` must be "email" or "whatsapp".',
            },
          },
          { status: 400 }
        );
      }
      channel = value;
    }
  } catch {
    // empty body → every contact on file
  }

  const order = await getGuestOrder(reference);
  if (!order) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: `Unknown order "${reference}".` } },
      { status: 404 }
    );
  }

  const now = new Date();
  const cooldown = resendCooldownRemaining(
    order.lastNotifiedAt ? new Date(order.lastNotifiedAt) : null,
    now
  );
  if (cooldown > 0) {
    return NextResponse.json(
      {
        error: {
          code: "RESEND_COOLDOWN",
          message: `Please wait ${cooldown}s before resending again.`,
        },
        retryAfterSeconds: cooldown,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(cooldown),
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const { targets, results } = await sendOrderNotifications(order, {
    locale,
    channel: channel ?? undefined,
  });

  if (targets.length === 0) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: channel
            ? `Order "${reference}" has no ${channel} contact on file.`
            : `Order "${reference}" has no contact details on file.`,
        },
      },
      { status: 400 }
    );
  }

  const updated = await markOrderNotified(reference, now);
  return NextResponse.json(
    {
      reference: order.reference,
      resentAt: updated?.lastNotifiedAt ?? now.toISOString(),
      cooldownSeconds: RESEND_COOLDOWN_SECONDS,
      results,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
