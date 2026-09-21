"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import { classifyAnchorClick, trackEvent } from "@/lib/analytics";
import { hasAnalyticsConsent } from "@/lib/consent";

/**
 * Delegated CTA click tracking (PRD §2.4): all outbound CTAs (AYO booking,
 * WhatsApp, forms, email, socials) are classified and sent to GA4 without
 * touching each button. No-ops when GA4 is not configured.
 */
export function CtaClickTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // Analytics only runs with the visitor's consent.
      if (!hasAnalyticsConsent()) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest?.("a[href]");
      if (!anchor) return;

      const href = anchor.getAttribute("href") ?? "";
      const name = classifyAnchorClick(href);
      if (!name) return;

      const linkUrl = (anchor as HTMLAnchorElement).href;
      const linkText = (anchor.textContent ?? "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);

      // GA4 (when configured) uses snake_case params.
      trackEvent(name, {
        link_url: linkUrl,
        link_text: linkText,
        page_path: pathname,
      });

      // … plus the first-party analytics sink (fire-and-forget, keepalive).
      try {
        void fetch("/api/analytics/events", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            name,
            pagePath: pathname,
            linkUrl,
            linkText,
          }),
          keepalive: true,
        }).catch(() => undefined);
      } catch {
        // Never block navigation because of analytics.
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname]);

  return null;
}
