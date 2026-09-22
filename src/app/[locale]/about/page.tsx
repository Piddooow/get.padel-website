import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, MapPin } from "lucide-react";
import { SocialSlides } from "@/components/about/social-slides";
import { StatsBar } from "@/components/home/stats-bar";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
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
  const t = await getTranslations({ locale: resolved, namespace: "about" });

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: {
      canonical: `/${resolved}/about`,
      languages: {
        id: "/id/about",
        en: "/en/about",
        "x-default": "/id/about",
      },
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("about");
  const th = await getTranslations("home");

  return (
    <>
      <section className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 pt-12 pb-0 sm:px-6 lg:px-8 lg:pt-16">
        <Reveal>
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-wide text-gp-rust uppercase">
              {t("eyebrow")}
            </p>
            <h1 className="font-heading mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              {t("intro")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink
                href={site.links.maps}
                external
                size="lg"
                className="rounded-full px-5 font-semibold"
              >
                <MapPin className="size-4" aria-hidden="true" />
                {th("aboutCtaMaps")}
              </ButtonLink>
              <ButtonLink
                href={whatsappLink(th("aboutWaMessage"))}
                external
                variant="outline"
                size="lg"
                className="rounded-full border-gp-olive/25 px-5 font-semibold text-gp-olive hover:bg-gp-olive/5"
              >
                {th("aboutCtaWa")}
              </ButtonLink>
              <Link
                href="/lokasi"
                className="inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-gp-olive underline-offset-4 hover:underline"
              >
                {t("locationCta")}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <StatsBar />
      </div>

      <section
        aria-labelledby="about-story-title"
        className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
      >
        <Reveal>
          <div className="grid gap-8 rounded-3xl bg-card p-6 ring-1 ring-gp-olive/10 sm:p-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-2xl">
              <Image
                src="/images/venue-front.jpg"
                alt={t("storyImageAlt")}
                fill
                sizes="(min-width: 1024px) 420px, (min-width: 640px) 60vw, 90vw"
                className="object-cover"
              />
            </div>
            <div>
              <h2
                id="about-story-title"
                className="font-heading text-3xl font-bold tracking-tight sm:text-4xl"
              >
                {t("storyTitle")}
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {t("storyBody")}
              </p>
              <div className="mt-6 rounded-2xl bg-gp-olive/5 p-6 ring-1 ring-gp-olive/10">
                <h3 className="font-heading text-xl font-bold tracking-tight">
                  {t("communityTitle")}
                </h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {t("communityBody")}
                </p>
                <Link
                  href="/program"
                  className="mt-5 inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-gp-olive underline-offset-4 hover:underline"
                >
                  {t("communityCta")}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <div className="bg-[#f4f4f4]">
        <SocialSlides />
      </div>
    </>
  );
}
