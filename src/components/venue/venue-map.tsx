import { getTranslations } from "next-intl/server";
import { Navigation } from "lucide-react";
import {
  VenueCityFilter,
  VenueMapPin,
} from "@/components/venue/venue-highlight";
import { ButtonLink } from "@/components/ui/button-link";
import { site } from "@/data/site";

/** Peta ringan: Google Maps embed (tanpa API key) + arah ke Maps (PRD §5). */
export async function VenueMap() {
  const t = await getTranslations("location");
  const { lat, lng } = site.address.coordinates;

  // Keyless Google Maps embed — query the venue coordinates directly.
  const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;

  return (
    <section aria-labelledby="location-map-title">
      <h2
        id="location-map-title"
        className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
      >
        {t("mapTitle")}
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">{t("mapSubtitle")}</p>

      <VenueCityFilter className="mt-5" />

      <div className="mt-6">
        <div className="relative overflow-hidden rounded-2xl bg-muted ring-1 ring-gp-olive/10">
          <iframe
            src={embedUrl}
            title={t("mapEmbedTitle")}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            className="h-[320px] w-full border-0 sm:h-[380px]"
          />
          <VenueMapPin
            name={site.name}
            plusCode={site.address.plusCode}
            cta={t("mapPinCta")}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            {t("mapAreaNote")} · {t("plusCodeLabel")}: {site.address.plusCode}
          </p>
          <ButtonLink
            href={site.links.maps}
            external
            size="lg"
            className="rounded-full px-5 font-semibold"
          >
            <Navigation className="size-4" aria-hidden="true" />
            {t("mapsCta")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
