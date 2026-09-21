"use client";

import { useLocale, useTranslations } from "next-intl";
import type { AvailabilityMeta } from "@/data/slots";
import { cn } from "@/lib/utils";

function formatTime(locale: string, iso: string): string {
  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * Provenance line under the schedule: real-time AYO statuses (with the last
 * sync time) or the local estimate while the AYO integration is inactive.
 */
export function AvailabilitySource({
  meta,
  className,
}: {
  meta: AvailabilityMeta;
  className?: string;
}) {
  const t = useTranslations("availability");
  const locale = useLocale();
  const live = meta.dataSource === "ayo";

  return (
    <p
      data-source={meta.dataSource}
      className={cn("inline-flex items-center gap-1.5 text-xs", className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-2 rounded-full",
          live ? "bg-gp-olive" : "bg-muted-foreground/40"
        )}
      />
      <span
        className={cn(live ? "font-medium text-gp-olive" : "text-muted-foreground")}
      >
        {live && meta.syncedAt
          ? t("dataSourceAyo", { time: formatTime(locale, meta.syncedAt) })
          : t("dataSourceUnavailable")}
      </span>
    </p>
  );
}
