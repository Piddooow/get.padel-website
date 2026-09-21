import { getTranslations } from "next-intl/server";
import { Mail } from "lucide-react";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button-link";
import { site } from "@/data/site";
import type { VenueProfile } from "@/lib/ui-content";

/** Bantuan channels + service hours (PRD Fase 3: Kontak & Jam Layanan). */
export async function HelpChannels({ venue }: { venue: VenueProfile }) {
  const t = await getTranslations("help");
  const tCommon = await getTranslations("common");
  const waHref = `https://wa.me/${venue.contact.whatsapp}?text=${encodeURIComponent(
    tCommon("waMessage")
  )}`;

  const channels = [
    {
      key: "wa",
      icon: <WhatsAppIcon className="size-4" aria-hidden="true" />,
      title: t("waChannelTitle"),
      body: t("waChannelBody"),
      value: venue.contact.whatsappDisplay,
      href: waHref,
      external: true,
    },
    {
      key: "email",
      icon: <Mail className="size-4" aria-hidden="true" />,
      title: t("emailChannelTitle"),
      body: t("emailChannelBody"),
      value: venue.contact.emailEvent,
      href: `mailto:${venue.contact.emailEvent}`,
      external: false,
    },
    {
      key: "instagram",
      icon: <InstagramIcon className="size-4" aria-hidden="true" />,
      title: t("igChannelTitle"),
      body: t("igChannelBody"),
      value:
        venue.contact.instagramUrl?.replace(/\/+$/, "").split("/").pop() ??
        "@get.padel",
      href: venue.contact.instagramUrl ?? site.links.instagram,
      external: true,
    },
  ];

  return (
    <section aria-labelledby="help-channels-title">
      <h2
        id="help-channels-title"
        className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
      >
        {t("channelsTitle")}
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t("channelsSubtitle")}
      </p>

      <ul className="mt-6 grid gap-4 md:grid-cols-3">
        {channels.map((channel) => (
          <li
            key={channel.key}
            className="flex flex-col rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 sm:p-6"
          >
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-gp-rust/10 text-gp-rust">
              {channel.icon}
            </span>
            <h3 className="mt-3 font-heading text-base font-semibold">
              {channel.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {channel.body}
            </p>
            <p className="mt-3 text-sm font-semibold text-gp-olive">
              {channel.value}
            </p>
            <div className="mt-auto pt-4">
              <ButtonLink
                href={channel.href}
                {...(channel.external ? { external: true } : {})}
                size="sm"
                className="rounded-full px-4 font-semibold"
              >
                {channel.key === "wa"
                  ? tCommon("whatsapp")
                  : channel.key === "email"
                    ? t("emailChannelCta")
                    : t("igChannelCta")}
              </ButtonLink>
            </div>
          </li>
        ))}
      </ul>

    </section>
  );
}
