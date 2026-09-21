import { getTranslations } from "next-intl/server";
import { Clock, Mail, MapPin, Navigation } from "lucide-react";
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/icons";
import { WhatsAppButton } from "@/components/help/whatsapp-button";
import { ButtonLink } from "@/components/ui/button-link";
import { Link } from "@/i18n/navigation";
import { site } from "@/data/site";
import type { VenueProfile } from "@/lib/ui-content";

/** Kontak & Jam Layanan card (PRD Fase 3) — contact list, hours, address. */
export async function ContactHoursCard({ venue }: { venue: VenueProfile }) {
  const t = await getTranslations("help");
  const tLocation = await getTranslations("location");

  const contacts = [
    {
      key: "wa",
      icon: <WhatsAppIcon className="size-4" aria-hidden="true" />,
      label: t("waChannelTitle"),
      value: venue.contact.whatsappDisplay,
      href: `https://wa.me/${venue.contact.whatsapp}`,
      external: true,
    },
    {
      key: "email-event",
      icon: <Mail className="size-4" aria-hidden="true" />,
      label: t("emailChannelTitle"),
      value: venue.contact.emailEvent,
      href: `mailto:${venue.contact.emailEvent}`,
      external: false,
    },
    {
      key: "email-commercial",
      icon: <Mail className="size-4" aria-hidden="true" />,
      label: t("emailCommercialLabel"),
      value: venue.contact.emailCommercial,
      href: `mailto:${venue.contact.emailCommercial}`,
      external: false,
    },
    {
      key: "instagram",
      icon: <InstagramIcon className="size-4" aria-hidden="true" />,
      label: "Instagram",
      value: "@get.padel",
      href: venue.contact.instagramUrl ?? site.links.instagram,
      external: true,
    },
    {
      key: "tiktok",
      icon: <TikTokIcon className="size-4" aria-hidden="true" />,
      label: "TikTok",
      value: "@get.padel",
      href: venue.contact.tiktokUrl ?? site.links.tiktok,
      external: true,
    },
  ];

  return (
    <div className="grid gap-8 rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 sm:p-6 lg:grid-cols-2">
      {/* Contact list */}
      <div>
        <h3 className="font-heading text-base font-semibold">
          {t("contactListTitle")}
        </h3>
        <ul className="mt-4 space-y-2.5 text-sm">
          {contacts.map((contact) => (
            <li key={contact.key}>
              <a
                href={contact.href}
                {...(contact.external
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

      {/* Hours + address */}
      <div className="flex flex-col">
        <h3 className="flex items-center gap-2 font-heading text-base font-semibold">
          <Clock className="size-4 text-gp-rust" aria-hidden="true" />
          {t("serviceHoursTitle")}
        </h3>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <li>{t("serviceHoursCourts")}</li>
          <li>{t("serviceHoursCafe")}</li>
        </ul>

        <h3 className="mt-6 flex items-center gap-2 font-heading text-base font-semibold">
          <MapPin className="size-4 text-gp-rust" aria-hidden="true" />
          {t("addressTitle")}
        </h3>
        <p className="mt-3 text-sm text-muted-foreground">
          {venue.address.street} · {venue.address.district} · {venue.address.city}
        </p>
        <Link
          href="/lokasi"
          className="mt-2 inline-flex w-fit text-sm font-semibold text-gp-olive underline-offset-4 hover:underline"
        >
          {t("findUsCta")}
        </Link>

        <div className="mt-auto flex flex-wrap gap-3 pt-5">
          <WhatsAppButton />
          <ButtonLink
            href={site.links.maps}
            external
            variant="outline"
            size="lg"
            className="rounded-full border-gp-olive/25 px-5 font-semibold text-gp-olive hover:bg-gp-olive/5"
          >
            <Navigation className="size-4" aria-hidden="true" />
            {tLocation("mapsCta")}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
