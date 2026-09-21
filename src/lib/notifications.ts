/**
 * Notification delivery service (PRD Fase 2: "Konfirmasi Email & WhatsApp").
 *
 * Transport layer only — callers render the localized message and pass it in.
 * Delivery is pluggable via environment variables:
 *
 * - WhatsApp: `WHATSAPP_API_URL` + `WHATSAPP_API_TOKEN` (WhatsApp Cloud API
 *   compatible: POST { messaging_product, to, type: "text", text }).
 * - Email: `EMAIL_API_URL` + `EMAIL_API_KEY` + `EMAIL_FROM`
 *   (Resend-compatible REST: POST { from, to, subject, text }).
 *
 * When a channel is not configured the message is not thrown away: delivery
 * degrades to a `fallback` result carrying a ready-to-use wa.me link (for
 * WhatsApp) so CS or the guest can still complete the confirmation manually.
 * PRD compliance: no payment data is sent or stored.
 */
import { normalizePhone } from "@/lib/guest-orders";

export type NotificationChannel = "email" | "whatsapp";

export interface OutboundMessage {
  channel: NotificationChannel;
  /** Email address or phone number (digits/+62 accepted for WhatsApp). */
  to: string;
  body: string;
  subject?: string;
  reference: string;
}

export type DeliveryStatus = "sent" | "failed" | "fallback";

export interface DeliveryResult {
  channel: NotificationChannel;
  status: DeliveryStatus;
  provider: string;
  detail?: string;
  /** wa.me link when delivery degraded to manual sending. */
  link?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^(\+?62|0)8\d{7,12}$/;

export interface DeliveryEnvironment {
  WHATSAPP_API_URL?: string;
  WHATSAPP_API_TOKEN?: string;
  EMAIL_API_URL?: string;
  EMAIL_API_KEY?: string;
  EMAIL_FROM?: string;
}

type FetchLike = (
  input: string,
  init?: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  }
) => Promise<{ ok: boolean; status: number }>;

function fallback(
  message: OutboundMessage,
  detail: string
): DeliveryResult {
  if (message.channel === "whatsapp") {
    const phone = normalizePhone(message.to)
      .replace(/^\+/, "")
      .replace(/^0/, "62");
    return {
      channel: "whatsapp",
      status: "fallback",
      provider: "wa.me",
      detail,
      link: `https://wa.me/${phone}?text=${encodeURIComponent(message.body)}`,
    };
  }
  return { channel: "email", status: "fallback", provider: "manual", detail };
}

/** Delivers one message. Never throws — failures are reported in the result. */
export async function deliverNotification(
  message: OutboundMessage,
  options: {
    env?: DeliveryEnvironment;
    fetchImpl?: FetchLike;
  } = {}
): Promise<DeliveryResult> {
  const env = options.env ?? (process.env as DeliveryEnvironment);
  const fetchImpl = options.fetchImpl ?? (fetch as unknown as FetchLike);

  if (message.channel === "whatsapp") {
    const normalized = normalizePhone(message.to);
    if (!PHONE_RE.test(normalized)) {
      return {
        channel: "whatsapp",
        status: "failed",
        provider: "validation",
        detail: `Invalid WhatsApp number "${message.to}".`,
      };
    }
    if (!env.WHATSAPP_API_URL || !env.WHATSAPP_API_TOKEN) {
      return fallback(message, "WhatsApp API is not configured.");
    }
    try {
      const response = await fetchImpl(env.WHATSAPP_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.WHATSAPP_API_TOKEN}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: normalized.replace(/^\+/, "").replace(/^0/, "62"),
          type: "text",
          text: { body: message.body },
        }),
      });
      return response.ok
        ? { channel: "whatsapp", status: "sent", provider: "whatsapp-cloud" }
        : {
            channel: "whatsapp",
            status: "failed",
            provider: "whatsapp-cloud",
            detail: `Provider responded ${response.status}.`,
          };
    } catch (error) {
      return {
        channel: "whatsapp",
        status: "failed",
        provider: "whatsapp-cloud",
        detail: error instanceof Error ? error.message : "Unknown error.",
      };
    }
  }

  // email
  if (!EMAIL_RE.test(message.to)) {
    return {
      channel: "email",
      status: "failed",
      provider: "validation",
      detail: `Invalid email "${message.to}".`,
    };
  }
  if (!env.EMAIL_API_URL || !env.EMAIL_API_KEY || !env.EMAIL_FROM) {
    return fallback(message, "Email API is not configured.");
  }
  try {
    const response = await fetchImpl(env.EMAIL_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.EMAIL_API_KEY}`,
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: message.to,
        subject: message.subject ?? `Booking ${message.reference}`,
        text: message.body,
      }),
    });
    return response.ok
      ? { channel: "email", status: "sent", provider: "email-api" }
      : {
          channel: "email",
          status: "failed",
          provider: "email-api",
          detail: `Provider responded ${response.status}.`,
        };
  } catch (error) {
    return {
      channel: "email",
      status: "failed",
      provider: "email-api",
      detail: error instanceof Error ? error.message : "Unknown error.",
    };
  }
}
