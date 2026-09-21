import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Clock } from "lucide-react";
import { ArticleCover } from "@/components/proof/article-cover";
import { Link } from "@/i18n/navigation";
import type { BlogPostSummaryDto } from "@/lib/blog-service";

/** Latest blog posts — cards link to the article pages. */
export async function BlogCards({ posts }: { posts: BlogPostSummaryDto[] }) {
  const t = await getTranslations("proof");
  const locale = await getLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <ul className="grid gap-6 md:grid-cols-3">
      {posts.map((post) => (
        <li key={post.slug}>
          <Link
            href={`/blog/${post.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-gp-olive/10 transition-colors hover:ring-gp-olive/30"
          >
            <ArticleCover tag={post.tag} src={post.cover} className="aspect-[16/10]" />
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <time dateTime={post.publishedAt}>
                  {dateFormatter.format(new Date(post.publishedAt))}
                </time>
              </p>
              <h3 className="mt-3 font-heading text-base font-semibold">
                {post.title}
              </h3>
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
  );
}
