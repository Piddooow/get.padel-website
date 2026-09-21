"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AvailabilitySource } from "@/components/schedule/availability-source";
import { CourtSlotCard } from "@/components/schedule/court-slot-card";
import { EmptySlotsNotice } from "@/components/schedule/empty-slots-notice";
import { UnavailableNotice } from "@/components/schedule/unavailable-notice";
import { QuickFilters } from "@/components/schedule/quick-filters";
import { ScheduleLegend } from "@/components/schedule/schedule-legend";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import { summarizeAvailability } from "@/lib/slot-summary";
import type { AvailabilityMeta, CourtAvailability } from "@/data/slots";

type Filter = "today" | "tomorrow" | "weekend";

interface AvailabilitySectionProps {
  /** Server-loaded availability per quick filter (database/AYO-backed). */
  availability: Record<Filter, CourtAvailability[]>;
  meta: Record<Filter, AvailabilityMeta>;
}

/** Homepage preview of today's/tomorrow's/weekend slot availability. */
export function AvailabilitySection({
  availability,
  meta,
}: AvailabilitySectionProps) {
  const t = useTranslations("availability");
  const tFilters = useTranslations("filters");
  const locale = useLocale();
  const [filter, setFilter] = useState<Filter>("today");

  const activeAvailability = availability[filter];
  const summary = useMemo(
    () => summarizeAvailability(activeAvailability),
    [activeAvailability]
  );

  const title =
    filter === "today"
      ? t("titleToday")
      : filter === "tomorrow"
        ? t("titleTomorrow")
        : t("titleWeekend");

  return (
    <section
      id="jadwal"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
    >
      <Reveal>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {title}
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>

          {/* Quick filters */}
          <QuickFilters
            value={filter}
            onChange={(key) => setFilter(key)}
          />
        </div>
      </Reveal>

      <p className="mt-3 text-xs text-muted-foreground">{tFilters("indoorNote")}</p>
      <AvailabilitySource meta={meta[filter]} className="mt-2" />

      {meta[filter].dataSource === "unavailable" ? (
        <div className="mt-6">
          <UnavailableNotice reason={meta[filter].reason} />
        </div>
      ) : (
        <>
          <ScheduleLegend className="mt-4" />

          {/* Courts */}
          {summary.availableSlots === 0 ? (
            <div className="mt-6">
              <EmptySlotsNotice />
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {activeAvailability.map((item, index) => (
                <Reveal key={item.court.id} delay={index * 120}>
                  <CourtSlotCard availability={item} />
                </Reveal>
              ))}
            </div>
          )}
        </>
      )}

      <Reveal delay={100}>
        <div className="mt-8 text-center">
          <ButtonLink
            href={`/${locale}/jadwal`}
            size="lg"
            className="rounded-full px-6 font-semibold"
          >
            {t("seeAll")}
          </ButtonLink>
        </div>
      </Reveal>
    </section>
  );
}
