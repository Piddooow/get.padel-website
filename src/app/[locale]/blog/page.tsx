import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, Clock } from "lucide-react";
import { ArticleCover } from "@/components/proof/article-cover";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/reveal";
import { routing } from "@/i18n/routing";
import { loadBlogPosts } from "@/lib/ui-content";

// Content comes from the database — refresh the rendered page periodically.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const resolved = hasLocale(routing.locales, locale)
    ? locale
    : routing.defaultLocale;
  const t = await getTranslations({ locale: resolved, namespace: "proof" });

  return {
    title: t("blogPageMetaTitle"),
    description: t("blogPageMetaDescription"),
    alternates: {
      canonical: `/${resolved}/blog`,
      languages: {
        id: "/id/blog",
        en: "/en/blog",
        "x-default": "/id/blog",
      },
    },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const t = await getTranslations("proof");
  const resolvedLocale = await getLocale();
  const posts = await loadBlogPosts(resolvedLocale, 20);
  const dateFormatter = new Intl.DateTimeFormat(resolvedLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
      <Reveal>
        <header className="max-w-2xl">
          <span className="inline-flex items-center rounded-full border border-gp-olive/20 bg-card px-3.5 py-1.5 text-xs font-semibold tracking-wide text-gp-olive uppercase">
            {t("blogPageEyebrow")}
          </span>
          <h1 className="font-heading mt-4 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            {t("blogPageTitle")}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {t("blogPageSubtitle")}
          </p>
        </header>
      </Reveal>

      <Reveal delay={80}>
        <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-gp-olive/10 transition-colors hover:ring-gp-olive/30"
              >
                <ArticleCover tag={post.tag} src={post.cover} className="aspect-[16/10]" />
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center rounded-full border border-gp-olive/20 px-2.5 py-1 font-medium text-gp-olive">
                      {post.tag}
                    </span>
                    <time dateTime={post.publishedAt}>
                      {dateFormatter.format(new Date(post.publishedAt))}
                    </time>
                  </p>
                  <h2 className="mt-3 font-heading text-base font-semibold">
                    {post.title}
                  </h2>
                  <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {post.excerpt}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="size-3.5" aria-hidden="true" />
                      {t("readMinutes", { minutes: post.readMinutes })}
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-gp-olive underline-offset-4 group-hover:underline">
                      {t("readCta")}
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
