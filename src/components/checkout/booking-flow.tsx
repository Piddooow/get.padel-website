"use client";

/**
 * Book & Pay flow — 3 steps on real data only:
 *   1. pick a date + slot (live availability from the official AYO feed)
 *   2. review the summary (price from the official rate card)
 *   3. sign in and pay via Midtrans Snap (slot locked once payment settles)
 *
 * Nothing here is mocked: when the AYO feed is unavailable the grid is
 * replaced by an honest notice pointing at the official channels, and every
 * booking is re-validated server-side before a payment page is created.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, CalendarDays, Check, Clock, LockKeyhole } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { UnavailableNotice } from "@/components/schedule/unavailable-notice";
import { ButtonLink } from "@/components/ui/button-link";
import { site, whatsappLink } from "@/data/site";
import { formatIDR } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SlotDto {
  hour: number;
  status: "available" | "booked" | "past";
  price: number;
  strike: number;
}

interface CourtDto {
  courtId: string;
  name: string;
  slots: SlotDto[];
}

interface AvailabilityPayload {
  courts: CourtDto[];
  dataSource: "ayo" | "unavailable";
  reason?: "not_synced" | "stale" | "unconfigured" | "error";
  syncedAt: string | null;
}

export interface BookingFlowUser {
  id: string;
  name: string;
  email: string;
  whatsapp?: string | null;
}

interface BookingFlowProps {
  initialDate: string;
  initialCourtId?: string;
  initialHour?: number;
  initialDuration?: number;
  user: BookingFlowUser | null;
  /** False while the Midtrans keys are missing — the UI falls back to AYO. */
  paymentReady: boolean;
}

type BookingErrorKey =
  | "errorSlotTaken"
  | "errorPast"
  | "errorAyo"
  | "errorPaymentOff"
  | "errorPayment"
  | "errorAuth"
  | "errorGeneric";

const ERROR_KEYS: Record<string, BookingErrorKey> = {
  SLOT_TAKEN: "errorSlotTaken",
  SLOT_UNAVAILABLE: "errorSlotTaken",
  PAST: "errorPast",
  OUT_OF_HOURS: "errorPast",
  AYO_UNAVAILABLE: "errorAyo",
  PAYMENT_UNCONFIGURED: "errorPaymentOff",
  PAYMENT_ERROR: "errorPayment",
  INVALID_INPUT: "errorGeneric",
  UNAUTHORIZED: "errorAuth",
};

function formatHourRange(locale: string, startHour: number, duration: number) {
  const fmt = (hour: number) =>
    new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(2026, 0, 1, hour));
  return `${fmt(startHour)}–${fmt(startHour + duration)}`;
}

