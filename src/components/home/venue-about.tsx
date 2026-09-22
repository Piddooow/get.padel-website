import { getTranslations } from "next-intl/server";
import { MapPin } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import { site, whatsappLink } from "@/data/site";
import { loadCourts } from "@/lib/ui-content";

/** About Get Padel (venue positioning + court facts) — informational only. */
export async function VenueAbout() {
  const t = await getTranslations("home");
  const courts = await loadCourts();
  const hero = courts[0];

  return (
    <section
      id="tentang"
      aria-labelledby="about-title"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
    >
      <Reveal>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <span className="inline-flex items-center rounded-full border border-gp-olive/20 bg-card px-3.5 py-1.5 text-xs font-semibold tracking-wide text-gp-olive uppercase">
              {t("aboutEyebrow")}
            </span>
            <h2
              id="about-title"
              className="font-heading mt-4 text-3xl font-bold tracking-tight sm:text-4xl"
            >
              {t("aboutTitle")}
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {t("aboutBody")}
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              {t("aboutBody2")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink
                href={site.links.maps}
                external
                size="lg"
                className="rounded-full px-5 font-semibold"
              >
                <MapPin className="size-4" aria-hidden="true" />
                {t("aboutCtaMaps")}
              </ButtonLink>
              <ButtonLink
                href={whatsappLink(t("aboutWaMessage"))}
                external
                variant="outline"
                size="lg"
                className="rounded-full border-gp-olive/25 px-5 font-semibold text-gp-olive hover:bg-gp-olive/5"
              >
                {t("aboutCtaWa")}
              </ButtonLink>
            </div>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {courts.map((court) => (
              <li
                key={court.id}
                className="rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10"
              >
                <h3 className="font-heading text-lg font-semibold">{court.name}</h3>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <li>{t("courtIndoor")}</li>
                  <li>{court.surface}</li>
                  <li>{t("courtLighting")}</li>
                  <li>{t("courtDuration", { minutes: court.sessionMinutes })}</li>
                </ul>
              </li>
            ))}
            <li className="rounded-2xl border border-dashed border-gp-olive/25 p-5 text-sm text-muted-foreground sm:col-span-2">
              {hero ? t("courtNote") : null}
            </li>
          </ul>
        </div>
      </Reveal>
    </section>
  );
}
