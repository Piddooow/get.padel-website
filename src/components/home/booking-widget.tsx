"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarCheck, Search } from "lucide-react";
import { UnavailableNotice } from "@/components/schedule/unavailable-notice";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { site } from "@/data/site";
import {
  addDays,
  FIRST_HOUR,
  LAST_HOUR,
  toISODate,
} from "@/data/pricing";
import { formatHour, formatHourRange, formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";

const DURATIONS = [1, 2, 3] as const;

interface SearchQuery {
  date: string;
  hour: number;
  duration: number;
}

interface SearchResult {
  courtId: string;
  courtName: string;
  available: boolean;
  timeLabel: string;
  total: number;
  strikeTotal: number;
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-xs font-semibold tracking-wide text-muted-foreground uppercase"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

interface AvailabilityMatchDto {
  courtId: string;
  name: string;
  duration: number;
  available: boolean;
  totalPrice: number;
  strikeTotal: number;
}

export function BookingWidget({ defaultDate }: { defaultDate: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("18");
  const [duration, setDuration] = useState<number>(1);
  const [query, setQuery] = useState<SearchQuery | null>(null);
  const [result, setResult] = useState<{
    key: string;
    rows: SearchResult[];
    unavailable: boolean;
  } | null>(null);

  const queryKey = query
    ? `${query.date}|${query.hour}|${query.duration}`
    : null;
  const searching = queryKey != null && result?.key !== queryKey;
  const results = result?.rows ?? null;
  const unavailable = result?.unavailable ?? false;

  // Search runs against the live availability API (official AYO feed only).
  useEffect(() => {
    if (!query || !queryKey) return;
    let cancelled = false;
    const { date, hour, duration } = query;

    (async () => {
      try {
        const response = await fetch(
          `/api/availability?date=${date}&hour=${hour}&duration=${duration}`,
          { cache: "no-store" }
        );
        const data = (await response.json()) as {
          dataSource?: string;
          matches?: AvailabilityMatchDto[];
        };
        if (cancelled) return;
        setResult({
          key: queryKey,
          unavailable: data.dataSource !== "ayo",
          rows: (data.matches ?? []).map((match) => ({
            courtId: match.courtId,
            courtName: match.name,
            available: match.available,
            timeLabel: formatHourRange(locale, hour, hour + duration),
            total: match.totalPrice,
            strikeTotal: match.strikeTotal,
          })),
        });
      } catch {
        if (cancelled) return;
        setResult({ key: queryKey, unavailable: true, rows: [] });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query, queryKey, locale]);

  const maxDate = toISODate(
    addDays(new Date(`${defaultDate}T00:00:00`), 30)
  );

  const selectableHours = useMemo(
    () =>
      Array.from(
        { length: LAST_HOUR - FIRST_HOUR + 1 },
        (_, index) => FIRST_HOUR + index
      ).filter((hour) => hour <= LAST_HOUR - (duration - 1)),
    [duration]
  );

  const availableCount = results?.filter((result) => result.available).length;

  function handleDurationChange(value: string) {
    const next = Number(value);
    setDuration(next);
    // Keep the start time valid so the session ends by 22.00.
    setTime((current) =>
      String(Math.min(Number(current), LAST_HOUR - (next - 1)))
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const hour = Math.min(Number(time), LAST_HOUR - (duration - 1));
    setQuery({ date, hour, duration });
  }

  return (
    <div className="rounded-2xl bg-card p-5 text-foreground shadow-xl ring-1 ring-gp-olive/10 sm:p-6">
      <h2 className="font-heading text-lg font-semibold">{t("booking.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("booking.subtitle")}
      </p>

      <form onSubmit={handleSubmit} className="mt-5 grid gap-3.5 sm:grid-cols-2">
        <Field label={t("booking.venue")} className="sm:col-span-2">
          <div className="flex h-11 items-center rounded-lg border border-input bg-muted/40 px-3 text-sm font-medium">
            {t("booking.venueName")}
          </div>
        </Field>

        <Field label={t("booking.date")} htmlFor="booking-date">
          <Input
            id="booking-date"
            type="date"
            value={date}
            min={defaultDate}
            max={maxDate}
            onChange={(event) => setDate(event.target.value)}
            className="h-11 bg-background"
            required
          />
        </Field>

        <Field label={t("booking.time")} htmlFor="booking-time">
          <NativeSelect
            id="booking-time"
            value={time}
            onChange={(event) => setTime(event.target.value)}
          >
            {selectableHours.map((hour) => (
              <option key={hour} value={String(hour)}>
                {formatHour(locale, hour)}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field label={t("booking.duration")} htmlFor="booking-duration">
          <NativeSelect
            id="booking-duration"
            value={String(duration)}
            onChange={(event) => handleDurationChange(event.target.value)}
          >
            {DURATIONS.map((value) => (
              <option key={value} value={String(value)}>
                {t(`booking.duration${value}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <div className="flex items-end">
          <Button
            type="submit"
            size="lg"
            className="h-11 w-full rounded-full font-semibold"
          >
            <Search className="size-4" />
            {t("booking.search")}
          </Button>
        </div>
      </form>

      {/* Live search results */}
      {query && searching && (
        <p role="status" className="mt-4 text-xs text-muted-foreground">
          {t("booking.loading")}
        </p>
      )}

      {query && !searching && unavailable && (
        <div className="mt-4">
          <UnavailableNotice reason="not_synced" />
        </div>
      )}

      {query && !searching && !unavailable && results && (
        <div
          aria-live="polite"
          className="mt-4 rounded-xl border border-gp-olive/15 bg-muted/40 p-3"
        >
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t("booking.resultsTitle")} ·{" "}
            {new Intl.DateTimeFormat(locale, {
              day: "numeric",
              month: "short",
            }).format(new Date(`${query.date}T00:00:00`))}{" "}
            ·{" "}
            {availableCount === 0
              ? t("booking.noResultsShort")
              : t("booking.resultsCount", { count: availableCount ?? 0 })}
          </p>

          <ul className="mt-2 space-y-2">
            {results.map((result) => (
              <li
                key={result.courtId}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg bg-card px-3 py-2.5 ring-1 ring-gp-olive/10",
                  !result.available && "opacity-70"
                )}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">
                    {result.courtName}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {result.timeLabel}
                  </p>
                </div>

                {result.available ? (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">
                        {formatIDR(result.total)}
                      </p>
                      {result.strikeTotal > result.total && (
                        <s className="text-[11px] text-muted-foreground">
                          {formatIDR(result.strikeTotal)}
                        </s>
                      )}
                    </div>
                    <ButtonLink
                      href={`/${locale}/pesan?date=${query.date}&court=${result.courtId}&hour=${query.hour}&duration=${query.duration}`}
                      size="sm"
                      className="rounded-full font-semibold"
                      aria-label={`${t("availability.book")} ${result.courtName} ${result.timeLabel}`}
                    >
                      <CalendarCheck className="size-3.5" />
                      {t("availability.book")}
                    </ButtonLink>
                  </div>
                ) : (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                    {t("availability.booked")}
                  </span>
                )}
              </li>
            ))}
          </ul>

          <p className="mt-3 text-xs text-muted-foreground">
            {t("booking.note")}{" "}
            <a
              href={site.links.ayo}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {t("availability.seeAll")}
            </a>
          </p>
        </div>
      )}

      {!query && (
        <p className="mt-4 text-xs text-muted-foreground">{t("booking.note")}</p>
      )}
    </div>
  );
}
