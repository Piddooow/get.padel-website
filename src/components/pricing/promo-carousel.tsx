"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { pick, promoPosters } from "@/data/promos";

/** Poster carousel (PRD Fase 2) — scroll-snap gallery with prev/next. */
export function PromoCarousel() {
  const t = useTranslations("pricing");
  const locale = useLocale();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  const scrollByCard = (direction: 1 | -1) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.querySelector("figure");
    const amount = card
      ? card.getBoundingClientRect().width + 16
      : scroller.clientWidth * 0.8;
    scroller.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  // Empty state: no posters at all, or every poster failed to load.
  const allFailed =
    promoPosters.length > 0 &&
    promoPosters.every((promo) => failed[promo.id]);
  if (promoPosters.length === 0 || allFailed) {
    return (
      <div
        role="status"
        className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gp-olive/25 bg-card px-6 py-12 text-center"
      >
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <ImageOff className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-heading font-semibold">{t("carouselEmptyTitle")}</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {t("carouselEmptyBody")}
          </p>
        </div>
        <a
          href="#promo-list-title"
          className="inline-flex items-center rounded-full border border-gp-olive/25 px-4 py-2 text-sm font-semibold text-gp-olive transition-colors hover:bg-gp-olive/5"
        >
          {t("carouselEmptyCta")}
        </a>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        role="region"
        aria-label={t("carouselLabel")}
        tabIndex={0}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 focus-visible:outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {promoPosters.map((promo) => (
          <figure
            key={promo.id}
            className="w-[240px] shrink-0 snap-start sm:w-[280px]"
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted ring-1 ring-gp-olive/10">
              {failed[promo.id] ? (
                <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
                  <ImageOff
                    className="size-6 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("carouselImageFallback")}
                  </p>
                </div>
              ) : (
                <Image
                  src={promo.poster}
                  alt={pick(locale, promo.title)}
                  fill
                  sizes="(min-width: 640px) 280px, 240px"
                  className="object-cover"
                  onError={() =>
                    setFailed((current) => ({ ...current, [promo.id]: true }))
                  }
                />
              )}
            </div>
            <figcaption className="mt-3">
              <p className="text-sm font-semibold">
                {pick(locale, promo.title)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {pick(locale, promo.period)}
              </p>
              <div className="mt-2">
                {promo.link ? (
                  <ButtonLink
                    href={promo.link}
                    external
                    size="sm"
                    className="rounded-full font-semibold"
                  >
                    {t("promoLinkCta")}
                  </ButtonLink>
                ) : (
                  <a
                    href="#promo-list-title"
                    className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {t("promoDetailCta")}
                  </a>
                )}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          aria-label={t("carouselPrev")}
          onClick={() => scrollByCard(-1)}
          className="rounded-full border-gp-olive/25 text-gp-olive hover:bg-gp-olive/5"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          aria-label={t("carouselNext")}
          onClick={() => scrollByCard(1)}
          className="rounded-full border-gp-olive/25 text-gp-olive hover:bg-gp-olive/5"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
