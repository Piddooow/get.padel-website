"use client";

import type { MouseEvent } from "react";
import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LANGUAGE_NAMES: Record<(typeof routing.locales)[number], string> = {
  id: "Bahasa Indonesia",
  en: "English",
};

/**
 * ID | EN switch — one segmented pill (not two separate buttons), sized like
 * the other header controls. Keeps the current page; next-intl renders the
 * same route under the other locale prefix. The switch plays the same curtain
 * transition as every other navigation: the curtain lives outside React, so it
 * survives the locale-layout remount.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();

  const guardActiveLocale = (
    event: MouseEvent<HTMLAnchorElement>,
    targetLocale: (typeof routing.locales)[number]
  ) => {
    // Clicking the active locale is a no-op (never play the curtain for it).
    if (targetLocale === locale) {
      event.preventDefault();
    }
  };

  return (
    <div
      role="group"
      aria-label="Language / Bahasa"
      className={cn(
        "inline-flex h-11 shrink-0 items-center rounded-full border border-current/25",
        className
      )}
    >
      {routing.locales.map((item) => {
        const active = item === locale;
        return (
          <Link
            key={item}
            href={pathname}
            locale={item}
            lang={item}
            hrefLang={item}
            onClick={(event) => guardActiveLocale(event, item)}
            aria-label={LANGUAGE_NAMES[item]}
            aria-current={active ? "true" : undefined}
            className={cn(
              "inline-flex h-full min-w-11 items-center justify-center rounded-full px-3.5 text-xs font-semibold uppercase tracking-wide transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-current/60 focus-visible:outline-none",
              active
                ? "bg-gp-light text-gp-olive shadow-sm"
                : "text-current/70 hover:bg-white/10 hover:text-current"
            )}
          >
            {item.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
