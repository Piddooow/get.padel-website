import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { FaqAccordion } from "@/components/help/faq-accordion";
import { ContactHoursCard } from "@/components/help/contact-hours-card";
import { HelpChannels } from "@/components/help/help-channels";
import { PolicyCard } from "@/components/help/policy-card";
import { HelpTopics } from "@/components/help/help-topics";
import { WhatsAppButton } from "@/components/help/whatsapp-button";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import { routing } from "@/i18n/routing";
import { loadFaqs, loadVenueProfile } from "@/lib/ui-content";

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
  const t = await getTranslations({ locale: resolved, namespace: "help" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${resolved}/bantuan`,
      languages: {
        id: "/id/bantuan",
        en: "/en/bantuan",
        "x-default": "/id/bantuan",
      },
    },
  };
}

export default async function HelpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("help");
  const tCommon = await getTranslations("common");
  const [faqs, venue] = await Promise.all([
    loadFaqs(locale),
    loadVenueProfile(),
  ]);

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
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
            <WhatsAppButton className="px-6" />
            <ButtonLink
              href={site.links.ayo}
              external
              variant="outline"
              size="lg"
              className="rounded-full border-gp-olive/25 px-6 font-semibold text-gp-olive hover:bg-gp-olive/5"
            >
              {tCommon("bookNow")}
            </ButtonLink>
          </div>
        </header>
      </Reveal>

      <div className="mt-14 space-y-16 lg:mt-16 lg:space-y-20">
        <Reveal>
          <HelpChannels venue={venue} />
        </Reveal>

        <Reveal>
          <section aria-labelledby="help-contact-title">
            <h2
              id="help-contact-title"
              className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t("contactTitle")}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {t("contactSubtitle")}
            </p>
            <div className="mt-6">
              <ContactHoursCard venue={venue} />
            </div>
          </section>
        </Reveal>

        <Reveal>
          <HelpTopics />
        </Reveal>

        <Reveal>
          <section aria-labelledby="help-policy-title">
            <h2
              id="help-policy-title"
              className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t("policyTitle")}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {t("policySubtitle")}
            </p>
            <div className="mt-6">
              <PolicyCard />
            </div>
          </section>
        </Reveal>

        <Reveal>
          <section aria-labelledby="help-faq-title">
            <h2
              id="help-faq-title"
              className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {t("faqTitle")}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {t("faqSubtitle")}
            </p>
            <div className="mt-6">
              <FaqAccordion items={faqs} />
            </div>
          </section>
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
            <div className="mt-1">
              <WhatsAppButton className="px-6" />
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
