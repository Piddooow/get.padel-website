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
 * ID | EN switcher — keeps the current page (next-intl renders the same route
 * under the other locale prefix). The switch plays the same curtain transition
 * as every other navigation: the curtain lives outside React, so it survives
 * the locale-layout remount.
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
        "inline-flex h-9 items-center rounded-full border border-current/25 p-0.5",
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
              "inline-flex h-full items-center rounded-full px-2 text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:ring-2 focus-visible:ring-current/60 focus-visible:outline-none min-[360px]:px-2.5",
              active
                ? "bg-gp-light text-gp-olive dark:bg-gp-light/15 dark:text-gp-light"
                : "text-current/75 hover:text-current"
            )}
          >
            {item.toUpperCase()}
          </Link>
        );
      })}
    </div>
  );
}
