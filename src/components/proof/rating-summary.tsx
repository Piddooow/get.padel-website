import { getLocale, getTranslations } from "next-intl/server";
import { PlatformRating } from "@/components/proof/platform-rating";
import { site } from "@/data/site";

export interface RatingPlatforms {
  google: { score: number | null; count: number | null };
  ayo: { score: number | null; count: number | null };
  sub: {
    cleanliness: number | null;
    courtCondition: number | null;
    communication: number | null;
  };
}

/** Rating summary: Google + Ayo scores with the Ayo sub-ratings. */
export async function RatingSummary({
  platforms,
}: {
  platforms: RatingPlatforms;
}) {
  const t = await getTranslations("location");
  const locale = await getLocale();

  const score = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });

  const subs = [
    { label: t("ratingSubCleanliness"), value: platforms.sub.cleanliness },
    { label: t("ratingSubCourt"), value: platforms.sub.courtCondition },
    {
      label: t("ratingSubCommunication"),
      value: platforms.sub.communication,
    },
  ];

  const sources = [
    {
      key: "google" as const,
      label: "Google Maps",
      score: score.format(platforms.google.score ?? 0),
      countLabel: t("ratingCountGoogle", { count: platforms.google.count ?? 0 }),
      href: site.links.maps,
    },
    {
      key: "ayo" as const,
      label: "Ayo.co.id",
      score: score.format(platforms.ayo.score ?? 0),
      countLabel: t("ratingCountAyo", { count: platforms.ayo.count ?? 0 }),
      href: site.links.ayo,
    },
  ];

  return (
    <div className="rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 sm:p-6">
      <div className="grid grid-cols-2 gap-3">
        {sources.map((source) => (
          <PlatformRating
            key={source.key}
            label={source.label}
            score={source.score}
            countLabel={source.countLabel}
            href={source.href}
          />
        ))}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-gp-olive/10 pt-4 text-center">
        {subs.map((sub) => (
          <div key={sub.label}>
            <dd className="font-heading text-sm font-bold tabular-nums text-gp-olive">
              {score.format(sub.value ?? 0)}
            </dd>
            <dt className="mt-0.5 text-[11px] text-muted-foreground">
              {sub.label}
            </dt>
          </div>
        ))}
      </dl>

    </div>
  );
}
