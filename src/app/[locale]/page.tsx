import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { AvailabilitySection } from "@/components/home/availability-section";
import { Hero } from "@/components/home/hero";
import { ProofSection } from "@/components/proof/proof-section";
import { routing } from "@/i18n/routing";
import { addDays, nextWeekendISO, toISODate } from "@/data/pricing";
import { loadUiAvailability } from "@/lib/availability-ui";

// Dates & slot availability are time-sensitive (real-time schedule) —
// render per request instead of freezing them at build time.
export const dynamic = "force-dynamic";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const now = new Date();
  const dates = {
    today: toISODate(now),
    tomorrow: toISODate(addDays(now, 1)),
    weekend: nextWeekendISO(now),
  };
  // Real-time schedule — official AYO data only.
  const [today, tomorrow, weekend] = await Promise.all([
    loadUiAvailability(dates.today),
    loadUiAvailability(dates.tomorrow),
    loadUiAvailability(dates.weekend),
  ]);

  return (
    <>
      <Hero today={dates.today} />
      <AvailabilitySection
        availability={{
          today: today.availability,
          tomorrow: tomorrow.availability,
          weekend: weekend.availability,
        }}
        meta={{
          today: today.meta,
          tomorrow: tomorrow.meta,
          weekend: weekend.meta,
        }}
      />
      <ProofSection />
    </>
  );
}
