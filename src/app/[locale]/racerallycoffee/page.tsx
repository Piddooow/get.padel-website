import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Clock, MapPin, Stamp, Truck } from "lucide-react";
import { InstagramIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { site } from "@/data/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "cafe" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${resolved}/racerallycoffee`,
      languages: {
        id: "/id/racerallycoffee",
        en: "/en/racerallycoffee",
        "x-default": "/id/racerallycoffee",
      },
    },
  };
}

/**
 * Race & Rally Coffee — the coffee bar inside the venue, on its own palette
 * (pure white / soft gray surfaces, bottle-green accents, near-black green
 * text) so it never reads as part of the court brand.
 */
export default async function RaceRallyCoffeePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("cafe");

  return (
    <div className="bg-[#fefefe] text-[#1e2920]">
      <section className="mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-6 lg:px-8 lg:pt-20">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-wide text-[#395b3b] uppercase">
              {t("eyebrow")}
            </p>
            <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-4 leading-relaxed text-[#1e2920]/75">
              {t("subtitle")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink
                href={site.links.cafeInstagram}
                external
                size="lg"
                className="rounded-full bg-[#074734] px-5 font-semibold text-[#f4f4f4] hover:bg-[#074734]/90"
              >
                <InstagramIcon className="size-4" aria-hidden="true" />
                {t("ctaIg")}
              </ButtonLink>
              <ButtonLink
                href={site.links.maps}
                external
                variant="outline"
                size="lg"
                className="rounded-full border-[#074734]/30 px-5 font-semibold text-[#074734] hover:bg-[#074734]/5"
              >
                <MapPin className="size-4" aria-hidden="true" />
                {t("ctaMaps")}
              </ButtonLink>
            </div>
            </div>

            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-3xl ring-1 ring-[#074734]/10">
              <Image
                src="/images/cafe-brand.jpg"
                alt={t("brandImageAlt")}
                fill
                priority
                sizes="(min-width: 1024px) 440px, (min-width: 640px) 60vw, 90vw"
                className="object-cover"
              />
            </div>
          </div>
        </Reveal>

        <Reveal>
          <dl className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-[#f4f4f4] p-5 ring-1 ring-[#074734]/10">
              <dt className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#395b3b] uppercase">
                <Clock className="size-3.5" aria-hidden="true" />
                {t("hoursLabel")}
              </dt>
              <dd className="mt-2 text-sm font-medium">{t("hours")}</dd>
            </div>
            <div className="rounded-2xl bg-[#f4f4f4] p-5 ring-1 ring-[#074734]/10">
              <dt className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#395b3b] uppercase">
                <Truck className="size-3.5" aria-hidden="true" />
                {t("deliveryLabel")}
              </dt>
              <dd className="mt-2 text-sm font-medium">{t("delivery")}</dd>
            </div>
            <div className="rounded-2xl bg-[#f4f4f4] p-5 ring-1 ring-[#074734]/10">
              <dt className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#395b3b] uppercase">
                <Stamp className="size-3.5" aria-hidden="true" />
                {t("loyaltyLabel")}
              </dt>
              <dd className="mt-2 text-sm font-medium">{t("loyalty")}</dd>
            </div>
          </dl>
        </Reveal>
      </section>

      <section
        aria-labelledby="cafe-menu-title"
        className="mx-auto max-w-7xl scroll-mt-20 px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20"
      >
        <Reveal>
          <div className="grid gap-8 rounded-3xl bg-[#f4f4f4] p-6 ring-1 ring-[#074734]/10 sm:p-10 lg:grid-cols-2">
            <div>
              <h2
                id="cafe-menu-title"
                className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
              >
                {t("menuTitle")}
              </h2>
              <p className="mt-4 leading-relaxed text-[#1e2920]/75">
                {t("menuBody")}
              </p>
            </div>
            <div className="rounded-2xl bg-[#fefefe] p-6 ring-1 ring-[#074734]/10">
              <h3 className="font-heading text-xl font-bold tracking-tight">
                {t("insideTitle")}
              </h3>
              <p className="mt-3 leading-relaxed text-[#1e2920]/75">
                {t("insideBody")}
              </p>
              <Link
                href="/about"
                className="mt-5 inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-[#074734] underline-offset-4 hover:underline"
              >
                {t("venueCta")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
