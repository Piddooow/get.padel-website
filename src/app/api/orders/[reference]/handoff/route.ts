/**
 * POST /api/orders/[reference]/handoff?locale=id|en — initiate payment on
 * the official channel (PRD Fase 2).
 *
 * The landing page never processes payments (PRD §2.4/§6): this endpoint
 * validates the guest order + its active 10-minute hold, marks the handoff
 * and returns the official destination (AYO page or a prefilled WhatsApp
 * order message) plus the quoted amount.
 *
 * Responses: 200 { order, handoff, quote } · 400 invalid locale/input ·
 * 404 unknown order · 409 cancelled order or expired hold.
 */
import { NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { formatHourRange, formatIDR } from "@/lib/format";
import {
  assertOrderReadyForHandoff,
  GuestOrderError,
  getGuestOrder,
  markGuestOrderHandedOff,
  type GuestOrderDto,
} from "@/lib/guest-orders";
import { site, whatsappLink } from "@/data/site";

export const runtime = "nodejs";

const DURATION_KEYS = {
  1: "duration1",
  2: "duration2",
  3: "duration3",
} as const;

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

  let order = await getGuestOrder(reference);
  if (!order) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: `Unknown order "${reference}".` } },
      { status: 404 }
    );
  }

  try {
    assertOrderReadyForHandoff(order);
    if (order.status === "created") {
      order = await markGuestOrderHandedOff(reference);
    }
  } catch (error) {
    if (error instanceof GuestOrderError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: 409 }
      );
    }
    throw error;
  }

  const [t, tBooking, tPricing] = await Promise.all([
    getTranslations({ locale, namespace: "handoff" }),
    getTranslations({ locale, namespace: "booking" }),
    getTranslations({ locale, namespace: "pricing" }),
  ]);

  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${order.date}T00:00:00`));

  const timeLabel = formatHourRange(
    locale,
    order.startHour,
    order.startHour + order.durationHours
  );
  const durationLabel =
    tBooking(DURATION_KEYS[order.durationHours as 1 | 2 | 3]);
  const paymentLabel =
    order.paymentMethod === "qris"
      ? tPricing("paymentQris")
      : order.paymentMethod === "va"
        ? tPricing("paymentVa")
        : order.paymentMethod === "ewallet"
          ? tPricing("paymentEwallet")
          : order.paymentMethod === "card"
            ? tPricing("paymentCard")
            : order.paymentMethod === "installment"
              ? tPricing("paymentInstallment")
              : null;

  const totalLabel = formatIDR(order.totals.price);
  const params_ = {
    reference: order.reference,
    court: order.courtName ?? order.courtId,
    date: dateLabel,
    time: timeLabel,
    duration: durationLabel,
    total: totalLabel,
    payment: paymentLabel ?? "-",
  };

  const handoff: {
    channel: GuestOrderDto["channel"];
    reference: string;
    url: string;
    message?: string;
    instruction: string;
  } = {
    channel: order.channel,
    reference: order.reference,
    url:
      order.channel === "whatsapp"
        ? whatsappLink(t("waTemplate", params_))
        : site.links.ayo,
    instruction: t("ayoInstruction", { reference: order.reference }),
  };
  if (order.channel === "whatsapp") {
    handoff.message = t("waTemplate", params_);
  }

  return NextResponse.json(
    {
      order,
      handoff,
      quote: {
        amount: order.totals.price,
        strike: order.totals.strike,
        discountPercent: order.totals.discountPercent,
        paymentMethod: order.paymentMethod,
        paymentMethodLabel: paymentLabel,
        note: t("quoteNote"),
      },
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
