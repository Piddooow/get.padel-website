"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PromoView } from "@/lib/ui-content";
import { cn } from "@/lib/utils";

/**
 * Promo codes & validity reference (PRD Fase 2). Get Padel promos are mostly
 * card/venue-based without codes, so rows expose a copyable code when one
 * exists, otherwise the official reference link.
 */
export function PromoCodes({ promos }: { promos: PromoView[] }) {
  const t = useTranslations("pricing");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copy(id: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      window.setTimeout(
        () => setCopiedId((current) => (current === id ? null : current)),
        2000
      );
    } catch {
      setCopiedId(null);
    }
  }

  // Running promos first; ended promos stay visible as a monochrome archive.
  const sorted = [...promos].sort(
    (a, b) => Number(b.isRunning) - Number(a.isRunning)
  );

  return (
    <div>
      <p className="mb-5 max-w-2xl text-xs text-muted-foreground">
        {t("noCodeNote")}
      </p>

      <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-gp-olive/10">
        <table className="w-full text-sm">
          <caption className="sr-only">{t("promoCodeTitle")}</caption>
          <thead>
            <tr className="border-b border-gp-olive/10 text-xs tracking-wide text-muted-foreground uppercase">
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                {t("columnPromo")}
              </th>
              <th scope="col" className="px-4 py-3 text-left font-semibold">
                {t("columnCode")}
              </th>
              <th
                scope="col"
                className="hidden px-4 py-3 text-left font-semibold sm:table-cell"
              >
                {t("columnPeriod")}
              </th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">
                {t("columnCopy")}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((promo) => {
              const copyValue = promo.link ?? promo.reference ?? "";
              const copied = copiedId === promo.id;
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
                  <td className="px-4 py-3">
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
                  <td className="px-4 py-3 text-right">
                    {copyValue ? (
                      <button
                        type="button"
                        onClick={() => copy(promo.id, copyValue)}
                        aria-label={t("columnCopy")}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                          copied
                            ? "border-gp-rust bg-gp-rust/10 text-gp-rust"
                            : "border-gp-olive/25 text-gp-olive hover:bg-gp-olive/5"
                        )}
                      >
                        {copied ? (
                          <Check className="size-3.5" aria-hidden="true" />
                        ) : (
                          <Copy className="size-3.5" aria-hidden="true" />
                        )}
                        {copied ? t("copied") : t("columnCopy")}
                      </button>
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
