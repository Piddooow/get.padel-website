"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { discountPercent, formatHourRange, formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { RateRow } from "@/lib/ui-content";

type DayTab = "weekday" | "weekend";

/** Peak & off-peak rate card (PRD Fase 2) with strike-through prices. */
export function RateTable({ rows }: { rows: Record<DayTab, RateRow[]> }) {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const [tab, setTab] = useState<DayTab>("weekday");

  const group = (peak: boolean) =>
    rows[tab].filter((row) => row.peak === peak);

  const renderRows = (items: RateRow[]) =>
    items.map(({ hour, price, strike }) => {
      const discount = discountPercent(price, strike);
      return (
        <tr
          key={hour}
          className="border-b border-gp-olive/10 last:border-b-0"
        >
          <th
            scope="row"
            className="px-4 py-2.5 text-left text-sm font-medium tabular-nums"
          >
            {formatHourRange(locale, hour, hour + 1)}
          </th>
          <td className="px-4 py-2.5 text-right text-sm font-semibold text-primary tabular-nums">
            {formatIDR(price)}
          </td>
          <td className="px-4 py-2.5 text-right text-xs text-muted-foreground tabular-nums">
            <s className="opacity-70">{formatIDR(strike)}</s>
            {discount > 0 && (
              <span className="ml-1.5 font-semibold text-gp-rust">
                −{discount}%
              </span>
            )}
          </td>
        </tr>
      );
    });

  const groups = [
    {
      key: "off-peak",
      label: t("offPeakBadge"),
      peak: false,
      className: "text-muted-foreground",
    },
    {
      key: "peak",
      label: t("peakBadge"),
      peak: true,
      className: "text-gp-rust",
    },
  ];

  return (
    <div>
      {/* Day tabs */}
      <div className="flex flex-wrap gap-2">
        {(["weekday", "weekend"] as const).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
              tab === key
                ? "border-gp-olive bg-gp-olive text-gp-light"
                : "border-gp-olive/20 bg-card text-gp-olive hover:border-gp-olive/40"
            )}
          >
            {t(key === "weekday" ? "tabWeekday" : "tabWeekend")}
          </button>
        ))}
      </div>

      {/* Rate table */}
      <div className="mt-5 overflow-hidden rounded-2xl bg-card ring-1 ring-gp-olive/10">
        <table className="w-full text-sm">
          <caption className="sr-only">
            {t("rateTitle")} — {t(tab === "weekday" ? "tabWeekday" : "tabWeekend")}
          </caption>
          <thead>
            <tr className="border-b border-gp-olive/10 text-xs tracking-wide text-muted-foreground uppercase">
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                {t("columnSlot")}
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                {t("columnPrice")}
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                {t("columnNormal")}
              </th>
            </tr>
          </thead>
          {groups.map((groupItem) => (
            <tbody key={groupItem.key}>
              <tr className="bg-muted/50">
                <th scope="colgroup" colSpan={3} className="px-4 py-2 text-left">
                  <Badge
                    variant="outline"
                    className={cn(
                      "border-gp-olive/20",
                      groupItem.className
                    )}
                  >
                    {groupItem.label}
                  </Badge>
                </th>
              </tr>
              {renderRows(group(groupItem.peak))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}
