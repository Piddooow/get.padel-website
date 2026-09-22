"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarClock } from "lucide-react";
import { InstagramIcon } from "@/components/icons";
import { WhatsAppButton } from "@/components/help/whatsapp-button";
import { ButtonLink } from "@/components/ui/button-link";
import { site, whatsappLink } from "@/data/site";
import { getCountdown, type Countdown } from "@/lib/countdown";
import { cn } from "@/lib/utils";

export interface EventCardData {
  id: string;
  title: string;
  period: string;
  description: string;
  /** ISO datetime for announced upcoming events (drives the countdown). */
  startsAt: string | null;
}

type EventTab = "upcoming" | "archive";

/** Live countdown — mounted client-side to avoid hydration mismatches. */
function EventCountdown({ startsAt, title }: { startsAt: string; title: string }) {
  const t = useTranslations("programs");
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  useEffect(() => {
    const tick = () => setCountdown(getCountdown(startsAt));
    const timeout = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [startsAt]);

  if (!countdown || countdown.ended) return null;

  const units = [
    { key: "days", value: countdown.days, label: t("countdownDays") },
    { key: "hours", value: countdown.hours, label: t("countdownHours") },
    { key: "minutes", value: countdown.minutes, label: t("countdownMinutes") },
    { key: "seconds", value: countdown.seconds, label: t("countdownSeconds") },
  ];

  return (
    <div>
      <p className="sr-only">{t("countdownAria", { title })}</p>
      <dl aria-hidden="true" className="grid max-w-xs grid-cols-4 gap-2 text-center">
        {units.map((unit) => (
          <div
            key={unit.key}
            className="rounded-xl border border-gp-olive/15 bg-gp-olive/[0.03] px-2 py-2"
          >
            <dd className="font-heading text-lg font-bold tabular-nums text-gp-olive">
              {String(unit.value).padStart(2, "0")}
            </dd>
            <dt className="text-[11px] text-muted-foreground">{unit.label}</dt>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Turnamen & sosial: tabs for upcoming vs archive, with a live countdown for
 * announced events (PRD Fase 3). Classification happens on the server so the
 * lists stay accurate per request (`src/components/programs/events-section`).
 */
export function EventsTabs({
  upcoming,
  archive,
}: {
  upcoming: EventCardData[];
  archive: EventCardData[];
}) {
  const t = useTranslations("programs");
  const [tab, setTab] = useState<EventTab>("upcoming");

  const tabs: { key: EventTab; label: string; count: number }[] = [
    { key: "upcoming", label: t("eventsUpcomingTab"), count: upcoming.length },
    { key: "archive", label: t("eventsArchiveTab"), count: archive.length },
  ];

  const items = tab === "upcoming" ? upcoming : archive;

  return (
    <div>
      {/* Tabs */}
      <div
        role="tablist"
        aria-label={t("sectionEventsTitle")}
        className="flex flex-wrap gap-2"
      >
        {tabs.map((item) => {
          const active = tab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.key)}
              className={cn(
                "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors",
                active
                  ? "border-gp-olive bg-gp-olive text-gp-light"
                  : "border-gp-olive/20 bg-card text-gp-olive hover:border-gp-olive/40"
              )}
            >
              {item.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  active
                    ? "bg-white/15 text-gp-light"
                    : "bg-gp-olive/10 text-gp-olive"
                )}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Event list */}
      {items.length === 0 ? (
        <div className="mt-5 flex flex-col items-start gap-4 rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 sm:p-6">
          <span className="inline-flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CalendarClock className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-heading font-semibold">{t("eventsEmptyTitle")}</p>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              {t("eventsEmptyBody")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink
              href={site.links.instagram}
              external
              size="sm"
              className="rounded-full px-4 font-semibold"
            >
              <InstagramIcon className="size-4" aria-hidden="true" />
              {t("eventsEmptyCtaIg")}
            </ButtonLink>
            <WhatsAppButton
              label={t("eventsEmptyCtaWa")}
              variant="outline"
              size="sm"
              className="border-gp-olive/25 px-4 text-gp-olive hover:bg-gp-olive/5"
            />
          </div>
        </div>
      ) : (
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {items.map((event) => (
            <li
              key={event.id}
              className="flex flex-col rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 sm:p-6"
            >
              <p className="inline-flex w-fit items-center rounded-full border border-gp-olive/20 px-3 py-1 text-xs font-medium text-gp-olive">
                {event.period}
              </p>
              <h3 className="mt-3 font-heading text-base font-semibold">
                {event.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {event.description}
              </p>

              {event.startsAt && (
                <div className="mt-4">
                  <EventCountdown startsAt={event.startsAt} title={event.title} />
                </div>
              )}

              {event.startsAt && (
                <div className="mt-auto pt-4">
                  <ButtonLink
                    href={whatsappLink(
                      t("waEventMessage", { event: event.title })
                    )}
                    external
                    size="sm"
                    className="rounded-full px-4 font-semibold"
                  >
                    {t("eventsRegisterCta")}
                  </ButtonLink>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
