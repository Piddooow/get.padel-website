import { useTranslations } from "next-intl";
import { CalendarX2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button-link";
import { site } from "@/data/site";

/** Empty state when a date has no slots left at all. */
export function EmptySlotsNotice() {
  const t = useTranslations("schedule");

  return (
    <div
      role="status"
      className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-gp-olive/25 bg-card px-6 py-12 text-center"
    >
      <span className="inline-flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <CalendarX2 className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="font-heading font-semibold">{t("emptyTitle")}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          {t("emptyBody")}
        </p>
      </div>
      <ButtonLink
        href={site.links.ayo}
        external
        size="sm"
        className="rounded-full font-semibold"
      >
        {t("ctaBook")}
      </ButtonLink>
    </div>
  );
}
