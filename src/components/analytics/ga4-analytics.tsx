"use client";

import Script from "next/script";
import { useConsent } from "@/lib/consent";

/**
 * GA4 loader — renders only when `NEXT_PUBLIC_GA4_ID` is configured AND the
 * visitor accepted analytics cookies (PRD §2.4 / §7).
 */
export function Ga4Analytics() {
  const measurementId = process.env.NEXT_PUBLIC_GA4_ID;
  const consent = useConsent();
  if (!measurementId || consent !== "accepted") return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
