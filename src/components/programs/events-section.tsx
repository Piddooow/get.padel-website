import { getTranslations } from "next-intl/server";
import { Mail, Sparkles } from "lucide-react";
import { SectionBackdrop } from "@/components/programs/section-backdrop";
import { EventsTabs } from "@/components/programs/events-tabs";
import { ButtonLink } from "@/components/ui/button-link";
import { site, whatsappLink } from "@/data/site";
import type { EventCardView } from "@/lib/ui-content";

/** Turnamen, hari sosial, dan arsip event komunitas (PRD Fase 3). */
export async function EventsSection({
  events,
}: {
  events: { upcoming: EventCardView[]; archive: EventCardView[] };
}) {
  const t = await getTranslations("programs");
  const tCommon = await getTranslations("common");
  const upcoming = events.upcoming;
  const archive = events.archive;

  return (
    <section
      aria-labelledby="events-title"
      className="relative isolate overflow-hidden rounded-3xl p-5 sm:p-8"
    >
      <SectionBackdrop image="/images/venue-court.jpg" position="center 55%" />
      <h2
        id="events-title"
        className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
      >
        {t("sectionEventsTitle")}
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t("sectionEventsSubtitle")}
      </p>

      <div className="mt-6">
        <EventsTabs upcoming={upcoming} archive={archive} />
      </div>

      {/* Event & partnership inquiry */}
      <div className="mt-6 rounded-2xl bg-gp-olive p-5 text-gp-light sm:p-6">
        <h3 className="flex items-center gap-2 font-heading text-lg font-semibold">
          <Sparkles className="size-4 text-gp-light/80" aria-hidden="true" />
          {t("partnershipTitle")}
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-gp-light/80">
          {t("partnershipBody")}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink
            href={`mailto:${site.contact.emailCommercial}`}
            size="lg"
            className="rounded-full bg-gp-light px-5 font-semibold text-gp-olive hover:bg-white dark:bg-gp-light/15 dark:text-gp-light dark:hover:bg-gp-light/25"
          >
            <Mail className="size-4" aria-hidden="true" />
            {t("partnershipCtaEmail")}
          </ButtonLink>
          <ButtonLink
            href={whatsappLink(tCommon("waMessage"))}
            external
            variant="outline"
            size="lg"
            className="rounded-full border-gp-light/30 bg-transparent px-5 font-semibold text-gp-light hover:bg-white/10 hover:text-gp-light"
          >
            {t("partnershipCtaWa")}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
