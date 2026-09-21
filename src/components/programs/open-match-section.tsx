import { getTranslations } from "next-intl/server";
import { Users } from "lucide-react";
import { InstagramIcon } from "@/components/icons";
import { SectionBackdrop } from "@/components/programs/section-backdrop";
import { WhatsAppButton } from "@/components/help/whatsapp-button";
import { ButtonLink } from "@/components/ui/button-link";
import { site, whatsappLink } from "@/data/site";
import { cn } from "@/lib/utils";
import type { OpenMatchView } from "@/lib/ui-content";

/** Open match — joinable community sessions with remaining spots (PRD Fase 3). */
export async function OpenMatchSection({
  matches,
}: {
  matches: OpenMatchView[];
}) {
  const t = await getTranslations("programs");

  return (
    <section
      aria-labelledby="open-match-title"
      className="relative isolate overflow-hidden rounded-3xl p-5 sm:p-8"
    >
      <SectionBackdrop image="/images/hero-getpadel-dusk.jpg" position="center 55%" />
      <h2
        id="open-match-title"
        className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
      >
        {t("openMatchSectionTitle")}
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t("openMatchSectionSubtitle")}
      </p>

      {matches.length === 0 ? (
        <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl bg-card p-5 text-foreground ring-1 ring-gp-olive/10 sm:p-6">
          <span className="inline-flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Users className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-heading font-semibold">{t("openMatchEmptyTitle")}</p>
            <p className="mt-1 max-w-lg text-sm text-muted-foreground">
              {t("openMatchEmptyBody")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink
              href={site.links.instagram}
              external
              size="lg"
              className="h-11 min-w-[13rem] justify-center rounded-full px-5 font-semibold"
            >
              <InstagramIcon className="size-4" aria-hidden="true" />
              {t("eventsEmptyCtaIg")}
            </ButtonLink>
            <WhatsAppButton
              label={t("eventsEmptyCtaWa")}
              variant="outline"
              size="lg"
              className="h-11 min-w-[13rem] justify-center border-gp-olive/25 px-5 text-gp-olive hover:bg-gp-olive/5"
            />
          </div>
        </div>
      ) : (
      <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matches.map((match) => {
          const dayLabel = match.day;
          // Past sessions never reach this list (filtered in the service).
          const full = match.spotsLeft <= 0;
          const joinable = !full && match.startsAt != null;
          const filled = match.spotsTotal - match.spotsLeft;
          const ratio = Math.round((filled / match.spotsTotal) * 100);
          const scarce = joinable && match.spotsLeft <= 2;

          return (
            <li
              key={match.id}
              className="flex flex-col rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 sm:p-6"
            >
              <p className="inline-flex w-fit items-center rounded-full border border-gp-olive/20 px-3 py-1 text-xs font-medium text-gp-olive">
                {dayLabel} · {match.time}
              </p>

              <h3 className="mt-3 font-heading text-base font-semibold">
                {match.level}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {match.courtNote}
              </p>

              {/* Spots left */}
              <div className="mt-4">
                <p
                  className={cn(
                    "inline-flex items-center gap-1.5 text-sm font-semibold",
                    full
                      ? "text-muted-foreground"
                      : scarce
                        ? "text-gp-rust"
                        : "text-gp-olive"
                  )}
                >
                  <Users className="size-4" aria-hidden="true" />
                  {full
                    ? t("openMatchFull")
                    : t("openMatchSpotsLeft", {
                        left: match.spotsLeft,
                        total: match.spotsTotal,
                      })}
                </p>
                <div
                  role="img"
                  aria-label={
                    full
                      ? t("openMatchFull")
                      : t("openMatchSpotsLeft", {
                          left: match.spotsLeft,
                          total: match.spotsTotal,
                        })
                  }
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gp-olive/10"
                >
                  <span
                    className={cn(
                      "block h-full rounded-full",
                      full ? "bg-muted-foreground/50" : "bg-gp-rust"
                    )}
                    style={{ width: `${ratio}%` }}
                  />
                </div>
              </div>

              <div className="mt-auto pt-5">
                {joinable ? (
                  <ButtonLink
                    href={whatsappLink(
                      t("waMatchMessage", { match: `${dayLabel} ${match.time}` })
                    )}
                    external
                    size="lg"
                    className="rounded-full px-5 font-semibold"
                  >
                    {t("openMatchJoinCta")}
                  </ButtonLink>
                ) : (
                  /* Full or no longer available: the Join action is disabled
                     and cannot be clicked. */
                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center rounded-full border border-gp-olive/20 bg-muted px-5 text-sm font-semibold text-muted-foreground"
                  >
                    {match.startsAt
                      ? t("openMatchFullCta")
                      : t("openMatchPendingCta")}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        {t("openMatchNote")}
      </p>
    </section>
  );
}
