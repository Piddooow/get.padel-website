import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CalendarCheck, MapPin, Star } from "lucide-react";
import { StatsBar } from "@/components/home/stats-bar";
import { WhatsAppIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button-link";
import { heroImage, site, whatsappLink } from "@/data/site";

export async function Hero() {
  const t = await getTranslations();
  const waHref = whatsappLink(t("common.waMessage"));

  return (
    <section
      id="top"
      className="relative isolate overflow-hidden bg-gp-olive text-gp-light"
    >
      {/* Venue photo background (local, optimized by next/image) */}
      <Image
        src={heroImage}
        alt={t("hero.imageAlt")}
        fill
        priority
        sizes="100vw"
        quality={75}
        className="object-cover object-center opacity-40 lg:opacity-60"
      />
      {/* Legibility overlays: mobile bottom-up, desktop left-right */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-gp-olive via-gp-olive/95 to-gp-olive/85 lg:hidden"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden bg-gradient-to-r from-gp-olive from-0% via-gp-olive/88 via-55% to-gp-olive/25 to-100% lg:block"
      />
      {/* Bottom fade into page background */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-gp-olive"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          {/* Copy */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-gp-light/25 bg-gp-olive/40 px-3.5 py-1.5 text-xs font-medium tracking-wide text-gp-light/90 backdrop-blur-sm">
              <MapPin className="size-3.5" aria-hidden="true" />
              {t("hero.eyebrow")}
            </span>

            <h1 className="font-heading mt-5 max-w-2xl text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {t("hero.title")}
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-gp-light/80 sm:text-lg">
              {t("hero.subtitle")}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <ButtonLink
                href={site.links.ayo}
                external
                size="lg"
                className="rounded-full px-6 font-semibold shadow-lg shadow-gp-rust/25 transition-transform hover:-translate-y-0.5"
              >
                <CalendarCheck className="size-4" />
                {t("hero.ctaBook")}
              </ButtonLink>
              <ButtonLink
                href={waHref}
                external
                variant="outline"
                size="lg"
                className="rounded-full border-gp-light/30 bg-gp-olive/30 px-6 font-semibold text-gp-light backdrop-blur-sm hover:bg-white/10 hover:text-gp-light"
              >
                <WhatsAppIcon className="size-4" />
                {t("hero.ctaWhatsapp")}
              </ButtonLink>
            </div>

            {/* Trust line */}
            <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gp-light/75">
              <span className="inline-flex items-center gap-1.5 font-medium text-gp-light">
                <Star
                  className="size-4 fill-current text-gp-light"
                  aria-hidden="true"
                />
                {t("stats.rating.value")} {t("stats.rating.label")}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                {t("stats.ayo.value")} {t("stats.ayo.label")}
              </span>
              <span aria-hidden="true">·</span>
              <span>{t("common.openDaily")}</span>
            </p>
          </div>

          {/* Booking widget (mock, client island) */}
        </div>

        <StatsBar />
      </div>
    </section>
  );
}
