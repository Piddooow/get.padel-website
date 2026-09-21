import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { ButtonLink } from "@/components/ui/button-link";
import type { Court } from "@/data/courts";
import { site } from "@/data/site";

/** Court specifications — two identical indoor premium courts (PRD §8.3). */
export async function CourtSpecs({ courts }: { courts: Court[] }) {
  const t = await getTranslations("location");

  return (
    <section aria-labelledby="location-courts-title">
      <h2
        id="location-courts-title"
        className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
      >
        {t("courtsTitle")}
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t("courtsSubtitle")}
      </p>

      <ul className="mt-6 grid gap-6 lg:grid-cols-2">
        {courts.map((court) => (
          <li
            key={court.id}
            className="flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-gp-olive/10"
          >
            <div className="relative aspect-[4/3] bg-muted">
              <Image
                src={court.image}
                alt={t("courtImageAlt", { name: court.name })}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>

            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <h3 className="font-heading text-lg font-semibold">
                {court.name}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {t("courtBlurb")}
              </p>

              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: t("specType"), value: t("courtIndoor") },
                  { label: t("specSurface"), value: court.surface },
                  { label: t("specSession"), value: t("courtSessionValue") },
                  { label: t("specLighting"), value: t("courtLighting") },
                ].map((spec) => (
                  <div
                    key={spec.label}
                    className="rounded-xl border border-gp-olive/15 px-3.5 py-2.5"
                  >
                    <dt className="text-xs text-muted-foreground">
                      {spec.label}
                    </dt>
                    <dd className="mt-0.5 font-medium">{spec.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 flex flex-wrap gap-3">
                {/* Both CTAs share one style so the pair reads consistently. */}
                <ButtonLink
                  href="/jadwal"
                  variant="outline"
                  size="lg"
                  className="rounded-full border-gp-olive/25 px-4 font-semibold text-gp-olive hover:bg-gp-olive/5"
                >
                  {t("courtCtaSchedule")}
                </ButtonLink>
                <ButtonLink
                  href={site.links.ayo}
                  external
                  variant="outline"
                  size="lg"
                  className="rounded-full border-gp-olive/25 px-4 font-semibold text-gp-olive hover:bg-gp-olive/5"
                >
                  {t("courtCtaBook")}
                </ButtonLink>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
