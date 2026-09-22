"use client";

import * as React from "react";
import NumberFlow from "@number-flow/react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/button-link";
import { site } from "@/data/site";
import { discountPercent, formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";

type DayType = "weekday" | "weekend";
type TierId = "off-peak" | "standard" | "prime";

interface Tier {
  id: TierId;
  highlighted?: boolean;
  /** Discounted price per 60-minute session (IDR), by day type. */
  price: Record<DayType, number>;
  /** Regular (strike-through) price, by day type. */
  strike: Record<DayType, number>;
}

const TIER_IDS: TierId[] = ["off-peak", "standard", "prime"];

/**
 * Tariff tiers for court booking (PRD §8.4). The animated toggle switches
 * between weekday and weekend rates; the highlighted card marks the favourite
 * (prime time) slots. Tier prices come from the rate card (database).
 */
export function PricingTiers({
  tiers,
}: {
  tiers: Record<DayType, { price: number; strike: number }[]>;
}) {
  const t = useTranslations("pricing");
  const [dayType, setDayType] = React.useState<DayType>("weekday");

  const TIERS: Tier[] = TIER_IDS.map((id, index) => {
    const weekday = tiers.weekday[index] ?? tiers.weekday[tiers.weekday.length - 1];
    const weekend = tiers.weekend[index] ?? tiers.weekend[tiers.weekend.length - 1];
    return {
      id,
      highlighted: index === TIER_IDS.length - 1,
      price: { weekday: weekday?.price ?? 0, weekend: weekend?.price ?? 0 },
      strike: { weekday: weekday?.strike ?? 0, weekend: weekend?.strike ?? 0 },
    };
  }).filter((tier) => tier.price.weekday > 0 || tier.price.weekend > 0);

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <div className="mx-auto max-w-xl space-y-2">
        <h2 className="font-heading text-center text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          {t("tierTitle")}
        </h2>
        <p className="text-center text-sm text-muted-foreground sm:text-base">
          {t("tierSubtitle")}
        </p>
      </div>

      <DayTypeToggle value={dayType} onChange={setDayType} />

      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
        {TIERS.map((tier) => (
          <TierCard key={tier.id} tier={tier} dayType={dayType} />
        ))}
      </div>

      <p className="mx-auto max-w-xl text-center text-xs text-muted-foreground">
        {t("tierIncludes")}
      </p>
    </div>
  );
}

function DayTypeToggle({
  value,
  onChange,
}: {
  value: DayType;
  onChange: (value: DayType) => void;
}) {
  const t = useTranslations("pricing");
  const options: { key: DayType; label: string }[] = [
    { key: "weekday", label: t("tierToggleWeekday") },
    { key: "weekend", label: t("tierToggleWeekend") },
  ];

  return (
    <div
      role="group"
      aria-label={t("tierTitle")}
      className="inline-flex items-center gap-1 rounded-full border border-gp-olive/20 bg-card p-1"
    >
      {options.map((option) => {
        const active = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.key)}
            className={cn(
              "relative isolate inline-flex h-11 items-center rounded-full px-5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-gp-olive/40 focus-visible:outline-none",
              active ? "text-gp-light" : "text-gp-olive hover:bg-gp-olive/5"
            )}
          >
            {active && (
              <motion.span
                layoutId="pricing-day-toggle"
                className="absolute inset-0 -z-10 rounded-full bg-gp-olive"
                transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TierCard({ tier, dayType }: { tier: Tier; dayType: DayType }) {
  const t = useTranslations("pricing");
  const highlighted = Boolean(tier.highlighted);
  const price = tier.price[dayType];
  const strike = tier.strike[dayType];
  const discount = discountPercent(price, strike);

  const features = [
    t(`tierHours.${tier.id}.${dayType}`),
    t("tierFeature1"),
    t("tierFeature2"),
    t("tierFeature3"),
    t("tierFeature4"),
    t("tierFeature5"),
    t("tierFeature6"),
  ];

  return (
    <div
      className={cn(
        "relative flex w-full flex-col overflow-hidden rounded-2xl border shadow-sm",
        highlighted
          ? "border-gp-olive bg-gp-olive text-gp-light md:scale-105"
          : "border-gp-olive/15 bg-card text-foreground"
      )}
    >
      <div
        className={cn(
          "relative border-b p-5 sm:p-6",
          highlighted ? "border-gp-light/15" : "border-gp-olive/10"
        )}
      >
        {/* Badges (keep room so they never overlap the tier name) */}
        <div className="mb-4 flex min-h-6 flex-wrap items-center justify-end gap-2">
          {highlighted && (
            <div className="flex items-center gap-1 rounded-md border border-gp-light/25 bg-white/10 px-2 py-0.5 text-xs text-gp-light">
              <Star className="size-3 fill-current" aria-hidden="true" />
              {t("tierBadgePopular")}
            </div>
          )}
          <AnimatePresence mode="popLayout">
            {discount > 0 && (
              <motion.div
                key="discount"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className={cn(
                  "rounded-md px-2 py-0.5 text-xs font-semibold tabular-nums",
                  highlighted
                    ? "bg-gp-rust text-gp-light"
                    : "bg-gp-rust/10 text-gp-rust"
                )}
              >
                −{discount}%
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="font-heading text-lg font-semibold">
          {t(`tierName.${tier.id}`)}
        </div>
        <p
          className={cn(
            "text-sm",
            highlighted ? "text-gp-light/75" : "text-muted-foreground"
          )}
        >
          {t(`tierInfo.${tier.id}`)}
        </p>

        <h3 className="mt-6 mb-1 flex w-max items-end gap-1">
          <NumberFlow
            locales="id-ID"
            format={{ maximumFractionDigits: 0 }}
            prefix="Rp"
            suffix={t("tierPerSession")}
            value={price}
            className="font-heading text-3xl font-extrabold [&::part(suffix)]:text-base [&::part(suffix)]:font-normal"
          />
        </h3>
        <p
          className={cn(
            "text-xs",
            highlighted ? "text-gp-light/70" : "text-muted-foreground"
          )}
        >
          {t("tierNormalLabel")}: <s className="opacity-70">{formatIDR(strike)}</s>
        </p>
      </div>

      <div
        className={cn(
          "space-y-3 p-5 text-sm sm:p-6",
          highlighted ? "bg-white/[0.03] text-gp-light/85" : "text-muted-foreground"
        )}
      >
        {features.map((feature) => (
          <div key={feature} className="flex items-start gap-2">
            <CheckCircle
              className={cn(
                "mt-0.5 size-3.5 shrink-0",
                highlighted ? "text-gp-light" : "text-gp-olive"
              )}
              aria-hidden="true"
            />
            <p>{feature}</p>
          </div>
        ))}
      </div>

      <div
        className={cn(
          "mt-auto w-full border-t p-5 sm:p-6",
          highlighted ? "border-gp-light/15" : "border-gp-olive/10"
        )}
      >
        <ButtonLink
          href={site.links.ayo}
          external
          variant={highlighted ? "default" : "outline"}
          className={cn(
            "w-full rounded-full font-semibold",
            !highlighted &&
              "border-gp-olive/25 text-gp-olive hover:bg-gp-olive/5"
          )}
        >
          {t("tierCta")}
        </ButtonLink>
      </div>
    </div>
  );
}
