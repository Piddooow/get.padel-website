import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Hero } from "@/components/home/hero";
import { RaceRally } from "@/components/home/race-rally";
import { VenueAbout } from "@/components/home/venue-about";
import { ProofSection } from "@/components/proof/proof-section";
import { routing } from "@/i18n/routing";

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

  return (
    <>
      <Hero />
      <VenueAbout />
      <RaceRally />
      <ProofSection />
    </>
  );
}
