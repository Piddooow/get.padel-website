import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { MapPin, Clock, Mail } from "lucide-react";
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/icons";
import { site, whatsappLink } from "@/data/site";

export async function SiteFooter() {
  const t = await getTranslations();
  const waHref = whatsappLink(t("common.waMessage"));
  const year = new Date().getFullYear();

  const socials = [
    {
      href: site.links.instagram,
      label: "Instagram @get.padel",
      icon: <InstagramIcon className="size-4.5" />,
    },
    {
      href: site.links.tiktok,
      label: "TikTok @get.padel",
      icon: <TikTokIcon className="size-4.5" />,
    },
    {
      href: waHref,
      label: `WhatsApp ${site.contact.whatsappDisplay}`,
      icon: <WhatsAppIcon className="size-4.5" />,
    },
  ];

  return (
    <footer id="kontak" className="site-footer bg-gp-olive text-gp-light">
      {/* Extra bottom padding on phones keeps the footer clear of the dock. */}
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-24 sm:px-6 lg:px-8 lg:pb-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Image
              src="/logo-getpadel.webp"
              alt={t("common.brand")}
              width={1000}
              height={585}
              className="h-12 w-auto"
            />
            <p className="text-sm leading-relaxed text-gp-light/75">
              {t("footer.blurb")}
            </p>
            <div className="flex items-center gap-2.5">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="inline-flex size-11 items-center justify-center rounded-full border border-gp-light/20 text-gp-light/80 transition-colors hover:bg-white/10 hover:text-gp-light"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase text-gp-light/60">
              {t("footer.exploreTitle")}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-gp-light/80 transition-colors hover:text-gp-light"
                >
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-gp-light/80 transition-colors hover:text-gp-light"
                >
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link
                  href="/harga"
                  className="text-gp-light/80 transition-colors hover:text-gp-light"
                >
                  {t("menu.pricing")}
                </Link>
              </li>
              <li>
                <Link
                  href="/lokasi"
                  className="text-gp-light/80 transition-colors hover:text-gp-light"
                >
                  {t("nav.location")}
                </Link>
              </li>
              <li>
                <Link
                  href="/program"
                  className="text-gp-light/80 transition-colors hover:text-gp-light"
                >
                  {t("nav.program")}
                </Link>
              </li>
              <li>
                <Link
                  href="/racerallycoffee"
                  className="text-gp-light/80 transition-colors hover:text-gp-light"
                >
                  {"@racerallycoffee"}
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-gp-light/80 transition-colors hover:text-gp-light"
                >
                  {t("nav.blog")}
                </Link>
              </li>
              <li>
                <Link
                  href="/bantuan"
                  className="text-gp-light/80 transition-colors hover:text-gp-light"
                >
                  {t("nav.help")}
                </Link>
              </li>
              <li>
                <a
                  href="#kontak"
                  className="text-gp-light/80 transition-colors hover:text-gp-light"
                >
                  {t("nav.contact")}
                </a>
              </li>
              <li>
                <a
                  href={site.links.ayo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gp-light/80 transition-colors hover:text-gp-light"
                >
                  {`${t("common.bookNow")} · AYO`}
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase text-gp-light/60">
              {t("footer.contactTitle")}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-gp-light/80">
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-gp-light/60" />
                <span>
                  {site.address.street}
                  <br />
                  {site.address.district}
                  <br />
                  {site.address.city}
                </span>
              </li>
              <li className="flex gap-2.5">
                <WhatsAppIcon className="mt-0.5 size-4 shrink-0 text-gp-light/60" />
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-gp-light"
                >
                  {site.contact.whatsappDisplay}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 size-4 shrink-0 text-gp-light/60" />
                <a
                  href={`mailto:${site.contact.emailEvent}`}
                  className="break-all transition-colors hover:text-gp-light"
                >
                  {site.contact.emailEvent}
                </a>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h3 className="text-sm font-semibold tracking-wide uppercase text-gp-light/60">
              {t("footer.hoursTitle")}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-gp-light/80">
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 size-4 shrink-0 text-gp-light/60" />
                <span>
                  <span className="block font-medium text-gp-light">
                    {t("footer.courtHoursLabel")}
                  </span>
                  {t("footer.courtHours")}
                </span>
              </li>
              <li className="flex gap-2.5">
                <Clock className="mt-0.5 size-4 shrink-0 text-gp-light/60" />
                <span>
                  <span className="block font-medium text-gp-light">
                    {t("footer.cafeHoursLabel")}
                  </span>
                  {t("footer.cafeHours")}
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-gp-light/15 pt-6 text-xs text-gp-light/60 sm:flex-row sm:items-center">
          <p>{t("footer.legal", { year })}</p>
          <p className="font-medium tracking-wide">
            {t("common.tagline")}
          </p>
        </div>
      </div>
    </footer>
  );
}
