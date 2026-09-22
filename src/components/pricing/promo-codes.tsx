"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import type { PromoView } from "@/lib/ui-content";
import { cn } from "@/lib/utils";

/**
 * Promo codes & validity reference (PRD Fase 2). Get Padel promos are mostly
 * card/venue-based without codes, so rows expose a copyable code when one
 * exists, otherwise the official reference link.
 */
export function PromoCodes({ promos }: { promos: PromoView[] }) {
  const t = useTranslations("pricing");

  // Ordered by validity: running promos first (soonest end date on top,
  // open-ended after them), then everything that is no longer valid — most
  // recently ended first. Ended promos stay visible as a monochrome archive.
  const sorted = [...promos].sort((a, b) => {
    if (a.isRunning !== b.isRunning) return Number(b.isRunning) - Number(a.isRunning);
    if (a.isRunning) {
      if (!a.endsOn && !b.endsOn) return 0;
      if (!a.endsOn) return 1;
      if (!b.endsOn) return -1;
      return a.endsOn.localeCompare(b.endsOn);
    }
    return (b.endsOn ?? "").localeCompare(a.endsOn ?? "");
  });

  return (
    <div>
      <p className="mb-5 max-w-2xl text-xs text-muted-foreground">
        {t("noCodeNote")}
      </p>

      <div className="min-w-0 max-w-full overflow-x-auto rounded-2xl bg-card ring-1 ring-gp-olive/10">
        <table className="w-full text-sm">
          <caption className="sr-only">{t("promoCodeTitle")}</caption>
          <thead>
            <tr className="border-b border-gp-olive/10 text-xs tracking-wide text-muted-foreground uppercase">
              <th scope="col" className="px-2 py-3 sm:px-4 text-left font-semibold">
                {t("columnPromo")}
              </th>
              <th scope="col" className="px-2 py-3 sm:px-4 text-left font-semibold">
                {t("columnCode")}
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 text-left font-semibold sm:table-cell"
              >
                {t("columnPeriod")}
              </th>
              <th scope="col" className="px-2 py-3 sm:px-4 text-right font-semibold">
                {t("columnCopy")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((promo) => {
              const copyValue = promo.link ?? promo.reference ?? "";
              const expired = !promo.isRunning;
              return (
                <tr
                  key={promo.id}
                  data-promo-state={expired ? "expired" : "running"}
                  className={cn(
                    "border-b border-gp-olive/10 last:border-b-0",
                    expired && "text-muted-foreground opacity-70 grayscale"
                  )}
                >
                  <th
                    scope="row"
                    className="max-w-[220px] px-4 py-3 text-left font-medium"
                  >
                    {promo.title}
                    <span className="mt-1 block text-xs font-normal text-muted-foreground sm:hidden">
                      {promo.period}
                    </span>
                  </th>
                  <td className="px-2 py-3 sm:px-4">
                    <Badge
                      variant="outline"
                      className="border-gp-olive/20 text-muted-foreground"
                    >
                      {t("noCode")}
                    </Badge>
                  </td>
                  <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                    {promo.period}
                  </td>
                  <td className="px-2 py-3 sm:px-4 text-right">
                    {copyValue ? (
                      <CopyButton
                        value={copyValue}
                        label={t("columnCopy")}
                      />
                    
                    ) : expired ? (
                      <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                        {t("promoExpiredBadge")}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {t("nothingToCopy")}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
