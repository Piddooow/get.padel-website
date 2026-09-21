import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CourtSpecs } from "@/components/venue/court-specs";
import { FacilitiesGrid } from "@/components/venue/facilities-grid";
import { LocationFaq } from "@/components/venue/faq-accordion";
import { VenueCard } from "@/components/venue/venue-card";
import {
  VenueHighlightCard,
  VenueHighlightProvider,
} from "@/components/venue/venue-highlight";
import { VenueMap } from "@/components/venue/venue-map";
import { WhatsAppButton } from "@/components/help/whatsapp-button";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import { routing } from "@/i18n/routing";
import {
  loadCourts,
  loadFacilities,
  loadFaqs,
  loadVenueProfile,
} from "@/lib/ui-content";

// Content comes from the database — refresh the rendered page periodically.
export const revalidate = 300;
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
  const t = await getTranslations({ locale: resolved, namespace: "location" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${resolved}/lokasi`,
      languages: {
        id: "/id/lokasi",
        en: "/en/lokasi",
        "x-default": "/id/lokasi",
      },
    },
  };
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("location");
  const tCommon = await getTranslations("common");
  const [faqs, facilities, courts, venue] = await Promise.all([
    loadFaqs(locale),
    loadFacilities(locale),
    loadCourts(),
    loadVenueProfile(),
  ]);

  // LocalBusiness / SportsActivityLocation structured data (PRD §2.4).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: site.name,
    slogan: site.tagline,
    description: t("metaDescription"),
    telephone: `+${site.contact.whatsapp}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: `${site.address.street}, ${site.address.district}`,
      addressLocality: "Jakarta Timur",
      addressRegion: "DKI Jakarta",
      postalCode: "13450",
      addressCountry: "ID",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.address.coordinates.lat,
      longitude: site.address.coordinates.lng,
    },
    openingHours: "Mo-Su 06:00-22:00",
    sameAs: [
      site.links.instagram,
      site.links.tiktok,
      site.links.ayo,
      site.links.maps,
    ],
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
            <WhatsAppButton
              variant="outline"
              className="border-gp-olive/25 px-6 text-gp-olive hover:bg-gp-olive/5"
            />
          </div>
        </header>
      </Reveal>

      <div className="mt-14 space-y-16 lg:mt-16 lg:space-y-20">
        <VenueHighlightProvider>
          <Reveal>
            <VenueHighlightCard>
              <VenueCard venue={venue} />
            </VenueHighlightCard>
          </Reveal>

          <Reveal>
            <VenueMap />
          </Reveal>
        </VenueHighlightProvider>

        <Reveal>
          <CourtSpecs courts={courts} />
        </Reveal>

        <Reveal>
          <FacilitiesGrid facilities={facilities} />
        </Reveal>

        <Reveal>
          <LocationFaq items={faqs} />
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
              <WhatsAppButton
                variant="outline"
                className="border-gp-olive/25 px-6 text-gp-olive hover:bg-gp-olive/5"
              />
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
