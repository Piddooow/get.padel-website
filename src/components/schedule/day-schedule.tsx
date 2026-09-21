"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AvailabilitySource } from "@/components/schedule/availability-source";
import { CourtSlotCard } from "@/components/schedule/court-slot-card";
import { EmptySlotsNotice } from "@/components/schedule/empty-slots-notice";
import { UnavailableNotice } from "@/components/schedule/unavailable-notice";
import {
  QuickFilters,
  type QuickFilterKey,
} from "@/components/schedule/quick-filters";
import { ScheduleLegend } from "@/components/schedule/schedule-legend";
import { summarizeAvailability } from "@/lib/slot-summary";
import type { AvailabilityMeta, CourtAvailability } from "@/data/slots";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface DayOption {
  iso: string;
  label: string;
  sublabel: string;
}

/**
 * Full-day slot schedule (database/AYO-backed): pick a date, see the open-slot
 * summary and both courts' hourly slots with availability and prices.
 */
export function DaySchedule({
  days,
  defaultIso,
  availabilityByDate,
  metaByDate,
  todayIso,
  tomorrowIso,
  weekendIso,
}: {
  days: DayOption[];
  defaultIso: string;
  availabilityByDate: Record<string, CourtAvailability[]>;
  metaByDate: Record<string, AvailabilityMeta>;
  todayIso: string;
  tomorrowIso: string;
  weekendIso: string;
}) {
  const t = useTranslations("schedule");
  const [selected, setSelected] = useState(defaultIso);

  const availability = useMemo(
    () => availabilityByDate[selected] ?? [],
    [availabilityByDate, selected]
  );
  const summary = useMemo(
    () => summarizeAvailability(availability),
    [availability]
  );

  const quickFilterValue: QuickFilterKey | null =
    selected === todayIso
      ? "today"
      : selected === tomorrowIso
        ? "tomorrow"
        : selected === weekendIso
          ? "weekend"
          : null;

  function handleQuickFilter(key: Exclude<QuickFilterKey, "indoor">) {
    setSelected(
      key === "today" ? todayIso : key === "tomorrow" ? tomorrowIso : weekendIso
    );
  }

  return (
    <div>
      {/* Quick filters */}
      <QuickFilters
        value={quickFilterValue}
        onChange={handleQuickFilter}
        className="mb-3"
      />

      {/* Date picker */}
      <div
        role="tablist"
        aria-label={t("dateLabel")}
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
      >
        {days.map((day) => {
          const active = selected === day.iso;
          return (
            <button
              key={day.iso}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelected(day.iso)}
              className={cn(
                "min-w-[78px] shrink-0 rounded-xl border px-3 py-2 text-center transition-colors",
                active
                  ? "border-gp-olive bg-gp-olive text-gp-light"
                  : "border-gp-olive/20 bg-card text-gp-olive hover:border-gp-olive/40"
              )}
            >
              <span className="block text-sm font-semibold">{day.label}</span>
              <span
                className={cn(
                  "block text-[11px]",
                  active ? "text-gp-light/80" : "text-muted-foreground"
                )}
              >
                {day.sublabel}
              </span>
            </button>
          );
        })}
      </div>

      {metaByDate[selected]?.dataSource === "unavailable" ? (
        <>
          <AvailabilitySource
            meta={metaByDate[selected]}
            className="mt-3"
          />
          <div className="mt-4">
            <UnavailableNotice reason={metaByDate[selected]?.reason} />
          </div>
        </>
      ) : (
        <>
      {/* Open-slot summary */}
      <dl
        aria-live="polite"
        className="mt-5 grid grid-cols-3 gap-2 sm:gap-3"
      >
        <div className="rounded-xl bg-card p-4 ring-1 ring-gp-olive/10">
          <dd className="font-heading text-lg font-bold tabular-nums text-rr-green sm:text-xl">
            {summary.availableSlots}
            <span className="text-sm font-semibold text-muted-foreground">
              /{summary.totalSlots - summary.pastSlots}
            </span>
          </dd>
          <dt className="text-[11px] text-muted-foreground sm:text-xs">
            {t("summarySlotsLabel")}
          </dt>
        </div>
        <div className="rounded-xl bg-card p-4 ring-1 ring-gp-olive/10">
          <dd className="font-heading text-lg font-bold tabular-nums text-primary sm:text-xl">
            {summary.minPrice != null ? formatIDR(summary.minPrice) : "—"}
          </dd>
          <dt className="text-[11px] text-muted-foreground sm:text-xs">
            {t("summaryFromLabel")}
          </dt>
        </div>
        <div className="rounded-xl bg-card p-4 ring-1 ring-gp-olive/10">
          <dd className="font-heading text-lg font-bold tabular-nums text-gp-olive sm:text-xl">
            {summary.bookedSlots}
          </dd>
          <dt className="text-[11px] text-muted-foreground sm:text-xs">
            {t("summaryBookedLabel")}
          </dt>
        </div>
      </dl>

      <AvailabilitySource
        meta={metaByDate[selected] ?? { dataSource: "unavailable", syncedAt: null }}
        className="mt-3"
      />

      <ScheduleLegend className="mt-4" />

      {summary.availableSlots === 0 ? (
        <div className="mt-6">
          <EmptySlotsNotice />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {availability.map((item) => (
            <CourtSlotCard key={item.court.id} availability={item} />
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}
