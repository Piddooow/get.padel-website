import { getTranslations } from "next-intl/server";
import {
  AirVent,
  Armchair,
  Bike,
  Car,
  CigaretteOff,
  CircleDot,
  Clock,
  Coffee,
  CupSoda,
  Droplets,
  Fan,
  GlassWater,
  GraduationCap,
  MoonStar,
  Plug,
  Shirt,
  ShowerHead,
  Snowflake,
  Store,
  Toilet,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import type { FacilityView } from "@/lib/ui-content";
import { site } from "@/data/site";

const ICONS = {
  showerHead: ShowerHead,
  car: Car,
  bike: Bike,
  shirt: Shirt,
  droplets: Droplets,
  toilet: Toilet,
  store: Store,
  wifi: Wifi,
  armchair: Armchair,
  cupSoda: CupSoda,
  moonStar: MoonStar,
  coffee: Coffee,
  snowflake: Snowflake,
  airVent: AirVent,
  glassWater: GlassWater,
  plug: Plug,
  fan: Fan,
  circleDot: CircleDot,
  cigaretteOff: CigaretteOff,
  graduationCap: GraduationCap,
} satisfies Record<FacilityView["icon"], LucideIcon>;

/** Fasilitas & jam buka: 12 item resmi + tambahan (PRD §8.5). */
export async function FacilitiesGrid({
  facilities,
}: {
  facilities: FacilityView[];
}) {
  const t = await getTranslations("location");

  const official = facilities.filter((facility) => facility.official);
  const extras = facilities.filter((facility) => !facility.official);

  const renderGroup = (items: FacilityView[], label: string) => (
    <div>
      <h3 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </h3>
      <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((facility) => {
          const Icon = ICONS[facility.icon];
          return (
            <li
              key={facility.id}
              className="flex items-start gap-2.5 rounded-xl border border-gp-olive/15 bg-card px-3.5 py-3"
            >
              <Icon
                className="mt-0.5 size-4 shrink-0 text-gp-rust"
                aria-hidden="true"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">
                  {facility.title}
                </span>
                {facility.detail && (
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {facility.detail}
                  </span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <section aria-labelledby="location-facilities-title">
      <h2
        id="location-facilities-title"
        className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
      >
        {t("facilitiesTitle")}
      </h2>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        {t("facilitiesSubtitle")}
      </p>

      <div className="mt-6 space-y-8">
        {renderGroup(official, t("facilitiesOfficial"))}
        {renderGroup(extras, t("facilitiesExtra"))}

        <div className="flex flex-col gap-4 rounded-2xl bg-gp-olive p-5 text-gp-light sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="space-y-3 text-sm">
            <div>
              <p className="flex items-center gap-2 font-medium">
                <Clock className="size-4" aria-hidden="true" />
                {t("hoursCourts")}
              </p>
              <p className="mt-1 pl-6 text-xs text-gp-light/75">
                {t("facilitiesHoursNote")}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-2 font-medium">
                <Coffee className="size-4" aria-hidden="true" />
                {t("hoursCafe")}
              </p>
              <p className="mt-1 pl-6 text-xs text-gp-light/75">
                {t("facilitiesCafeNote")}
              </p>
            </div>
          </div>
          <a
            href={site.links.cafeInstagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-gp-light/30 px-4 text-sm font-semibold text-gp-light transition-colors hover:bg-white/10"
          >
            @racerallycoffee
          </a>
        </div>
      </div>
    </section>
  );
}
