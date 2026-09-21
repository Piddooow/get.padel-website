import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MapPin } from "lucide-react";
import {
  DaySchedule,
  type DayOption,
} from "@/components/schedule/day-schedule";
import { ButtonLink } from "@/components/ui/button-link";
import { routing } from "@/i18n/routing";
import { addDays, nextWeekendISO, toISODate } from "@/data/pricing";
import { site } from "@/data/site";
import { loadUiAvailability } from "@/lib/availability-ui";
import type {
  AvailabilityMeta,
  CourtAvailability,
} from "@/data/slots";

// Dates & slot availability are time-sensitive (real-time schedule) —
// render per request instead of freezing them at build time.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "schedule" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${resolved}/jadwal`,
      languages: {
        id: "/id/jadwal",
        en: "/en/jadwal",
        "x-default": "/id/jadwal",
      },
    },
  };
}

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("schedule");
  const tBooking = await getTranslations("booking");
  const now = new Date();
  const weekdayFormatter = new Intl.DateTimeFormat(locale, {
    weekday: "short",
  });
  const dayFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  });

  // Booking window: slots are open up to ~1 month ahead (PRD §8.4) — we show
  // the next 7 days on this page as mock data.
  const days: DayOption[] = Array.from({ length: 7 }, (_, index) => {
    const date = addDays(now, index);
    return {
      iso: toISODate(date),
      label:
        index === 0
          ? t("today")
          : index === 1
            ? t("tomorrow")
            : weekdayFormatter.format(date),
      sublabel: dayFormatter.format(date),
    };
  });

  // Real-time schedule per day — official AYO data only.
  const loaded = await Promise.all(
    days.map((day) => loadUiAvailability(day.iso))
  );
  const availabilityByDate: Record<string, CourtAvailability[]> = {};
  const metaByDate: Record<string, AvailabilityMeta> = {};
  days.forEach((day, index) => {
    availabilityByDate[day.iso] = loaded[index].availability;
    metaByDate[day.iso] = loaded[index].meta;
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <header className="max-w-2xl">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gp-olive/20 bg-card px-3 py-1.5 text-xs font-medium text-gp-olive">
          <MapPin className="size-3.5" aria-hidden="true" />
          {tBooking("venueName")}
        </p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          {t("bookingWindow")}
        </p>
      </header>

      <div className="mt-14">
        <DaySchedule
          days={days}
          defaultIso={days[0].iso}
          availabilityByDate={availabilityByDate}
          metaByDate={metaByDate}
          todayIso={toISODate(now)}
          tomorrowIso={toISODate(addDays(now, 1))}
          weekendIso={nextWeekendISO(now)}
        />
      </div>

      <div className="mt-8 flex flex-col items-center gap-3 text-center">
        <ButtonLink
          href={site.links.ayo}
          external
          size="lg"
          className="rounded-full px-6 font-semibold"
        >
          {t("ctaBook")}
        </ButtonLink>
        <p className="max-w-md text-xs text-muted-foreground">
          {t("bookingNote")}
        </p>
      </div>
    </section>
  );
}
