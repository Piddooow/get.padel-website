import { getTranslations } from "next-intl/server";
import { SocialRail } from "@/components/about/social-rail";
import { InstagramIcon } from "@/components/icons";
import { ButtonLink } from "@/components/ui/button-link";
import { Reveal } from "@/components/ui/reveal";
import { socialAccounts, socialPosts } from "@/data/social-posts";

/**
 * Social slides — the venue's own Instagram posts (photos and posters from the
 * official archive), split between @get.padel and @racerallycoffee. Captions
 * are shown exactly as published; every card links back to the original post.
 */
export async function SocialSlides() {
  const t = await getTranslations("about");

  return (
    <section
      id="social"
      aria-labelledby="social-title"
      className="scroll-mt-20 py-12 lg:py-16"
    >
      <Reveal>
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <header className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-gp-rust uppercase">
              {t("socialEyebrow")}
            </p>
            <h2
              id="social-title"
              className="font-heading mt-3 text-3xl font-bold tracking-tight sm:text-4xl"
            >
              {t("socialTitle")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("socialSubtitle")}</p>
          </header>

          <div className="mt-8">
            <SocialRail
              posts={socialPosts}
              openLabel={t("socialCta")}
              prevLabel={t("socialPrev")}
              nextLabel={t("socialNext")}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <ButtonLink
              href={socialAccounts.getpadel.url}
              external
              size="lg"
              className="rounded-full px-5 font-semibold"
            >
              <InstagramIcon className="size-4" aria-hidden="true" />
              {socialAccounts.getpadel.handle}
            </ButtonLink>
            <ButtonLink
              href={socialAccounts.racerallycoffee.url}
              external
              variant="outline"
              size="lg"
              className="rounded-full border-[#074734]/30 px-5 font-semibold text-[#074734] hover:bg-[#074734]/5"
            >
              <InstagramIcon className="size-4" aria-hidden="true" />
              {socialAccounts.racerallycoffee.handle}
            </ButtonLink>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            {t("socialNote")}
          </p>
        </div>
      </Reveal>
    </section>
  );
}
