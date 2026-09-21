"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Cookie } from "lucide-react";
import { setConsent, useConsent } from "@/lib/consent";

/**
 * Cookie consent prompt. Shown until the visitor chooses; analytics stays off
 * unless "Accept all" is picked. Rendered client-side only so the server HTML
 * never flickers a banner for visitors who already decided.
 */
export function CookieConsent() {
  const t = useTranslations("cookies");
  const consent = useConsent();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!mounted || consent !== null) return null;

  return (
    <div
      role="region"
      aria-label={t("title")}
      className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 mx-auto max-w-md rounded-2xl border border-gp-olive/20 bg-card p-4 shadow-lg lg:inset-x-auto lg:left-4 lg:bottom-4 lg:max-w-sm"
    >
      <p className="flex items-center gap-2 font-heading text-sm font-semibold">
        <Cookie className="size-4 text-gp-rust" aria-hidden="true" />
        {t("title")}
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        {t("body")}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setConsent("accepted")}
          className="inline-flex h-9 items-center rounded-full bg-gp-rust px-4 text-xs font-semibold text-gp-light transition-colors hover:bg-gp-rust/90"
        >
          {t("accept")}
        </button>
        <button
          type="button"
          onClick={() => setConsent("essential")}
          className="inline-flex h-9 items-center rounded-full border border-gp-olive/25 px-4 text-xs font-semibold text-gp-olive transition-colors hover:bg-gp-olive/5"
        >
          {t("decline")}
        </button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{t("note")}</p>
    </div>
  );
}
