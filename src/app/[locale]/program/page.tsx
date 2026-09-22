import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EventsSection } from "@/components/programs/events-section";
import { PolicySection } from "@/components/programs/policy-section";
import {
  CoachingSection,
  JuniorTrialSection,
} from "@/components/programs/program-sections";
import { WhatsAppButton } from "@/components/help/whatsapp-button";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import { routing } from "@/i18n/routing";
import { site } from "@/data/site";
import {
  loadEvents,
  loadPrograms,
} from "@/lib/ui-content";

// Event tabs need the current time per request (upcoming vs archive).
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "programs" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${resolved}/program`,
      languages: {
        id: "/id/program",
        en: "/en/program",
        "x-default": "/id/program",
      },
    },
  };
}

export default async function ProgramPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("programs");
  const tCommon = await getTranslations("common");

  // Database-backed content (with mock fallback) — lib/ui-content.ts.
  const [programs, events] = await Promise.all([
    loadPrograms(locale),
    loadEvents(locale),
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
          <CoachingSection programs={programs} />
        </Reveal>

        <Reveal>
          <JuniorTrialSection programs={programs} />
        </Reveal>


        <Reveal>
          <EventsSection events={events} />
        </Reveal>

        <Reveal>
          <PolicySection />
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
            <p className="text-xs text-muted-foreground">
              {tCommon("openDaily")} · {tCommon("tagline")}
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
