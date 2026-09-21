import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { cn } from "@/lib/utils";
import type { PromoView } from "@/lib/ui-content";

/**
 * Detail & terms of every promo (PRD Fase 2: kode/syarat & masa berlaku).
 * Running promos render normally; ended promos move to a monochrome archive
 * with a "no longer valid" placeholder instead of a call to action.
 */
export async function PromoList({ promos }: { promos: PromoView[] }) {
  const t = await getTranslations("pricing");

  const running = promos.filter((promo) => promo.isRunning);
  const archived = promos.filter((promo) => !promo.isRunning);

  const renderCard = (promo: PromoView, expired: boolean) => (
    <article
      key={promo.id}
      data-promo-state={expired ? "expired" : "running"}
      className={cn(
        "flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 sm:p-6",
        expired
          ? "opacity-70 ring-gp-olive/10 grayscale"
          : "ring-gp-olive/10"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3
          className={cn(
            "font-heading text-base font-semibold",
            expired && "text-muted-foreground"
          )}
        >
          {promo.title}
        </h3>
        {expired ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {t("promoExpiredBadge")}
          </span>
        ) : (
          promo.link && (
            <ButtonLink
              href={promo.link}
              external
              size="sm"
              className="rounded-full font-semibold"
            >
              {t("promoLinkCta")}
            </ButtonLink>
          )
        )}
      </div>

      <p className="text-sm leading-relaxed text-muted-foreground">
        {promo.detail}
      </p>
      {expired && (
        <p className="text-xs text-muted-foreground italic">
          {t("promoExpiredNote")}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-1">
        <Badge
          variant="outline"
          className={cn(
            "border-gp-olive/20",
            expired && "border-gp-olive/10 text-muted-foreground"
          )}
        >
          {t("periodLabel")}: {promo.period}
        </Badge>
        {promo.source && (
          <span className="text-xs text-muted-foreground">
            {t("sourceLabel")}: {promo.source}
          </span>
        )}
      </div>
    </article>
  );

  return (
    <div className="space-y-10">
      <div className="grid gap-4 md:grid-cols-2">
        {running.map((promo) => renderCard(promo, false))}
      </div>

      {archived.length > 0 && (
        <div>
          <h3 className="font-heading text-xl font-bold tracking-tight text-muted-foreground">
            {t("promoArchiveTitle")}
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("promoArchiveSubtitle")}
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {archived.map((promo) => renderCard(promo, true))}
          </div>
        </div>
      )}
    </div>
  );
}
