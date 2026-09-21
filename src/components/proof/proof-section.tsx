import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { BlogCards } from "@/components/proof/blog-cards";
import { GalleryLightbox } from "@/components/proof/gallery-lightbox";
import { NewsletterForm } from "@/components/proof/newsletter-form";
import { RatingSummary } from "@/components/proof/rating-summary";
import { TestimonialsMarquee } from "@/components/ui/testimonial-v2";
import { Reveal } from "@/components/ui/reveal";
import {
  loadBlogPosts,
  loadGallery,
  loadTestimonials,
} from "@/lib/ui-content";

/**
 * Proof & Blog (PRD Fase 4): rating summary, real testimonials, venue gallery,
 * latest posts and the newsletter sign-up.
 */
export async function ProofSection() {
  const t = await getTranslations("proof");
  const locale = await getLocale();

  // Database-backed content (with mock fallback) — see lib/ui-content.ts.
  const [testimonials, gallery, blogPosts] = await Promise.all([
    loadTestimonials(locale),
    loadGallery(locale),
    loadBlogPosts(locale, 3),
  ]);

  return (
    <section
      id="kepercayaan"
      aria-labelledby="testimonials-heading"
      className="mx-auto max-w-7xl scroll-mt-20 px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
    >
      {/* Testimonials marquee (replaces the old "trusted by" header) */}
      <div>
        <TestimonialsMarquee
          badge={t("marqueeBadge")}
          title={t("marqueeTitle")}
          subtitle={t("marqueeSubtitle")}
          label={t("testimonialsLabel")}
          testimonials={testimonials.testimonials.map((review) => ({
            id: review.id,
            text: review.quote,
            name: review.author,
            meta: `${
              review.source === "google"
                ? t("sourceGoogle")
                : t("sourceAyo")
            } · ${review.period}`,
            rating: review.rating,
          }))}
        />
      </div>

      {/* Platform ratings */}
      <Reveal delay={80}>
        <div className="mt-12">
          <RatingSummary platforms={testimonials.platforms} />
        </div>
      </Reveal>

      {/* Gallery */}
      <Reveal>
        <div className="mt-14">
          <h3 className="font-heading text-2xl font-bold tracking-tight">
            {t("galleryTitle")}
          </h3>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {t("gallerySubtitle")}
          </p>
        </div>
      </Reveal>
      <Reveal delay={80}>
        <div className="mt-6">
          <GalleryLightbox photos={gallery} />
        </div>
      </Reveal>

      {/* Blog */}
      <Reveal>
        <div className="mt-14">
          <h3 className="font-heading text-2xl font-bold tracking-tight">
            {t("blogTitle")}
          </h3>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {t("blogSubtitle")}
          </p>
        </div>
      </Reveal>
      <Reveal delay={80}>
        <div className="mt-6">
          <BlogCards posts={blogPosts} />
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-6">
          <Link
            href="/blog"
            className="inline-flex text-sm font-semibold text-gp-olive underline-offset-4 hover:underline"
          >
            {t("blogAllCta")}
          </Link>
        </div>
      </Reveal>

      {/* Newsletter */}
      <Reveal>
        <div className="mt-14 rounded-2xl bg-card p-5 ring-1 ring-gp-olive/10 sm:p-8">
          <p className="text-xs font-semibold tracking-wide text-gp-rust uppercase">
            {t("newsletterEyebrow")}
          </p>
          <h3 className="font-heading mt-2 text-2xl font-bold tracking-tight">
            {t("newsletterTitle")}
          </h3>
          <p className="mt-2 max-w-xl text-muted-foreground">
            {t("newsletterSubtitle")}
          </p>
          <div className="mt-5">
            <NewsletterForm />
          </div>
        </div>
      </Reveal>
    </section>
  );
}
