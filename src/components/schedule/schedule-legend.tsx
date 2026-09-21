import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/** Colour legend for slot grids: available / special price / booked / passed. */
export function ScheduleLegend({ className }: { className?: string }) {
  const t = useTranslations("availability");

  const items = [
    {
      key: "available",
      label: t("legendAvailable"),
      swatch: "bg-rr-mid",
    },
    {
      key: "special",
      label: t("legendSpecial"),
      swatch: "bg-amber-400",
    },
    {
      key: "booked",
      label: t("legendBooked"),
      swatch: "bg-muted-foreground/40",
    },
    {
      key: "past",
      label: t("legendPast"),
      swatch:
        "border border-gp-olive/20 bg-[repeating-linear-gradient(135deg,transparent_0px,transparent_3px,color-mix(in_srgb,var(--gp-olive)_25%,transparent)_3px,color-mix(in_srgb,var(--gp-olive)_25%,transparent)_6px)]",
    },
  ];

  return (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground",
        className
      )}
    >
      {items.map((item) => (
        <li key={item.key} className="inline-flex items-center gap-1.5">
          <span
            className={cn("size-2.5 rounded-full", item.swatch)}
            aria-hidden="true"
          />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
