import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BookingFlow } from "@/components/checkout/booking-flow";
import { getSessionUser } from "@/lib/auth";
import { isMidtransConfigured } from "@/lib/midtrans";
import { BookingSteps, MemberRefundCards } from "@/components/pricing/booking-info";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { addDays, nextWeekendISO, toISODate } from "@/data/pricing";
import { site, whatsappLink } from "@/data/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "checkout" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${resolved}/pesan`,
      languages: {
        id: "/id/pesan",
        en: "/en/pesan",
        "x-default": "/id/pesan",
      },
    },
  };
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Resolves a `date` query value (preset or ISO) and clamps it into range. */
function resolveInitialDate(
  value: string | undefined,
  now: Date,
  todayISO: string
): string {
  const maxISO = toISODate(addDays(now, 30));
  let resolved = todayISO;

  if (value === "tomorrow") resolved = toISODate(addDays(now, 1));
  else if (value === "weekend") resolved = nextWeekendISO(now);
  else if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) resolved = value;

  if (resolved < todayISO) return todayISO;
  if (resolved > maxISO) return maxISO;
  return resolved;
}

export default async function CheckoutPage({
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

  const sp = await searchParams;
  const t = await getTranslations("checkout");
  const tPricing = await getTranslations("pricing");
  const tCommon = await getTranslations("common");

  const now = new Date();
  const todayISO = toISODate(now);
  const [user] = await Promise.all([getSessionUser()]);

  const initialHourParam = Number(first(sp.hour));
  const initialDurationParam = Number(first(sp.duration));

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      {/* Page intro */}
      <Reveal>
        <header className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-gp-olive/20 bg-card px-3.5 py-1.5 text-xs font-semibold tracking-wide text-gp-olive uppercase">
            {t("eyebrow")}
          </span>
          <h1 className="font-heading mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <ButtonLink
              href={`/${locale}/jadwal`}
              variant="outline"
              size="lg"
              className="rounded-full border-gp-olive/25 px-6 font-semibold text-gp-olive hover:bg-gp-olive/5"
            >
              {t("seeSchedule")}
            </ButtonLink>
            <ButtonLink
              href={whatsappLink(tCommon("waMessage"))}
              external
              variant="outline"
              size="lg"
              className="rounded-full border-gp-olive/25 px-6 font-semibold text-gp-olive hover:bg-gp-olive/5"
            >
              {t("ctaWa")}
            </ButtonLink>
          </div>
        </header>
      </Reveal>

      {/* Guided flow */}
      <Reveal className="mt-14">
        <BookingFlow
          user={user}
          paymentReady={isMidtransConfigured()}
          initialDate={resolveInitialDate(first(sp.date), now, todayISO)}
          initialCourtId={first(sp.court)}
          initialHour={Number.isInteger(initialHourParam) ? initialHourParam : undefined}
          initialDuration={
            Number.isInteger(initialDurationParam)
              ? initialDurationParam
              : undefined
          }
        />
      </Reveal>

      <div className="mt-14 space-y-16 lg:mt-16 lg:space-y-20">
        {/* Booking steps */}
        <Reveal>
          <section aria-labelledby="flow-steps-title">
            <h2
              id="flow-steps-title"
              className="font-heading text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {tPricing("bookingTitle")}
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              {tPricing("bookingSubtitle")}
            </p>
            <div className="mt-6">
              <BookingSteps />
            </div>
          </section>
        </Reveal>

        {/* Membership + refund info — before paying */}
        <Reveal>
          <MemberRefundCards />
        </Reveal>

        {/* Closing CTA */}
        <Reveal>
          <div className="flex flex-col items-center gap-3 text-center">
            <h2 className="font-heading text-2xl font-bold tracking-tight">
              {tPricing("ctaTitle")}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {tPricing("ctaBody")}
            </p>
            <ButtonLink
              href={site.links.ayo}
              external
              size="lg"
              className="mt-1 rounded-full px-6 font-semibold"
            >
              {t("ctaBook")}
            </ButtonLink>
            <p className="text-xs text-muted-foreground">
              {tCommon("openDaily")} · {tCommon("tagline")}
            </p>
            <Link
              href="/pesan/konfirmasi"
              className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              {t("confirmationLink")}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
