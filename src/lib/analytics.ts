/**
 * GA4 event tracking helpers (PRD §2.4). Events are only sent when GA4 is
 * configured (`NEXT_PUBLIC_GA4_ID`); without it every call is a safe no-op.
 */
export const ANALYTICS_EVENTS = {
  bookAyo: "booking_ayo_click",
  whatsapp: "whatsapp_click",
  form: "form_click",
  email: "email_click",
  social: "social_click",
} as const;

export type AnalyticsEvent =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

/** Maps an anchor href to a CTA event name (pure, unit-testable). */
export function classifyAnchorClick(href: string): AnalyticsEvent | null {
  const value = href.toLowerCase();
  if (!value) return null;
  if (value.includes("ayo.co.id")) return ANALYTICS_EVENTS.bookAyo;
  if (value.includes("wa.me") || value.includes("api.whatsapp.com")) {
    return ANALYTICS_EVENTS.whatsapp;
  }
  if (value.includes("forms.gle") || value.includes("docs.google.com/forms")) {
    return ANALYTICS_EVENTS.form;
  }
  if (value.startsWith("mailto:")) return ANALYTICS_EVENTS.email;
  if (value.includes("instagram.com") || value.includes("tiktok.com")) {
    return ANALYTICS_EVENTS.social;
  }
  return null;
}

interface AnalyticsWindow {
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
}

/** Sends a GA4 event when the analytics runtime is available. */
export function trackEvent(
  name: AnalyticsEvent | string,
  params: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;
  const analyticsWindow = window as unknown as AnalyticsWindow;
  if (typeof analyticsWindow.gtag === "function") {
    analyticsWindow.gtag("event", name, params);
    return;
  }
  if (Array.isArray(analyticsWindow.dataLayer)) {
    analyticsWindow.dataLayer.push({ event: name, ...params });
  }
}
