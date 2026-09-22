"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { MapPin, Navigation } from "lucide-react";
import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/button-link";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";

export type CityKey = "jaktim" | "bekasi";

export const CITY_KEYS: CityKey[] = ["jaktim", "bekasi"];

interface VenueHighlightState {
  active: boolean;
  setActive: (value: boolean) => void;
  cityKey: CityKey;
  setCityKey: (value: CityKey) => void;
}

const VenueHighlightContext = createContext<VenueHighlightState | null>(null);

function useVenueHighlight(): VenueHighlightState {
  const context = useContext(VenueHighlightContext);
  if (!context) {
    throw new Error("VenueHighlight components must be used within a provider.");
  }
  return context;
}

function cityLabel(labels: Record<CityKey, string>, key: CityKey): string {
  return labels[key];
}

/** Google Maps directions from the selected starting city to the venue. */
function directionsHref(origin: string): string {
  const { lat, lng } = site.address.coordinates;
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${lat},${lng}`;
}

/**
 * Links the city filter, map pin and venue card:
 * picking a city updates the pin label and the card's directions link.
 */
export function VenueHighlightProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [active, setActive] = useState(false);
  const [cityKey, setCityKey] = useState<CityKey>("jaktim");
  return (
    <VenueHighlightContext.Provider
      value={{ active, setActive, cityKey, setCityKey }}
    >
      {children}
    </VenueHighlightContext.Provider>
  );
}

/** Venue card wrapper that lights up while the map pin is hovered. */
export function VenueHighlightCard({ children }: { children: ReactNode }) {
  const { active } = useVenueHighlight();
  return (
    <div
      id="venue-card"
      className={cn(
        "rounded-2xl transition-all duration-300",
        active
          ? "ring-4 ring-gp-rust/40 shadow-lg"
          : "ring-1 ring-transparent"
      )}
    >
      {children}
    </div>
  );
}

/** Card CTA: directions from the city selected in the map filter. */
export function VenueDirectionsButton() {
  const t = useTranslations("location");
  const { cityKey } = useVenueHighlight();
  const label = cityLabel(
    { jaktim: t("mapCityJaktim"), bekasi: t("mapCityBekasi") },
    cityKey
  );

  return (
    <ButtonLink
      href={directionsHref(label)}
      external
      variant="outline"
      size="lg"
      className="rounded-full border-gp-olive/25 px-5 font-semibold text-gp-olive hover:bg-gp-olive/5"
    >
      <Navigation className="size-4" aria-hidden="true" />
      {t("directionsFrom", { city: label })}
    </ButtonLink>
  );
}

/** City filter chips — syncs the map pin and the venue card directions. */
export function VenueCityFilter({ className }: { className?: string }) {
  const t = useTranslations("location");
  const { cityKey, setCityKey } = useVenueHighlight();
  const labels = {
    jaktim: t("mapCityJaktim"),
    bekasi: t("mapCityBekasi"),
  };

  return (
    <div className={className}>
      <p className="text-sm font-medium text-gp-olive">{t("mapCityLabel")}</p>
      <div role="group" aria-label={t("mapCityLabel")} className="mt-2 flex flex-wrap gap-2">
        {CITY_KEYS.map((key) => {
          const active = cityKey === key;
          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              onClick={() => setCityKey(key)}
              className={cn(
                "inline-flex h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors",
                active
                  ? "border-gp-olive bg-gp-olive text-gp-light"
                  : "border-gp-olive/20 bg-card text-gp-olive hover:border-gp-olive/40"
              )}
            >
              {cityLabel(labels, key)}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {t("mapCityNote", { city: cityLabel(labels, cityKey) })}
      </p>
    </div>
  );
}

/** Pin chip floating over the map — highlights + scrolls to the venue card. */
export function VenueMapPin({
  name,
  plusCode,
  cta,
}: {
  name: string;
  plusCode: string;
  cta: string;
}) {
  const t = useTranslations("location");
  const { setActive, cityKey } = useVenueHighlight();
  const label = cityLabel(
    { jaktim: t("mapCityJaktim"), bekasi: t("mapCityBekasi") },
    cityKey
  );

  const scrollToCard = () => {
    document
      .getElementById("venue-card")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <button
      type="button"
      aria-label={cta}
      onClick={scrollToCard}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
      className="absolute bottom-4 left-4 inline-flex max-w-[calc(100%-2rem)] items-center gap-2 rounded-full bg-card/95 py-2 pl-2.5 pr-4 text-left shadow-lg ring-1 ring-gp-olive/15 backdrop-blur transition-transform hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-gp-olive/50 focus-visible:outline-none"
    >
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-gp-rust text-gp-light">
        <MapPin className="size-4" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-semibold text-gp-olive">
          {name}
        </span>
        <span className="block text-[11px] text-muted-foreground">
          {plusCode} · {t("mapPinFrom", { city: label })}
        </span>
      </span>
    </button>
  );
}
