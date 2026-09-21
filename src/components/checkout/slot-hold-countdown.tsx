"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Timer, TimerReset } from "lucide-react";
import { cn } from "@/lib/utils";

/** Slot hold window advertised during AYO checkout (PRD Fase 2). */
export const HOLD_SECONDS = 10 * 60;

function formatRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

/**
 * Countdown shown after the visitor starts the AYO checkout: the slot hold is
 * performed by AYO's booking system, this timer just keeps the user oriented.
 */
export function SlotHoldCountdown({ startedAt }: { startedAt: number }) {
  const t = useTranslations("checkout");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const elapsed = Math.floor((now - startedAt) / 1000);
  const remaining = Math.max(0, HOLD_SECONDS - elapsed);
  const expired = remaining === 0;
  const progress = Math.round((remaining / HOLD_SECONDS) * 100);

  return (
    <div
      className={cn(
        "mt-4 rounded-xl border px-4 py-3",
        expired
          ? "border-gp-olive/15 bg-muted/60"
          : "border-gp-rust/30 bg-gp-rust/5"
      )}
    >
      {expired ? (
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-gp-rust">
          <TimerReset className="size-4" aria-hidden="true" />
          {t("holdExpiredTitle")}
        </p>
      ) : (
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-gp-rust">
          <Timer className="size-4" aria-hidden="true" />
          {t("holdTimerLabel")}
        </p>
      )}

      <p
        className={cn(
          "font-heading mt-1.5 text-2xl font-bold tabular-nums",
          expired ? "text-muted-foreground" : "text-gp-rust"
        )}
        role="timer"
        aria-label={t("holdTimerLabel")}
      >
        {formatRemaining(remaining)}
      </p>

      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-gp-olive/10"
        role="presentation"
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-1000 ease-linear motion-reduce:transition-none",
            expired ? "bg-gp-olive/30" : "bg-gp-rust"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        {expired ? t("holdExpiredBody") : t("holdTimerNote")}
      </p>
    </div>
  );
}
