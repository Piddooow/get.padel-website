/**
 * Blog service (PRD §6 `blog_posts`): bilingual article list and detail.
 * Article bodies are stored as JSON arrays of paragraphs per locale.
 */
import { asc, desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { pick } from "@/data/localized";

export interface BlogPostSummaryDto {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  cover: string | null;
  readMinutes: number;
  publishedAt: string;
}

export interface BlogPostDetailDto extends BlogPostSummaryDto {
  /** Article paragraphs in reading order. */
  body: string[];
}

/** Parses stored paragraph JSON (pure, tolerant of malformed data). */
export function parseParagraphs(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

export interface ListBlogOptions {
  locale: string;
  limit?: number;
}

const MAX_LIMIT = 20;

function toSummary(
  row: typeof schema.blogPosts.$inferSelect,
  locale: string
): BlogPostSummaryDto {
  return {
    id: row.id,
    slug: row.slug,
    title: pick(locale, { id: row.titleId, en: row.titleEn }),
    excerpt: pick(locale, { id: row.excerptId, en: row.excerptEn }),
    tag: pick(locale, { id: row.tagId, en: row.tagEn }),
    cover: row.coverUrl,
    readMinutes: row.readMinutes,
    publishedAt: row.publishedAt.toISOString(),
  };
}

/** Lists active posts, newest first. */
export async function listBlogPosts(
  options: ListBlogOptions
): Promise<BlogPostSummaryDto[]> {
  const rows = await db
    .select()
    .from(schema.blogPosts)
    .orderBy(desc(schema.blogPosts.publishedAt), asc(schema.blogPosts.slug));

  const limit = Math.min(options.limit ?? MAX_LIMIT, MAX_LIMIT);

  return rows
    .filter((row) => row.isActive)
    .slice(0, limit)
    .map((row) => toSummary(row, options.locale));
}

export interface GetBlogPostOptions {
  locale: string;
  slug: string;
}

/** One active post with its full body, or null when unknown. */
export async function getBlogPost(
  options: GetBlogPostOptions
): Promise<BlogPostDetailDto | null> {
  const [row] = await db
    .select()
    .from(schema.blogPosts)
    .where(eq(schema.blogPosts.slug, options.slug));

  if (!row || !row.isActive) return null;

  return {
    ...toSummary(row, options.locale),
    body: parseParagraphs(
      options.locale === "en" ? row.bodyEn : row.bodyId
    ),
  };
}
