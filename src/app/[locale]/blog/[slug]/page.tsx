import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Clock } from "lucide-react";
import { ArticleCover } from "@/components/proof/article-cover";
import { ButtonLink } from "@/components/ui/button-link";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/reveal";
import { routing } from "@/i18n/routing";
import { site } from "@/data/site";
import { loadBlogPost, loadBlogPosts } from "@/lib/ui-content";

// Content comes from the database; refresh periodically and allow new slugs.
export const revalidate = 300;

export async function generateStaticParams() {
  const posts = await loadBlogPosts("id", 20);
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const resolved = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const post = await loadBlogPost(resolved, slug);
  if (!post) {
    return { title: "Get Padel Jakarta" };
  }

  return {
    title: `${post.title} — Get Padel Jakarta`,
    description: post.excerpt,
    alternates: {
      canonical: `/${resolved}/blog/${post.slug}`,
      languages: {
        id: `/id/blog/${post.slug}`,
        en: `/en/blog/${post.slug}`,
        "x-default": `/id/blog/${post.slug}`,
      },
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const resolvedLocale = await getLocale();
  const post = await loadBlogPost(resolvedLocale, slug);
  if (!post) {
    notFound();
  }

  const t = await getTranslations("proof");
  const tCommon = await getTranslations("common");
  const dateFormatter = new Intl.DateTimeFormat(resolvedLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const morePosts = (await loadBlogPosts(resolvedLocale, 3)).filter(
    (candidate) => candidate.slug !== post.slug
  );

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <article className="mx-auto max-w-3xl">
        <Reveal>
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gp-olive underline-offset-4 hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            {t("blogBackCta")}
          </Link>

          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center rounded-full border border-gp-olive/20 px-2.5 py-1 font-medium text-gp-olive">
              {post.tag}
            </span>
            <time dateTime={post.publishedAt}>
              {dateFormatter.format(new Date(post.publishedAt))}
            </time>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden="true" />
              {t("readMinutes", { minutes: post.readMinutes })}
            </span>
          </p>

          <h1 className="font-heading mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {post.title}
          </h1>
          <p className="mt-4 text-base font-medium text-gp-olive sm:text-lg">
            {post.excerpt}
          </p>
        </Reveal>

        <Reveal delay={80}>
          <ArticleCover
            tag={post.tag}
            src={post.cover}
            size="hero"
            className="mt-8 aspect-[16/9] rounded-2xl ring-1 ring-gp-olive/10"
          />
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-8">
            {post.body.map((paragraph, index) => (
              <p
                key={`${post.slug}-p-${index}`}
                className="mt-4 text-[15px] leading-relaxed text-muted-foreground sm:text-base"
              >
                {paragraph}
              </p>
            ))}

            <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-gp-olive/10 pt-6">
              <ButtonLink
                href={site.links.ayo}
                external
                size="lg"
                className="rounded-full px-6 font-semibold"
              >
                {tCommon("bookNow")}
              </ButtonLink>
              <p className="text-xs text-muted-foreground">
                {tCommon("openDaily")} · {tCommon("tagline")}
              </p>
            </div>
          </div>
        </Reveal>
      </article>

      {morePosts.length > 0 && (
        <Reveal delay={160}>
          <aside className="mx-auto mt-14 max-w-3xl border-t border-gp-olive/10 pt-8">
            <h2 className="font-heading text-xl font-bold tracking-tight">
              {t("morePostsTitle")}
            </h2>
            <ul className="mt-4 space-y-3">
              {morePosts.map((candidate) => (
                <li key={candidate.slug}>
                  <Link
                    href={`/blog/${candidate.slug}`}
                    className="group flex items-center justify-between gap-4 rounded-xl border border-gp-olive/15 px-4 py-3 transition-colors hover:border-gp-olive/40 hover:bg-gp-olive/5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {candidate.title}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {dateFormatter.format(new Date(candidate.publishedAt))} ·{" "}
                        {t("readMinutes", { minutes: candidate.readMinutes })}
                      </span>
                    </span>
                    <ArrowLeft
                      className="size-4 shrink-0 rotate-180 text-gp-olive transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </Reveal>
      )}
    </section>
  );
}
