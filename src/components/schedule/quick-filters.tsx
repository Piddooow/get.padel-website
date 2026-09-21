"use client";

import { useTranslations } from "next-intl";
import {
  CalendarDays,
  CalendarRange,
  Check,
  House,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type QuickFilterKey = "today" | "tomorrow" | "weekend" | "indoor";

const TOGGLES = [
  { key: "today", icon: <Sun className="size-3.5" /> },
  { key: "tomorrow", icon: <CalendarDays className="size-3.5" /> },
  { key: "weekend", icon: <CalendarRange className="size-3.5" /> },
] as const;

/**
 * Quick filters (PRD Fase 1): Hari Ini / Besok / Weekend / Indoor.
 * `indoor` is informational — every court is indoor, so it is always on.
 */
export function QuickFilters({
  value,
  onChange,
  className,
}: {
  value: QuickFilterKey | null;
  onChange: (key: Exclude<QuickFilterKey, "indoor">) => void;
  className?: string;
}) {
  const t = useTranslations("filters");

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      {TOGGLES.map((item) => (
        <button
          key={item.key}
          type="button"
          aria-pressed={value === item.key}
          onClick={() => onChange(item.key)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
            value === item.key
              ? "border-gp-olive bg-gp-olive text-gp-light"
              : "border-gp-olive/20 bg-card text-gp-olive hover:border-gp-olive/40"
          )}
        >
          {item.icon}
          {t(item.key)}
        </button>
      ))}
      <span
        title={t("indoorNote")}
        className="inline-flex items-center gap-1.5 rounded-full border border-gp-rust/35 bg-gp-rust/10 px-3.5 py-2 text-sm font-medium text-gp-rust"
      >
        <House className="size-3.5" aria-hidden="true" />
        {t("indoor")}
        <Check className="size-3.5" aria-hidden="true" />
      </span>
    </div>
  );
}
