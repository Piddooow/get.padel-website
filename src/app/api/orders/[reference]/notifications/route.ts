/**
 * POST /api/orders/[reference]/notifications?locale=id|en
 *
 * Sends the booking confirmation summary to the guest's stored contact via
 * the notification service (email and/or WhatsApp). Without provider
 * credentials the service degrades gracefully (see `lib/notifications.ts`) —
 * WhatsApp returns a ready-to-use wa.me link instead of failing.
 *
 * Body: { channel?: "email" | "whatsapp" } — omit to send to every contact
 * on file. Responses: 200 { reference, results } · 400 invalid input ·
 * 404 unknown order. (Rate limiting intentionally out of scope for the
 * landing-page mock; enable it before production use.)
 */
import { NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getGuestOrder } from "@/lib/guest-orders";
import { sendOrderNotifications } from "@/lib/order-notifications";
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
    // empty body → send to every contact on file
  }

  const order = await getGuestOrder(reference);
  if (!order) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: `Unknown order "${reference}".` } },
      { status: 404 }
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

  return NextResponse.json(
    { reference: order.reference, results },
    { headers: { "Cache-Control": "no-store" } }
  );
}
