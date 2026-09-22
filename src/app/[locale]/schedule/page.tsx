import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Check, MapPin } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { site, whatsappLink } from "@/data/site";

/** Slot start hours: 06.00 through 21.00 (16 sessions of 60 minutes). */
const SLOT_START_HOURS = Array.from({ length: 16 }, (_, index) => 6 + index);

/** The two identical courts, with their own venue photos. */
const COURT_CARDS = [
  { name: "Court 1", image: "/images/court-1.jpg" },
  { name: "Court 2", image: "/images/court-2.jpg" },
] as const;

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
      canonical: `/${resolved}/schedule`,
      languages: {
        id: "/id/schedule",
        en: "/en/schedule",
        "x-default": "/id/schedule",
      },
    },
  };
}

/**
 * Schedule — informational page: court specs, opening hours, and the slot
 * system. It is NOT a reservation system and never shows availability or
 * booking status; every booking action hands off to the official AYO channel.
 */
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
  const tCommon = await getTranslations("common");

  const formatSlot = (hour: number) =>
    locale === "en"
      ? `${String(hour).padStart(2, "0")}:00`
      : `${String(hour).padStart(2, "0")}.00`;

  const sectionContainer =
    "mx-auto w-full max-w-6xl scroll-mt-20 px-4 sm:px-6 lg:px-8";

  const bookingPoints = [
    t("bookingPoint1"),
    t("bookingPoint2"),
    t("bookingPoint3"),
    t("bookingPoint4"),
  ];

  const slotRules = [
    t("slotRule1"),
    t("slotRule2"),
    t("slotRule3"),
    t("slotRule4"),
    t("slotRule5"),
  ];

  const relatedFacilities = [
    t("courtsFacility1"),
    t("courtsFacility2"),
    t("courtsFacility3"),
    t("courtsFacility4"),
    t("courtsFacility5"),
    t("courtsFacility6"),
  ];

  const slotFacts = [
    { label: t("slotFactDurationLabel"), value: t("slotFactDurationValue") },
    { label: t("slotFactCountLabel"), value: t("slotFactCountValue") },
    { label: t("slotFactFirstLabel"), value: t("slotFactFirstValue") },
    { label: t("slotFactLastLabel"), value: t("slotFactLastValue") },
  ];

  return (
    <>
      {/* 1. Intro */}
      <section className={`${sectionContainer} pt-12 lg:pt-16`}>
        <Reveal>
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-wide text-gp-rust uppercase">
              {t("eyebrow")}
            </p>
            <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {t("intro")}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <ButtonLink
                href={site.links.ayo}
                external
                size="lg"
                className="rounded-full px-5 font-semibold"
              >
                {t("ctaBook")}
              </ButtonLink>
              <Link
                href="/harga"
                className="inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-gp-olive underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-gp-olive/40 focus-visible:outline-none"
              >
                {t("ctaRates")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 2. Opening hours */}
      <section
        aria-labelledby="schedule-hours-title"
        className={`${sectionContainer} py-12 lg:py-16`}
      >
        <Reveal>
          <h2
            id="schedule-hours-title"
            className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {t("hoursTitle")}
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {t("hoursSubtitle")}
          </p>
          <div className="mt-6 min-w-0 max-w-full overflow-x-auto rounded-2xl bg-card ring-1 ring-gp-olive/10">
            <table className="w-full text-sm">
              <caption className="sr-only">{t("hoursTitle")}</caption>
              <tbody>
                <tr className="border-b border-gp-olive/10">
                  <th
                    scope="row"
                    className="px-4 py-4 text-left font-medium sm:px-5"
                  >
                    {t("hoursCourtsLabel")}
                  </th>
                  <td className="px-4 py-4 text-right sm:px-5 sm:text-left">
                    <span className="font-semibold">
                      {t("hoursCourtsValue")}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {t("hoursCourtsNote")}
                    </span>
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-4 py-4 text-left font-medium sm:px-5"
                  >
                    {t("hoursCafeLabel")}
                  </th>
                  <td className="px-4 py-4 text-right sm:px-5 sm:text-left">
                    <span className="font-semibold">
                      {t("hoursCafeValue")}
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {t("hoursCafeNote")}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* 3. Slot system */}
      <section
        aria-labelledby="schedule-slots-title"
        className={`${sectionContainer} pb-12 lg:pb-16`}
      >
        <Reveal>
          <h2
            id="schedule-slots-title"
            className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {t("slotsTitle")}
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {t("slotsSubtitle")}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-gp-olive/10 p-px sm:grid-cols-4">
            {slotFacts.map((fact) => (
              <div key={fact.label} className="bg-card px-4 py-5 sm:px-5">
                <dt className="text-xs font-semibold tracking-wide text-gp-olive/80 uppercase">
                  {fact.label}
                </dt>
                <dd className="font-heading mt-1 text-xl font-bold tracking-tight text-gp-olive tabular-nums">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <h3 className="font-heading text-lg font-bold tracking-tight">
                {t("slotListTitle")}
              </h3>
              <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {SLOT_START_HOURS.map((hour) => (
                  <li
                    key={hour}
                    className="rounded-lg bg-gp-olive/5 px-2 py-2 text-center text-sm font-medium text-gp-olive tabular-nums"
                  >
                    {formatSlot(hour)}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                {t("slotListNote")}
              </p>
            </div>

            <div>
              <h3 className="font-heading text-lg font-bold tracking-tight">
                {t("slotRulesTitle")}
              </h3>
              <ul className="mt-4 space-y-3">
                {slotRules.map((rule) => (
                  <li key={rule} className="flex gap-2.5 text-sm leading-relaxed">
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-gp-olive/60"
                      aria-hidden="true"
                    />
                    <span className="text-muted-foreground">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 4. Court specifications */}
      <section
        aria-labelledby="schedule-courts-title"
        className={`${sectionContainer} pb-12 lg:pb-16`}
      >
        <Reveal>
          <h2
            id="schedule-courts-title"
            className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {t("courtsTitle")}
          </h2>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {t("courtsSubtitle")}
          </p>

          <ul className="mt-6 grid gap-6 lg:grid-cols-2">
            {COURT_CARDS.map((court) => (
              <li
                key={court.name}
                className="overflow-hidden rounded-3xl bg-card ring-1 ring-gp-olive/10"
              >
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-gp-olive/5">
                  <Image
                    src={court.image}
                    alt={t("courtImageAlt", { name: court.name })}
                    fill
                    sizes="(min-width: 1024px) 560px, (min-width: 640px) 90vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="font-heading text-xl font-bold tracking-tight">
                    {court.name}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {t("courtsRowDescriptionValue")}
                  </p>
                  <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
                    <div>
                      <dt className="text-xs font-semibold tracking-wide text-gp-olive/70 uppercase">
                        {t("courtsRowType")}
                      </dt>
                      <dd className="mt-1 text-sm font-medium tabular-nums">
                        {t("courtsRowTypeValue")}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold tracking-wide text-gp-olive/70 uppercase">
                        {t("courtsRowSurface")}
                      </dt>
                      <dd className="mt-1 text-sm font-medium">
                        Certified Premium Turf
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold tracking-wide text-gp-olive/70 uppercase">
                        {t("courtsRowSession")}
                      </dt>
                      <dd className="mt-1 text-sm font-medium tabular-nums">
                        {t("courtsRowSessionValue")}
                      </dd>
                    </div>
                  </dl>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <ButtonLink
              href={site.links.ayo}
              external
              size="lg"
              className="rounded-full px-5 font-semibold"
            >
              {t("courtBookCta")}
            </ButtonLink>
          </div>

          <h3 className="font-heading mt-8 text-lg font-bold tracking-tight">
            {t("courtsFacilitiesTitle")}
          </h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {relatedFacilities.map((facility) => (
              <li key={facility} className="flex gap-2.5 text-sm">
                <Check
                  className="mt-0.5 size-4 shrink-0 text-gp-olive/60"
                  aria-hidden="true"
                />
                <span className="text-muted-foreground">{facility}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/lokasi"
            className="mt-5 inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-gp-olive underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-gp-olive/40 focus-visible:outline-none"
          >
            {t("courtsFacilitiesCta")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Reveal>
      </section>

      {/* 5. How booking works */}
      <section
        aria-labelledby="schedule-booking-title"
        className={`${sectionContainer} pb-12 lg:pb-16`}
      >
        <Reveal>
          <div className="rounded-3xl bg-card p-6 ring-1 ring-gp-olive/10 sm:p-10">
            <h2
              id="schedule-booking-title"
              className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t("bookingTitle")}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {t("bookingSubtitle")}
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {bookingPoints.map((point) => (
                <li key={point} className="flex gap-2.5 text-sm">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-gp-olive/60"
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground">{point}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs text-muted-foreground">
              {t("bookingNote")}
            </p>
            <div className="mt-6">
              <ButtonLink
                href={site.links.ayo}
                external
                size="lg"
                className="rounded-full px-5 font-semibold"
              >
                {t("ctaBook")}
              </ButtonLink>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 6. Additional information */}
      <section
        aria-labelledby="schedule-info-title"
        className={`${sectionContainer} pb-12 lg:pb-16`}
      >
        <Reveal>
          <h2
            id="schedule-info-title"
            className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
          >
            {t("infoTitle")}
          </h2>

          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="font-heading text-lg font-bold tracking-tight">
                {t("infoLocationTitle")}
              </h3>
              <address className="mt-3 text-sm leading-relaxed text-muted-foreground not-italic">
                {site.address.street}
                <br />
                {site.address.district}
                <br />
                {site.address.city}
                <br />
                {site.address.plusCode}
              </address>
              <p className="mt-2 text-sm text-muted-foreground">
                {t("infoLocationNote")}
              </p>
              <ButtonLink
                href={site.links.maps}
                external
                variant="outline"
                size="lg"
                className="mt-4 rounded-full border-gp-olive/25 px-5 font-semibold text-gp-olive hover:bg-gp-olive/5"
              >
                <MapPin className="size-4" aria-hidden="true" />
                {t("infoLocationCta")}
              </ButtonLink>
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="font-heading text-lg font-bold tracking-tight">
                  {t("infoGearTitle")}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t("infoGearBody")}
                </p>
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold tracking-tight">
                  {t("infoRulesTitle")}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t("infoRulesBody")}
                </p>
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold tracking-tight">
                  {t("infoPrepareTitle")}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {t("infoPrepareBody")}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-gp-olive/10 pt-8">
            <h3 className="font-heading text-lg font-bold tracking-tight">
              {t("infoContactTitle")}
            </h3>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <ButtonLink
                href={whatsappLink(tCommon("waMessage"))}
                external
                variant="outline"
                size="lg"
                className="rounded-full border-gp-olive/25 px-5 font-semibold text-gp-olive hover:bg-gp-olive/5"
              >
                <WhatsAppIcon className="size-4" aria-hidden="true" />
                {t("infoContactWa")} {site.contact.whatsappDisplay}
              </ButtonLink>
              <a
                href={`mailto:${site.contact.emailEvent}`}
                className="inline-flex h-11 items-center rounded-full px-4 text-sm font-semibold text-gp-olive underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-gp-olive/40 focus-visible:outline-none"
              >
                {t("infoContactEmail")} {site.contact.emailEvent}
              </a>
            </div>
          </div>
        </Reveal>
      </section>

      {/* 7. Closing CTA */}
      <section
        aria-labelledby="schedule-cta-title"
        className={`${sectionContainer} pb-16 lg:pb-20`}
      >
        <Reveal>
          <div className="flex flex-col items-center gap-3 text-center">
            <h2
              id="schedule-cta-title"
              className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t("closingTitle")}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {t("closingBody")}
            </p>
            <ButtonLink
              href={site.links.ayo}
              external
              size="lg"
              className="mt-1 rounded-full px-6 font-semibold"
            >
              {t("ctaBook")}
            </ButtonLink>
          </div>
        </Reveal>
      </section>
    </>
  );
}
