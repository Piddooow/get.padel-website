import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Clock, MapPin, Star } from "lucide-react";
import { VenueDirectionsButton } from "@/components/venue/venue-highlight";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button-link";
import { site } from "@/data/site";
import type { VenueProfile } from "@/lib/ui-content";

/** Venue summary: address, opening hours, ratings and contact channels. */
export async function VenueCard({ venue }: { venue: VenueProfile }) {
  const t = await getTranslations("location");
  const tCommon = await getTranslations("common");
  const locale = await getLocale();
  const waHref = `https://wa.me/${venue.contact.whatsapp}?text=${encodeURIComponent(
    tCommon("waMessage")
  )}`;

  const score = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });

  const ratings = [
    t("ratingGoogle", {
      score: score.format(venue.ratings.google.score ?? 0),
      count: venue.ratings.google.count ?? 0,
    }),
    t("ratingAyo", {
      score: score.format(venue.ratings.ayo.score ?? 0),
      count: venue.ratings.ayo.count ?? 0,
    }),
  ];

  const subRatings = [
    {
      key: "cleanliness",
      label: t("ratingSubCleanliness"),
      value: venue.ratings.sub.cleanliness,
    },
    {
      key: "court",
      label: t("ratingSubCourt"),
      value: venue.ratings.sub.courtCondition,
    },
    {
      key: "communication",
      label: t("ratingSubCommunication"),
      value: venue.ratings.sub.communication,
    },
  ] as const;

  const contacts = [
    {
      key: "whatsapp",
      href: waHref,
      label: tCommon("whatsapp"),
      value: venue.contact.whatsappDisplay,
      icon: <WhatsAppIcon className="size-4" aria-hidden="true" />,
    },
    {
      key: "email-event",
      href: `mailto:${venue.contact.emailEvent}`,
      label: t("emailEventLabel"),
      value: venue.contact.emailEvent,
      icon: <span aria-hidden="true">@</span>,
    },
    {
      key: "email-commercial",
      href: `mailto:${venue.contact.emailCommercial}`,
      label: t("emailCommercialLabel"),
      value: venue.contact.emailCommercial,
      icon: <span aria-hidden="true">@</span>,
    },
    {
      key: "instagram",
      href: venue.contact.instagramUrl ?? site.links.instagram,
      label: t("instagramLabel"),
      value:
        venue.contact.instagramUrl
          ?.replace(/\/+$/, "")
          .split("/")
          .pop() ?? "@get.padel",
      icon: <InstagramIcon className="size-4" aria-hidden="true" />,
    },
  ];

  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-gp-olive/10">
      {/* Venue photo */}
      <div className="relative aspect-[16/9] bg-muted sm:aspect-[21/9]">
        <Image
          src="/images/venue-front.jpg"
          alt={t("venuePhotoAlt")}
          fill
          sizes="(min-width: 1280px) 1152px, 100vw"
          className="object-cover"
        />
      </div>

      <div className="grid gap-8 p-5 sm:p-6 lg:grid-cols-2">
        {/* Address, hours, plus code */}
        <div>
          <h3 className="font-heading text-lg font-semibold">{venue.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{venue.tagline}</p>

          <dl className="mt-5 space-y-4 text-sm">
            <div className="flex gap-3">
              <MapPin
                className="mt-0.5 size-4 shrink-0 text-gp-rust"
                aria-hidden="true"
              />
              <div>
                <dt className="font-medium">{t("addressLabel")}</dt>
                <dd className="mt-0.5 text-muted-foreground">
                  {venue.address.street}
                </dd>
                <dd className="text-muted-foreground">
                  {venue.address.district} · {venue.address.city}
                </dd>
              </div>
            </div>

            <div className="flex gap-3">
              <Clock
                className="mt-0.5 size-4 shrink-0 text-gp-rust"
                aria-hidden="true"
              />
              <div>
                <dt className="font-medium">{t("hoursLabel")}</dt>
                <dd className="mt-0.5 text-muted-foreground">
                  {t("hoursCourts")}
                </dd>
                <dd className="text-muted-foreground">{t("hoursCafe")}</dd>
              </div>
            </div>
          </dl>

          <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-gp-olive/20 px-3.5 py-1.5 text-xs font-medium text-gp-olive">
            <MapPin className="size-3.5" aria-hidden="true" />
            {t("plusCodeLabel")}: {venue.address.plusCode}
          </p>
        </div>

        {/* Ratings + contact channels */}
        <div>
          <div className="rounded-xl border border-gp-olive/15 bg-gp-olive/[0.03] p-4">
            <span
              role="img"
              aria-label={t("ratingStarsAria", {
                score: score.format(site.ratings.google.score),
              })}
              className="flex items-center gap-0.5 text-gp-rust"
            >
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className="size-4 fill-current"
                  aria-hidden="true"
                />
              ))}
            </span>

            <ul className="mt-3 flex flex-wrap gap-2">
              {ratings.map((rating) => (
                <li
                  key={rating}
                  className="inline-flex items-center rounded-full border border-gp-olive/20 bg-card px-3.5 py-2 text-xs font-medium text-gp-olive"
                >
                  {rating}
                </li>
              ))}
            </ul>

            <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-gp-olive/10 pt-3 text-center">
              {subRatings.map((item) => (
                <div key={item.key}>
                  <dd className="font-heading text-sm font-bold tabular-nums">
                    {score.format(item.value ?? 0)}
                  </dd>
                  <dt className="mt-0.5 text-[11px] text-muted-foreground">
                    {item.label}
                  </dt>
                </div>
              ))}
            </dl>
          </div>

          <ul className="mt-5 space-y-2.5 text-sm">
            {contacts.map((contact) => (
              <li key={contact.key}>
                <a
                  href={contact.href}
                  {...(contact.href.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="flex items-center gap-3 rounded-xl border border-gp-olive/15 px-3.5 py-2.5 transition-colors hover:border-gp-olive/40 hover:bg-gp-olive/5"
                >
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-gp-olive/5 text-gp-olive">
                    {contact.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-muted-foreground">
                      {contact.label}
                    </span>
                    <span className="block truncate font-medium">
                      {contact.value}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>

        </div>
      </div>

      {/* Card actions: book + directions (slot & map) */}
      <div className="flex flex-wrap items-center gap-3 border-t border-gp-olive/10 px-5 py-4 sm:px-6">
        <ButtonLink
          href={site.links.ayo}
          external
          size="lg"
          className="rounded-full px-5 font-semibold"
        >
          {tCommon("bookNow")}
        </ButtonLink>
        <VenueDirectionsButton />
      </div>
    </div>
  );
}
