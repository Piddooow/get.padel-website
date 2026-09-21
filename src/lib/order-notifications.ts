/**
 * Shared order-notification rendering + delivery (PRD Fase 2).
 *
 * Renders the localized booking summary (email subject/body or WhatsApp body)
 * for a guest order and delivers it through `lib/notifications`. Used by the
 * notifications endpoint (first send) and the resend/receipt endpoint.
 */
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { formatHourRange, formatIDR } from "@/lib/format";
import type { GuestOrderDto } from "@/lib/guest-orders";
import {
  deliverNotification,
  type DeliveryResult,
  type NotificationChannel,
} from "@/lib/notifications";

const DURATION_KEYS = {
  1: "duration1",
  2: "duration2",
  3: "duration3",
} as const;

/** Cooldown between booking-proof resends (anti-spam for a public route). */
export const RESEND_COOLDOWN_SECONDS = 60;

/** Seconds left before another resend is allowed (0 = allowed now). */
export function resendCooldownRemaining(
  lastNotifiedAt: Date | null,
  now: Date = new Date(),
  cooldownSeconds: number = RESEND_COOLDOWN_SECONDS
): number {
  if (!lastNotifiedAt) return 0;
  const elapsed = Math.floor((now.getTime() - lastNotifiedAt.getTime()) / 1000);
  // Clamp so clock skew can never extend the cooldown beyond its window.
  return Math.min(cooldownSeconds, Math.max(0, cooldownSeconds - elapsed));
}

export interface SendOrderNotificationsResult {
  targets: NotificationChannel[];
  results: DeliveryResult[];
}

/**
 * Sends the booking summary to the order's stored contacts. When `channel`
 * is omitted every contact on file is notified.
 */
export async function sendOrderNotifications(
  order: GuestOrderDto,
  options: { locale: Locale; channel?: NotificationChannel }
): Promise<SendOrderNotificationsResult> {
  const { locale, channel } = options;

  const targets: NotificationChannel[] = [];
  if (order.guest?.email && (channel == null || channel === "email")) {
    targets.push("email");
  }
  if (order.guest?.whatsapp && (channel == null || channel === "whatsapp")) {
    targets.push("whatsapp");
  }

  if (targets.length === 0) {
    return { targets, results: [] };
  }

  const [t, tBooking] = await Promise.all([
    getTranslations({ locale, namespace: "notifications" }),
    getTranslations({ locale, namespace: "booking" }),
  ]);

  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${order.date}T00:00:00`));

  const templateParams = {
    name: order.guest?.name?.trim() || t("guestFallbackName"),
    reference: order.reference,
    court: order.courtName ?? order.courtId,
    date: dateLabel,
    time: formatHourRange(
      locale,
      order.startHour,
      order.startHour + order.durationHours
    ),
    duration: tBooking(DURATION_KEYS[order.durationHours as 1 | 2 | 3]),
    total: formatIDR(order.totals.price),
  };

  const results = await Promise.all(
    targets.map((target) =>
      deliverNotification({
        channel: target,
        to:
          target === "email"
            ? (order.guest?.email as string)
            : (order.guest?.whatsapp as string),
        subject: t("emailSubject", templateParams),
        body:
          target === "email"
            ? t("emailBody", templateParams)
            : t("waBody", templateParams),
        reference: order.reference,
      })
    )
  );

  return { targets, results };
}
