import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MailCheck, Smartphone, TicketCheck } from "lucide-react";
import { ResendForm } from "@/components/checkout/resend-form";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import { routing } from "@/i18n/routing";
import { site, whatsappLink } from "@/data/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({
    locale: resolved,
    namespace: "confirmation",
  });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${resolved}/pesan/konfirmasi`,
      languages: {
        id: "/id/pesan/konfirmasi",
        en: "/en/pesan/konfirmasi",
        "x-default": "/id/pesan/konfirmasi",
      },
    },
  };
}

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("confirmation");
  const tCommon = await getTranslations("common");

  const channels = [
    {
      icon: <MailCheck className="size-4" aria-hidden="true" />,
      title: t("emailTitle"),
      body: t("emailBody"),
    },
    {
      icon: <Smartphone className="size-4" aria-hidden="true" />,
      title: t("waTitle"),
      body: t("waBody"),
    },
    {
      icon: <TicketCheck className="size-4" aria-hidden="true" />,
      title: t("ayoTitle"),
      body: t("ayoBody"),
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
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
              href={`/${locale}/pesan`}
              variant="outline"
              size="lg"
              className="rounded-full border-gp-olive/25 px-6 font-semibold text-gp-olive hover:bg-gp-olive/5"
            >
              {t("backToFlow")}
            </ButtonLink>
            <ButtonLink
              href={whatsappLink(tCommon("waMessage"))}
              external
              variant="outline"
              size="lg"
              className="rounded-full border-gp-olive/25 px-6 font-semibold text-gp-olive hover:bg-gp-olive/5"
            >
              {t("contactCs")}
            </ButtonLink>
          </div>
        </header>
      </Reveal>

      <div className="mt-14 grid gap-6 lg:grid-cols-2">
        {/* Resend request */}
        <Reveal>
          <ResendForm />
        </Reveal>

        {/* How confirmations work */}
        <Reveal delay={100}>
          <div className="rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 sm:p-6">
            <h2 className="font-heading text-lg font-semibold">
              {t("channelsTitle")}
            </h2>
            <ul className="mt-4 space-y-4">
              {channels.map((channel) => (
                <li key={channel.title} className="flex gap-3">
                  <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-gp-rust/10 text-gp-rust">
                    {channel.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{channel.title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                      {channel.body}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs text-muted-foreground">
              {site.contact.whatsappDisplay} · {tCommon("openDaily")}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
