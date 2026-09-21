import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { SlotChip } from "@/components/schedule/slot-chip";
import type { CourtAvailability } from "@/data/slots";

/** One court card: name, indoor badge, available count and the slot grid. */
export function CourtSlotCard({
  availability,
}: {
  availability: CourtAvailability;
}) {
  const t = useTranslations("availability");
  const tFilters = useTranslations("filters");
  const { court, slots, availableCount } = availability;

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-gp-olive/10 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-heading text-lg font-semibold">{court.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t("courtHours")}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Badge variant="outline" className="border-gp-olive/25 text-gp-olive">
            {tFilters("indoor")}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {t("slotCount", { count: availableCount })}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {slots.map((slot) => (
          <SlotChip key={`${slot.courtId}-${slot.hour}`} slot={slot} />
        ))}
      </div>

      {availableCount === 0 && (
        <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          {t("emptyCourt")}
        </p>
      )}
    </div>
  );
}
