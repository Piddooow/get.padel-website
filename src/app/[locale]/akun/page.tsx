import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarDays, ChevronDown, Clock3 } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import { isDatabaseEnabled } from "@/db";
import { getSessionUser } from "@/lib/auth";
import {
  listBookingsForUser,
  syncBookingWithGateway,
  type BookingView,
} from "@/lib/bookings";
import { formatIDR } from "@/lib/format";
import { routing } from "@/i18n/routing";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "account" });

  return {
    title: t("metaTitle"),
    description: t("subtitle"),
    alternates: {
      canonical: `/${resolved}/akun`,
      languages: { id: "/id/akun", en: "/en/akun", "x-default": "/id/akun" },
    },
    // Booking data is private — never indexed.
    robots: { index: false, follow: false },
  };
}

function formatHourRange(locale: string, startHour: number, duration: number) {
  const fmt = (hour: number) =>
    new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(2026, 0, 1, hour));
  return `${fmt(startHour)}–${fmt(startHour + duration)}`;
}

function formatDateTime(locale: string, iso: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "positive" | "pending" | "muted";
}) {
  const tones = {
    positive: "border-rr-mid/50 bg-rr-mid/15 text-rr-green",
    pending: "border-amber-400/60 bg-amber-400/15 text-amber-900",
    muted: "border-gp-olive/20 bg-muted text-muted-foreground",
  } as const;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (!user) {
    redirect(`/${locale}/masuk?next=${encodeURIComponent(`/${locale}/akun`)}`);
  }

  const t = await getTranslations("account");
  const tBooking = await getTranslations("booking");
  const sp = await searchParams;
  const justPaid = (Array.isArray(sp.paid) ? sp.paid[0] : sp.paid) === "1";

  if (!isDatabaseEnabled()) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <Reveal>
          <header className="max-w-2xl">
            <span className="inline-flex items-center rounded-full border border-gp-olive/20 bg-card px-3.5 py-1.5 text-xs font-semibold tracking-wide text-gp-olive uppercase">
              {t("eyebrow")}
            </span>
            <h1 className="font-heading mt-4 text-3xl font-bold tracking-tight">
              {t("title")}
            </h1>
            <p className="mt-4 max-w-xl text-sm text-muted-foreground">
              {t("unavailableBody")}
            </p>
            <div className="mt-6">
              <ButtonLink
                href={`/${locale}/bantuan`}
                size="lg"
                className="rounded-full px-5 font-semibold"
              >
                {t("unavailableCta")}
              </ButtonLink>
            </div>
          </header>
        </Reveal>
      </section>
    );
  }

  const bookings = await listBookingsForUser(user.id);

  // Reconcile anything still awaiting payment with the gateway (webhooks can
  // be delayed); expired holds are released by the same call.
  const synced = await Promise.all(
    bookings.map((booking) =>
      booking.status === "pending_payment"
        ? syncBookingWithGateway(booking.reference, user.id)
        : Promise.resolve(booking)
    )
  );
  const rows = synced.filter((booking): booking is BookingView => Boolean(booking));

  const statusLabel = (booking: BookingView) =>
    tBooking(`status_${booking.status}` as never);
  const paymentLabel = (booking: BookingView) =>
    tBooking(`payment_${booking.paymentStatus}` as never);

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <Reveal>
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center rounded-full border border-gp-olive/20 bg-card px-3.5 py-1.5 text-xs font-semibold tracking-wide text-gp-olive uppercase">
              {t("eyebrow")}
            </span>
            <h1 className="font-heading mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-2 text-muted-foreground">
              {t("greeting", { name: user.name })}
            </p>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {t("subtitle")}
            </p>
          </div>
          <LogoutButton homeHref={`/${locale}`} />
        </header>
      </Reveal>

      {justPaid ? (
        <Reveal delay={60}>
          <p className="mt-6 rounded-2xl border border-rr-mid/40 bg-rr-mid/10 p-4 text-sm font-medium text-rr-green">
            {t("paidBanner")}
          </p>
        </Reveal>
      ) : null}

      {rows.length === 0 ? (
        <Reveal delay={80}>
          <div className="mt-10 flex flex-col items-start gap-4 rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 sm:p-6">
            <span className="inline-flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <CalendarDays className="size-5" aria-hidden="true" />
            </span>
            <p className="font-medium">{t("empty")}</p>
            <ButtonLink
              href={`/${locale}/pesan`}
              size="lg"
              className="rounded-full px-5 font-semibold"
            >
              {t("emptyCta")}
            </ButtonLink>
          </div>
        </Reveal>
      ) : (
        <ul className="mt-10 space-y-4">
          {rows.map((booking, index) => {
            const tone =
              booking.status === "paid"
                ? "positive"
                : booking.status === "pending_payment"
                  ? "pending"
                  : "muted";
            return (
              <li key={booking.reference}>
                <Reveal delay={index * 40}>
                  <details className="group rounded-2xl bg-card ring-1 ring-gp-olive/10 open:ring-gp-olive/20">
                    <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden sm:p-6">
                      <div>
                        <p className="font-heading text-base font-semibold">
                          {booking.courtName} ·{" "}
                          {formatHourRange(
                            locale,
                            booking.startHour,
                            booking.durationHours
                          )}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {booking.date} · {formatIDR(booking.amountIdr)} ·{" "}
                          {t("reference")}: {booking.reference}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge label={statusLabel(booking)} tone={tone} />
                        <ChevronDown
                          className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
                          aria-hidden="true"
                        />
                      </div>
                    </summary>

                    <div className="border-t border-gp-olive/10 p-5 sm:p-6">
                      <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">{t("court")}</dt>
                          <dd className="font-medium">{booking.courtName}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">{t("schedule")}</dt>
                          <dd className="font-medium">
                            {booking.date} ·{" "}
                            {formatHourRange(
                              locale,
                              booking.startHour,
                              booking.durationHours
                            )}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">
                            {tBooking("statusLabel")}
                          </dt>
                          <dd className="font-medium">{statusLabel(booking)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">
                            {tBooking("paymentStatusLabel")}
                          </dt>
                          <dd className="font-medium">{paymentLabel(booking)}</dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">{t("amount")}</dt>
                          <dd className="font-semibold tabular-nums">
                            {formatIDR(booking.amountIdr)}
                          </dd>
                        </div>
                        <div className="flex justify-between gap-3">
                          <dt className="text-muted-foreground">{t("createdAt")}</dt>
                          <dd className="font-medium">
                            {formatDateTime(locale, booking.createdAt)}
                          </dd>
                        </div>
                        {booking.status === "pending_payment" ? (
                          <div className="flex justify-between gap-3">
                            <dt className="text-muted-foreground">
                              {t("expiresAt")}
                            </dt>
                            <dd className="font-medium">
                              {formatDateTime(locale, booking.expiresAt)}
                            </dd>
                          </div>
                        ) : null}
                        {booking.paidAt ? (
                          <div className="flex justify-between gap-3">
                            <dt className="text-muted-foreground">{t("paidAt")}</dt>
                            <dd className="font-medium">
                              {formatDateTime(locale, booking.paidAt)}
                            </dd>
                          </div>
                        ) : null}
                      </dl>

                      <div className="mt-5 flex flex-wrap items-center gap-3">
                        {booking.status === "pending_payment" &&
                        booking.redirectUrl ? (
                          <ButtonLink
                            href={booking.redirectUrl}
                            external
                            size="lg"
                            className="rounded-full px-5 font-semibold"
                          >
                            {t("payNow")}
                          </ButtonLink>
                        ) : null}
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock3 className="size-3.5" aria-hidden="true" />
                          {booking.status === "pending_payment"
                            ? t("pendingBanner")
                            : t("visitNote")}
                        </p>
                      </div>

                      <p className="mt-3 text-[11px] text-muted-foreground">
                        {t("accessNote")}
                      </p>
                    </div>
                  </details>
                </Reveal>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
