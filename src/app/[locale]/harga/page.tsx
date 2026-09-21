import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookingSteps, PaymentInfo } from "@/components/pricing/booking-info";
import { PromoCodes } from "@/components/pricing/promo-codes";
import { PricingTiers } from "@/components/pricing/pricing-tiers";
import { PromoCarousel } from "@/components/pricing/promo-carousel";
import { PromoList } from "@/components/pricing/promo-list";
import { RateTable } from "@/components/pricing/rate-table";
import { WhatsAppIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import { routing } from "@/i18n/routing";
import { site, whatsappLink } from "@/data/site";
import {
  loadPricingTiers,
  loadPromos,
  loadRateCard,
} from "@/lib/ui-content";

// Content comes from the database — refresh the rendered page periodically.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "pricing" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${resolved}/harga`,
      languages: {
        id: "/id/harga",
        en: "/en/harga",
        "x-default": "/id/harga",
      },
    },
  };
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("pricing");
  const tCommon = await getTranslations("common");

  // Database-backed rate card & promos (with mock fallback).
  const [rateCard, tiers, promos] = await Promise.all([
    loadRateCard(),
    loadPricingTiers(),
    loadPromos(locale),
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      {/* Page intro */}
      <Reveal>
        <header className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-gp-olive/20 bg-card px-3.5 py-1.5 text-xs font-semibold tracking-wide text-gp-olive uppercase">
            {t("eyebrow")}
          </span>
          <h1 className="font-heading mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ButtonLink
              href={site.links.ayo}
              external
              size="lg"
              className="rounded-full px-6 font-semibold"
            >
              {tCommon("bookNow")}
            </ButtonLink>
            <ButtonLink
              href={whatsappLink(tCommon("waMessage"))}
              external
              variant="outline"
              size="lg"
              className="rounded-full border-gp-olive/25 px-6 font-semibold text-gp-olive hover:bg-gp-olive/5"
            >
              <WhatsAppIcon className="size-4" aria-hidden="true" />
              {tCommon("whatsapp")}
            </ButtonLink>
            <ButtonLink
              href={`/${locale}/jadwal`}
              variant="outline"
              size="lg"
              className="rounded-full border-gp-olive/25 px-6 font-semibold text-gp-olive hover:bg-gp-olive/5"
            >
              {t("seeSchedule")}
            </ButtonLink>
          </div>
        </header>
      </Reveal>

      <div className="mt-14 space-y-16 lg:mt-16 lg:space-y-20">
        {/* Tariff tiers (animated) */}
        <Reveal>
          <PricingTiers tiers={tiers} />
        </Reveal>

        {/* Rate card */}
        <Reveal>
          <section aria-labelledby="rates-title">
            <h2
              id="rates-title"
              className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t("rateTitle")}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {t("rateSubtitle")}
            </p>
            <div className="mt-6">
              <RateTable rows={rateCard} />
            </div>
            <div className="mt-5 space-y-1.5 text-xs text-muted-foreground">
              <p className="font-semibold tracking-wide uppercase">
                {t("noteTitle")}
              </p>
              <p>• {t("rateNoteFavorite")}</p>
              <p>• {t("rateNoteNonEvent")}</p>
            </div>
          </section>
        </Reveal>

        {/* Poster carousel */}
        <Reveal>
          <section aria-labelledby="promos-title">
            <h2
              id="promos-title"
              className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t("promoTitle")}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {t("promoSubtitle")}
            </p>
            <div className="mt-6">
              <PromoCarousel />
            </div>
          </section>
        </Reveal>

        {/* Promo detail & terms */}
        <Reveal>
          <section aria-labelledby="promo-list-title">
            <h2
              id="promo-list-title"
              className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t("promoListTitle")}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {t("promoListSubtitle")}
            </p>
            <div className="mt-6">
              <PromoList promos={promos} />
            </div>
          </section>
        </Reveal>

        {/* Promo codes & validity */}
        <Reveal>
          <section aria-labelledby="promo-codes-title">
            <h2
              id="promo-codes-title"
              className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t("promoCodeTitle")}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {t("promoCodeSubtitle")}
            </p>
            <div className="mt-6">
              <PromoCodes promos={promos} />
            </div>
          </section>
        </Reveal>

        {/* Booking flow */}
        <Reveal>
          <section aria-labelledby="booking-title">
            <h2
              id="booking-title"
              className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t("bookingTitle")}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {t("bookingSubtitle")}
            </p>
            <div className="mt-6">
              <BookingSteps />
            </div>
          </section>
        </Reveal>

        {/* Payments, membership, refund */}
        <Reveal>
          <PaymentInfo />
        </Reveal>

        {/* Closing CTA */}
        <Reveal>
          <div className="flex flex-col items-center gap-3 text-center">
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              {t("ctaTitle")}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {t("ctaBody")}
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink
                href={site.links.ayo}
                external
                size="lg"
                className="rounded-full px-6 font-semibold"
              >
                {tCommon("bookNow")}
              </ButtonLink>
              <ButtonLink
                href={whatsappLink(tCommon("waMessage"))}
                external
                variant="outline"
                size="lg"
                className="rounded-full border-gp-olive/25 px-6 font-semibold text-gp-olive hover:bg-gp-olive/5"
              >
                <WhatsAppIcon className="size-4" aria-hidden="true" />
                {tCommon("whatsapp")}
              </ButtonLink>
            </div>
            <p className="text-xs text-muted-foreground">
              {tCommon("openDaily")} · {tCommon("tagline")}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
