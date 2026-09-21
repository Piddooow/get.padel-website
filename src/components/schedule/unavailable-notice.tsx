"use client";

import { useTranslations } from "next-intl";
import { PlugZap } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button-link";
import { site, whatsappLink } from "@/data/site";

/**
 * Honest placeholder for the schedule: shown when the official AYO real-time
 * feed is not connected (or its data is stale). We deliberately show NO slot
 * grid here — a made-up schedule would be worse than none.
 */
export function UnavailableNotice({
  reason,
}: {
  reason?: "not_synced" | "stale" | "unconfigured" | "error";
}) {
  const t = useTranslations("availability");

  const reasonText =
    reason === "stale"
      ? t("unavailableStale")
      : reason === "unconfigured" || reason === "not_synced"
        ? t("unavailableNotSynced")
        : t("unavailableBody");

  return (
    <div
      role="status"
      className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-gp-olive/25 bg-card px-6 py-12 text-center"
    >
      <span className="inline-flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <PlugZap className="size-5" aria-hidden="true" />
      </span>
      <div>
        <p className="font-heading font-semibold">{t("unavailableTitle")}</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {reasonText}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <ButtonLink
          href={site.links.ayo}
          external
          size="lg"
          className="h-11 min-w-[13rem] justify-center rounded-full px-5 font-semibold"
        >
          {t("unavailableAyoCta")}
        </ButtonLink>
        <ButtonLink
          href={whatsappLink(t("unavailableWaMessage"))}
          external
          variant="outline"
          size="lg"
          className="h-11 min-w-[13rem] justify-center rounded-full border-gp-olive/25 px-5 font-semibold text-gp-olive hover:bg-gp-olive/5"
        >
          <WhatsAppIcon className="size-4" aria-hidden="true" />
          {t("unavailableWaCta")}
        </ButtonLink>
      </div>
    </div>
  );
}
