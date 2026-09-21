import { getTranslations } from "next-intl/server";
import { Check, ExternalLink } from "lucide-react";
import { SectionBackdrop } from "@/components/programs/section-backdrop";
import { ButtonLink } from "@/components/ui/button-link";
import { FREE_TRIAL_REGISTRATION_URL } from "@/data/programs";
import { site, whatsappLink } from "@/data/site";
import type { ProgramView } from "@/lib/ui-content";

/** One program card — description, highlights, optional price rows + CTA. */
async function ProgramCard({ program }: { program: ProgramView }) {
  const t = await getTranslations("programs");

  const labels: Record<ProgramView["cta"], string> = {
    form: t("ctaForm"),
    wa: t("ctaWa"),
    ayo: t("ctaAyo"),
    email: t("ctaEmail"),
  };

  const cta = (() => {
    switch (program.cta) {
      case "form":
        return {
          href: program.registrationUrl ?? FREE_TRIAL_REGISTRATION_URL,
          label: labels.form,
          external: true,
        };
      case "ayo":
        return { href: site.links.ayo, label: labels.ayo, external: true };
      case "email":
        return {
          href: `mailto:${site.contact.emailEvent}`,
          label: labels.email,
          external: false,
        };
      default:
        return {
          href: whatsappLink(
            t("waProgramMessage", { program: program.title })
          ),
          label: labels.wa,
          external: true,
        };
    }
  })();

  return (
    <li className="flex flex-col rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 sm:p-6">
      <h3 className="font-heading text-lg font-semibold">
        {program.title}
      </h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
        {program.description}
      </p>

      <ul className="mt-4 space-y-2 text-sm">
        {program.highlights.map((highlight, index) => (
          <li
            key={`${program.id}-highlight-${index}`}
            className="flex items-start gap-2"
          >
            <Check
              className="mt-0.5 size-3.5 shrink-0 text-gp-rust"
              aria-hidden="true"
            />
            <span>{highlight}</span>
          </li>
        ))}
      </ul>

      {program.priceRows && program.priceRows.length > 0 && (
        <dl className="mt-4 overflow-hidden rounded-xl border border-gp-olive/15">
          {program.priceRows.map((row, index) => (
            <div
              key={`${program.id}-price-${index}`}
              className="flex items-center justify-between gap-3 border-b border-gp-olive/10 px-3.5 py-2.5 text-sm last:border-b-0"
            >
              <dt className="text-muted-foreground">{row.label}</dt>
              <dd className="font-semibold tabular-nums text-gp-olive">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {program.priceNote && (
        <p className="mt-3 text-xs text-muted-foreground">
          {program.priceNote}
        </p>
      )}

      <div className="mt-auto pt-5">
        <ButtonLink
          href={cta.href}
          {...(cta.external ? { external: true } : {})}
          size="lg"
          className="rounded-full px-5 font-semibold"
        >
          {cta.label}
        </ButtonLink>
      </div>
    </li>
  );
}

/** A group's cards in a responsive grid. */
async function ProgramCards({
  programs,
  group,
}: {
  programs: ProgramView[];
  group: ProgramView["group"];
}) {
  const items = programs.filter((program) => program.group === group);
  return (
    <ul className="mt-6 grid gap-6 md:grid-cols-2">
      {items.map((program) => (
        <ProgramCard key={program.id} program={program} />
      ))}
    </ul>
  );
}

/** Coaching privat & paket multi-sesi (PRD Fase 3). */
export async function CoachingSection({
  programs,
}: {
  programs: ProgramView[];
}) {
  const t = await getTranslations("programs");

  return (
    <section
      aria-labelledby="coaching-title"
      className="relative isolate overflow-hidden rounded-3xl p-5 sm:p-8"
    >
      <SectionBackdrop image="/images/court-1.jpg" position="center 35%" />
      <h2
        id="coaching-title"
        className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
      >
        {t("sectionCoachingTitle")}
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t("sectionCoachingSubtitle")}
      </p>
      <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-gp-olive">
        <Check className="size-4 text-gp-rust" aria-hidden="true" />
        {t("coachingNote")}
      </p>

      <ProgramCards programs={programs} group="coaching" />
    </section>
  );
}

/** Kelas junior + pendaftaran free trial (PRD Fase 3). */
export async function JuniorTrialSection({
  programs,
}: {
  programs: ProgramView[];
}) {
  const t = await getTranslations("programs");
  const tCommon = await getTranslations("common");
  const trial = programs.find((program) => program.id === "free-trial");
  const junior = programs.find((program) => program.id === "junior-class");
  if (!trial || !junior) return null;

  return (
    <section
      aria-labelledby="junior-title"
      className="relative isolate overflow-hidden rounded-3xl p-5 sm:p-8"
    >
      <SectionBackdrop image="/images/court-2.jpg" position="center 40%" />
      <h2
        id="junior-title"
        className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
      >
        {t("juniorSectionTitle")}
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t("juniorSectionSubtitle")}
      </p>

      <ul className="mt-6 grid gap-6 md:grid-cols-2">
        <ProgramCard program={junior} />

        {/* Free trial registration (official Google Form + WhatsApp fallback) */}
        <li className="flex flex-col rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 sm:p-6">
          <h3 className="font-heading text-lg font-semibold">
            {trial.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {trial.description}
          </p>

          <ul className="mt-4 space-y-2 text-sm">
            {trial.highlights.map((highlight, index) => (
              <li
                key={`free-trial-highlight-${index}`}
                className="flex items-start gap-2"
              >
                <Check
                  className="mt-0.5 size-3.5 shrink-0 text-gp-rust"
                  aria-hidden="true"
                />
                <span>{highlight}</span>
              </li>
            ))}
          </ul>

          <p className="mt-3 text-xs text-muted-foreground">
            {t("freeTrialNote")}
          </p>

          <div className="mt-auto flex flex-wrap gap-3 pt-5">
            <ButtonLink
              href={trial.registrationUrl ?? FREE_TRIAL_REGISTRATION_URL}
              external
              size="lg"
              className="rounded-full px-5 font-semibold"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              {t("ctaForm")}
            </ButtonLink>
            <ButtonLink
              href={whatsappLink(tCommon("waMessage"))}
              external
              variant="outline"
              size="lg"
              className="rounded-full border-gp-olive/25 px-5 font-semibold text-gp-olive hover:bg-gp-olive/5"
            >
              {t("freeTrialWaCta")}
            </ButtonLink>
          </div>
        </li>
      </ul>
    </section>
  );
}
