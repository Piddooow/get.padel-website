import { getTranslations } from "next-intl/server";
import { Clock3, LayoutGrid, Star, Trophy } from "lucide-react";

const STAT_KEYS = ["courts", "rating", "ayo", "hours"] as const;

const STAT_ICONS: Record<(typeof STAT_KEYS)[number], React.ReactNode> = {
  courts: <LayoutGrid className="size-4" />,
  rating: <Star className="size-4" />,
  ayo: <Trophy className="size-4" />,
  hours: <Clock3 className="size-4" />,
};

/**
 * Short venue stat bar (PRD Fase 1): 2 indoor courts, 5.0 Google rating,
 * AYO ratings, daily slots. Uses the site's white card surface (bg-card,
 * 1px gp-olive/10 lines, rounded-3xl) so it reads the same on the dark hero
 * and on light pages. Figures are static content for now.
 */
export async function StatsBar() {
  const t = await getTranslations("stats");

  return (
    <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-gp-olive/10 p-px sm:grid-cols-4">
      {STAT_KEYS.map((key, index) => (
        <div
          key={key}
          className="animate-in fade-in slide-in-from-bottom-2 flex flex-col gap-1 bg-gp-light px-4 py-5 duration-700 sm:px-5"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <dt className="order-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-gp-olive/80 uppercase">
            <span className="text-gp-olive/50" aria-hidden="true">
              {STAT_ICONS[key]}
            </span>
            {t(`${key}.label`)}
          </dt>
          <dd className="font-heading order-1 text-2xl font-bold tracking-tight text-gp-olive tabular-nums sm:text-3xl">
            {t(`${key}.value`)}
          </dd>
          <p className="order-3 text-[11px] text-muted-foreground">
            {t(`${key}.sub`)}
          </p>
        </div>
      ))}
    </dl>
  );
}