function formatDay(locale: string, iso: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${iso}T12:00:00`));
}

/** Seven selectable days starting today (system clock, no seeded dates). */
function buildDayStrip(locale: string, todayISO: string, selectedISO: string) {
  const base = new Date(`${todayISO}T12:00:00`);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() + index);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return { iso, label: formatDay(locale, iso) };
  });
  if (!days.some((day) => day.iso === selectedISO)) {
    days.unshift({ iso: selectedISO, label: formatDay(locale, selectedISO) });
  }
  return days;
}

export function BookingFlow({
  initialDate,
  initialCourtId,
  initialHour,
  initialDuration = 1,
  user,
  paymentReady,
}: BookingFlowProps) {
  const t = useTranslations("booking");
  const locale = useLocale();

  const [date, setDate] = useState(initialDate);
  const [duration, setDuration] = useState(
    initialDuration >= 1 && initialDuration <= 3 ? initialDuration : 1
  );
  const [availability, setAvailability] = useState<{
    key: string;
    payload: AvailabilityPayload;
  } | null>(null);
  const [selected, setSelected] = useState<{ courtId: string; hour: number } | null>(
    initialCourtId && initialHour != null
      ? { courtId: initialCourtId, hour: initialHour }
      : null
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<BookingErrorKey | null>(null);
  // "Isi data" step — prefilled from the account, editable, validated.
  const [contactName, setContactName] = useState(user?.name ?? "");
  const [contactWhatsapp, setContactWhatsapp] = useState(user?.whatsapp ?? "");
  const contactNameValid = contactName.trim().length >= 2;
  const contactWhatsappValid = /^(\+?62|0)8\d{7,12}$/.test(
    contactWhatsapp.replace(/[\s-]/g, "")
  );
  const contactValid = contactNameValid && contactWhatsappValid;

  const days = useMemo(
    () => buildDayStrip(locale, initialDate, date),
    [locale, initialDate, date]
  );

  const loadAvailability = useCallback(async (iso: string) => {
    try {
      const response = await fetch(`/api/availability?date=${iso}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as AvailabilityPayload;
      setAvailability({
        key: iso,
        payload: {
          courts: data.courts ?? [],
          dataSource: data.dataSource === "ayo" ? "ayo" : "unavailable",
          reason: data.reason,
          syncedAt: data.syncedAt ?? null,
        },
      });
    } catch {
      setAvailability({
        key: iso,
        payload: { courts: [], dataSource: "unavailable", reason: "error", syncedAt: null },
      });
    }
  }, []);

  useEffect(() => {
    // Deferred like the rest of the codebase so the fetch never triggers a
    // cascading render inside the effect itself.
    const timeout = window.setTimeout(() => {
      void loadAvailability(date);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [date, loadAvailability]);

  const payload = availability?.key === date ? availability.payload : null;
  const loading = availability?.key !== date;
  const courts = payload?.courts ?? [];
  const unavailable = payload?.dataSource === "unavailable";

  const selectedCourt = courts.find((court) => court.courtId === selected?.courtId);
  const hours =
    selected != null
      ? Array.from({ length: duration }, (_, index) => selected.hour + index)
      : [];
  const blockSlots = selectedCourt?.slots.filter((slot) => hours.includes(slot.hour)) ?? [];
  const blockAvailable =
    blockSlots.length === duration &&
    blockSlots.every((slot) => slot.status === "available");
  const total = blockSlots.reduce((sum, slot) => sum + slot.price, 0);
  const strikeTotal = blockSlots.reduce((sum, slot) => sum + slot.strike, 0);

  const signInHref = `/${locale}/masuk?next=${encodeURIComponent(
    `/${locale}/pesan?date=${date}${selected ? `&court=${selected.courtId}&hour=${selected.hour}` : ""}`
  )}`;

  async function handlePay() {
    if (!selected || !blockAvailable || submitting) return;
    setSubmitting(true);
    setErrorKey(null);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courtId: selected.courtId,
          date,
          startHour: selected.hour,
          durationHours: duration,
          contact: {
            name: contactName.trim(),
            whatsapp: contactWhatsapp.trim(),
          },
        }),
      });
      const data = (await response.json()) as {
        booking?: { redirectUrl: string | null };
        error?: { code: string };
      };

      if (!response.ok) {
        setErrorKey(ERROR_KEYS[data.error?.code ?? ""] ?? "errorGeneric");
        // The slot may have just been taken — refresh the grid.
        void loadAvailability(date);
        return;
      }

      if (data.booking?.redirectUrl) {
        window.location.href = data.booking.redirectUrl;
        return;
      }
      setErrorKey("errorPayment");
    } catch {
      setErrorKey("errorGeneric");
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) {
    return (
      <div className="rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 sm:p-8">
        <span className="inline-flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <LockKeyhole className="size-5" aria-hidden="true" />
        </span>
        <h2 className="font-heading mt-4 text-lg font-semibold">
          {t("loginGateTitle")}
        </h2>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          {t("loginGateBody")}
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-gp-olive/20 px-3 py-1.5 text-xs font-medium text-gp-olive">
          <CalendarDays className="size-3.5" aria-hidden="true" />
          {t("loginGateSteps")}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <ButtonLink
            href={signInHref}
            size="lg"
            className="h-11 rounded-full px-6 font-semibold"
          >
            {t("ctaSignIn")}
          </ButtonLink>
          <ButtonLink
            href={whatsappLink(t("waMessage"))}
            external
            variant="outline"
            size="lg"
            className="h-11 rounded-full border-gp-olive/25 px-6 font-semibold text-gp-olive hover:bg-gp-olive/5"
          >
            <WhatsAppIcon className="size-4" aria-hidden="true" />
            {t("ctaWa")}
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      {/* Step 1 — date + slots */}
      <div>
        <h2 className="font-heading text-lg font-semibold">{t("step1Title")}</h2>

        <div className="mt-4 flex flex-wrap gap-2">
          {days.map((day) => (
            <button
              key={day.iso}
              type="button"
              onClick={() => {
                setDate(day.iso);
                setSelected(null);
                setErrorKey(null);
              }}
              aria-pressed={day.iso === date}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                day.iso === date
                  ? "border-gp-olive bg-gp-olive text-gp-light"
                  : "border-gp-olive/20 bg-card text-gp-olive hover:border-gp-olive/40"
              )}
            >
              <CalendarDays className="size-3.5" aria-hidden="true" />
              {day.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{t("durationLabel")}</span>
          {[1, 2, 3].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setDuration(value)}
              aria-pressed={value === duration}
              className={cn(
                "rounded-full border px-2.5 py-1 font-semibold transition-colors",
                value === duration
                  ? "border-gp-rust bg-gp-rust text-gp-light"
                  : "border-gp-olive/20 text-gp-olive hover:border-gp-olive/40"
              )}
            >
              {value} {t("hourUnit")}
            </button>
          ))}
        </div>

        {loading ? (
          <p role="status" className="mt-6 text-sm text-muted-foreground">
            {t("loading")}
          </p>
        ) : unavailable ? (
          <div className="mt-6">
            <UnavailableNotice reason={payload?.reason} />
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {courts.map((court) => (
              <div
                key={court.courtId}
                className="rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10"
              >
                <h3 className="font-heading text-base font-semibold">{court.name}</h3>
                <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {court.slots.map((slot) => {
                    const isSelected =
                      selected?.courtId === court.courtId && selected?.hour === slot.hour;
                    const disabled = slot.status !== "available";
                    return (
                      <li key={slot.hour}>
                        <button
                          type="button"
                          disabled={disabled}
                          aria-disabled={disabled}
                          aria-pressed={isSelected}
                          onClick={() => {
                            setSelected({ courtId: court.courtId, hour: slot.hour });
                            setErrorKey(null);
                          }}
                          className={cn(
                            "flex w-full flex-col items-center rounded-xl border p-2.5 text-center transition-colors",
                            disabled
                              ? "cursor-not-allowed border-gp-olive/10 bg-muted/60 text-muted-foreground"
                              : isSelected
                                ? "border-gp-rust bg-gp-rust/10 text-gp-rust"
                                : "border-rr-mid/60 bg-gradient-to-b from-rr-mid/20 to-rr-mid/10 text-rr-green hover:border-rr-mid"
                          )}
                        >
                          <span className="block text-[13px] font-semibold tabular-nums">
                            {formatHourRange(locale, slot.hour, 1)}
                          </span>
                          <span className="block text-xs font-semibold tabular-nums">
                            {slot.status === "available" ? formatIDR(slot.price) : t("slotTaken")}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Steps 2–3 — summary + payment */}
      <aside className="h-fit rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 lg:sticky lg:top-24">
        <h2 className="font-heading text-lg font-semibold">{t("step2Title")}</h2>

        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("fieldDate")}</dt>
            <dd className="font-medium">{formatDay(locale, date)}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("fieldCourt")}</dt>
            <dd className="font-medium">{selectedCourt?.name ?? "—"}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-muted-foreground">{t("fieldTime")}</dt>
            <dd className="font-medium">
              {selected ? formatHourRange(locale, selected.hour, duration) : "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-gp-olive/10 pt-2">
            <dt className="text-muted-foreground">{t("fieldTotal")}</dt>
            <dd className="font-heading text-base font-bold text-primary tabular-nums">
              {selected ? formatIDR(total) : "—"}
              {strikeTotal > total ? (
                <s className="ml-2 text-xs font-medium text-muted-foreground">
                  {formatIDR(strikeTotal)}
                </s>
              ) : null}
            </dd>
          </div>
        </dl>

        <p className="mt-3 text-xs text-muted-foreground">{t("includes")}</p>

        {/* Step 3 — details used for the confirmation & payment receipt */}
        <div className="mt-5 rounded-xl border border-gp-olive/15 bg-gp-olive/[0.03] p-4">
          <p className="font-heading text-sm font-semibold">{t("dataTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("dataSubtitle")}
          </p>

          <label className="mt-3 block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t("dataNameLabel")}
            <input
              value={contactName}
              onChange={(event) => {
                setContactName(event.target.value);
                setErrorKey(null);
              }}
              autoComplete="name"
              placeholder={t("dataNamePlaceholder")}
              aria-invalid={!contactNameValid}
              className="mt-1 w-full rounded-lg border border-gp-olive/20 bg-card px-3 py-2 text-sm font-normal normal-case outline-none transition-colors focus:border-gp-rust focus:ring-2 focus:ring-gp-rust/20"
            />
          </label>
          {!contactNameValid && contactName.length > 0 ? (
            <p className="mt-1 text-[11px] font-medium text-destructive">
              {t("errorDataName")}
            </p>
          ) : null}

          <label className="mt-3 block text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {t("dataWhatsappLabel")}
            <input
              value={contactWhatsapp}
              onChange={(event) => {
                setContactWhatsapp(event.target.value);
                setErrorKey(null);
              }}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder={t("dataWhatsappPlaceholder")}
              aria-invalid={!contactWhatsappValid}
              className="mt-1 w-full rounded-lg border border-gp-olive/20 bg-card px-3 py-2 text-sm font-normal normal-case outline-none transition-colors focus:border-gp-rust focus:ring-2 focus:ring-gp-rust/20"
            />
          </label>
          {!contactWhatsappValid && contactWhatsapp.length > 0 ? (
            <p className="mt-1 text-[11px] font-medium text-destructive">
              {t("errorDataWhatsapp")}
            </p>
          ) : null}

          <p className="mt-3 text-[11px] text-muted-foreground">
            {t("dataEmailNote", { email: user.email })}
          </p>
        </div>

        {errorKey ? (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive"
          >
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            {t(errorKey)}
          </p>
        ) : null}

        <div className="mt-5 space-y-3">
          {!paymentReady ? (
            <>
              <p className="text-xs text-muted-foreground">{t("errorPaymentOff")}</p>
              <ButtonLink
                href={site.links.ayo}
                external
                size="lg"
                className="h-11 w-full justify-center rounded-full font-semibold"
              >
                {t("ctaAyo")}
              </ButtonLink>
              <ButtonLink
                href={whatsappLink(t("waMessage"))}
                external
                variant="outline"
                size="lg"
                className="h-11 w-full justify-center rounded-full border-gp-olive/25 font-semibold text-gp-olive hover:bg-gp-olive/5"
              >
                <WhatsAppIcon className="size-4" aria-hidden="true" />
                {t("ctaWa")}
              </ButtonLink>
            </>
          ) : !user ? (
            <>
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <LockKeyhole className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                {t("loginNote")}
              </p>
              <ButtonLink
                href={signInHref}
                size="lg"
                className="h-11 w-full justify-center rounded-full font-semibold"
              >
                {t("ctaSignIn")}
              </ButtonLink>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handlePay}
                disabled={!blockAvailable || !contactValid || submitting}
                aria-disabled={!blockAvailable || submitting}
                className={cn(
                  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors",
                  !blockAvailable || !contactValid || submitting
                    ? "cursor-not-allowed bg-muted text-muted-foreground"
                    : "bg-gp-rust text-gp-light hover:bg-gp-rust/90"
                )}
              >
                {submitting ? (
                  <Clock className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="size-4" aria-hidden="true" />
                )}
                {t("ctaPay")}
              </button>
              <p className="text-xs text-muted-foreground">{t("payNote")}</p>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
