import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Clock, Stamp } from "lucide-react";
import { InstagramIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import { site } from "@/data/site";

/**
 * Race & Rally Coffee — its own visual identity (deep/mid green accents) on a
 * light surface, clearly a separate brand from court booking.
 */
export async function RaceRally() {
  const t = await getTranslations("home");
  const tc = await getTranslations("cafe");
  const locale = await getLocale();

  return (
    <section
      id="race-rally"
      aria-labelledby="race-rally-title"
      className="scroll-mt-20 bg-[#fefefe] py-14 lg:py-20"
    >
      <Reveal>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-[#f4f4f4] p-6 ring-1 ring-[#074734]/10 sm:p-10">
            <p className="text-xs font-semibold tracking-wide text-[#395b3b] uppercase">
              {t("rrEyebrow")}
            </p>
            <h2
              id="race-rally-title"
              className="font-heading mt-3 text-3xl font-bold tracking-tight text-[#1e2920] sm:text-4xl"
            >
              {t("rrTitle")}
            </h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-[#1e2920]/75">
              {t("rrSubtitle")}
            </p>

            <dl className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-[#fefefe] p-4 ring-1 ring-[#074734]/10">
                <dt className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#395b3b] uppercase">
                  <Clock className="size-3.5" aria-hidden="true" />
                  {t("rrHoursLabel")}
                </dt>
                <dd className="mt-2 text-sm font-medium text-[#1e2920]">
                  {t("rrHours")}
                </dd>
              </div>
              <div className="rounded-2xl bg-[#fefefe] p-4 ring-1 ring-[#074734]/10">
                <dt className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#395b3b] uppercase">
                  <Stamp className="size-3.5" aria-hidden="true" />
                  {t("rrLoyaltyLabel")}
                </dt>
                <dd className="mt-2 text-sm font-medium text-[#1e2920]">
                  {t("rrLoyalty")}
                </dd>
              </div>
              <div className="rounded-2xl bg-[#fefefe] p-4 ring-1 ring-[#074734]/10">
                <dt className="text-xs font-semibold tracking-wide text-[#395b3b] uppercase">
                  {t("rrDeliveryLabel")}
                </dt>
                <dd className="mt-2 text-sm font-medium text-[#1e2920]">
                  {t("rrDelivery")}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink
                href={site.links.cafeInstagram}
                external
                size="lg"
                className="rounded-full bg-[#074734] px-5 font-semibold text-[#f4f4f4] hover:bg-[#074734]/90"
              >
                <InstagramIcon className="size-4" aria-hidden="true" />
                {t("rrCta")}
              </ButtonLink>
              <ButtonLink
                href={`/${locale}/racerallycoffee`}
                variant="outline"
                size="lg"
                className="rounded-full border-[#074734]/30 px-5 font-semibold text-[#074734] hover:bg-[#074734]/5"
              >
                {tc("eyebrow")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </ButtonLink>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
