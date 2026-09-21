import { useLocale, useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { site } from "@/data/site";
import {
  discountPercent,
  formatHourRange,
  formatIDR,
  isSpecialPrice,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CourtSlot } from "@/data/slots";

/** Hatch pattern used for today's slots that already passed. */
const PAST_HATCH =
  "bg-[repeating-linear-gradient(135deg,transparent_0px,transparent_5px,color-mix(in_srgb,var(--gp-olive)_7%,transparent)_5px,color-mix(in_srgb,var(--gp-olive)_7%,transparent)_10px)]";

/**
 * Every state shares the same box: rounded-xl, same padding and a common
 * min-height, so BOOKED/PASSED chips line up with the normal (available) ones.
 */
const CHIP_BASE =
  "flex min-h-[104px] w-full flex-col rounded-xl border p-2.5 text-center";

/** One hourly slot: available (link to AYO), booked or already passed. */
export function SlotChip({ slot }: { slot: CourtSlot }) {
  const t = useTranslations("availability");
  const locale = useLocale();
  const rangeLabel = formatHourRange(locale, slot.hour, slot.hour + 1);

  // Non-bookable slots (BOOKED / PASSED): same size, but disabled — the
  // cursor signals the visitor cannot press them.
  if (slot.status === "booked" || slot.status === "past") {
    const booked = slot.status === "booked";
    const stateLabel = booked ? t("legendBooked") : t("legendPast");

    return (
      <div
        aria-disabled="true"
        data-status={slot.status}
        aria-label={`${rangeLabel} — ${stateLabel}`}
        className={cn(
          CHIP_BASE,
          "cursor-not-allowed select-none justify-center",
          booked
            ? "border-gp-olive/10 bg-muted"
            : cn("border-gp-olive/10 opacity-60", PAST_HATCH)
        )}
      >
        <span className="block text-[13px] font-semibold tabular-nums text-muted-foreground line-through">
          {rangeLabel}
        </span>
        <span className="mt-1 block text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
          {stateLabel}
        </span>
      </div>
    );
  }

  const discount = discountPercent(slot.price, slot.strike);
  const special = isSpecialPrice(slot.price, slot.strike);

  return (
    <a
      href={site.links.ayo}
      target="_blank"
      rel="noopener noreferrer"
      data-status="available"
      data-special={special ? "true" : undefined}
      aria-label={`${rangeLabel} — ${formatIDR(slot.price)} (${t("regularPrice")} ${formatIDR(slot.strike)}), ${t("book")}${special ? `, ${t("specialBadge")}` : ""}`}
      className={cn(
        CHIP_BASE,
        "justify-between transition-all",
        special
          ? "animate-gp-special-glow border-amber-400 bg-gradient-to-b from-amber-100/80 to-amber-50/40 hover:border-amber-500 hover:from-amber-100 motion-reduce:animate-none dark:border-amber-300/50 dark:from-amber-400/15 dark:to-amber-300/5 dark:hover:border-amber-200/70 dark:hover:from-amber-400/20"
          : "border-rr-mid/60 bg-gradient-to-b from-rr-mid/20 to-rr-mid/10 hover:border-rr-mid hover:from-rr-mid/25 hover:to-rr-mid/15"
      )}
    >
      {special && (
        <span className="animate-gp-special-bounce motion-reduce:animate-none mx-auto mb-1 inline-flex items-center gap-1 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold tracking-wide whitespace-nowrap text-amber-950 uppercase shadow-sm dark:bg-amber-400/25 dark:text-amber-100">
          <Sparkles className="size-3" aria-hidden="true" />
          {t("specialBadge")}
        </span>
      )}

      <span
        className={cn(
          "block text-[13px] font-semibold tabular-nums",
          special ? "text-amber-950" : "text-rr-green"
        )}
      >
        {rangeLabel}
      </span>
      <span className="mt-0.5 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
        <s className="opacity-60">{formatIDR(slot.strike)}</s>
        {discount > 0 && (
          <em
            className={cn(
              "font-semibold not-italic",
              special ? "text-amber-800" : "text-gp-rust"
            )}
          >
            −{discount}%
          </em>
        )}
      </span>
      <span
        className={cn(
          "block text-xs font-semibold",
          special ? "text-amber-900" : "text-rr-green"
        )}
      >
        {formatIDR(slot.price)}
      </span>
      <span
        className={cn(
          "mt-1 block text-[10px] font-semibold tracking-wide uppercase",
          special ? "text-amber-900" : "text-rr-green"
        )}
      >
        {t("book")} →
      </span>
    </a>
  );
}
