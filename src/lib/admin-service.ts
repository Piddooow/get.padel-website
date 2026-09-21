/**
 * Admin content service (PRD Fase 4 follow-up): manage testimonials, gallery
 * photos and blog posts. Access is gated by the `ADMIN_TOKEN` env var sent as
 * the `x-admin-token` header; when the token is not configured the endpoints
 * stay disabled (503).
 */
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

export type AdminResource = "testimonials" | "gallery" | "blog";

export const ADMIN_RESOURCES: readonly AdminResource[] = [
  "testimonials",
  "gallery",
  "blog",
];

export function isAdminResource(value: unknown): value is AdminResource {
  return (
    typeof value === "string" &&
    (ADMIN_RESOURCES as readonly string[]).includes(value)
  );
}

export type AdminAuthResult = "ok" | "unconfigured" | "missing" | "forbidden";

/** Resolves admin authorisation from the request token (pure, testable). */
export function resolveAdminAuth(
  headerToken: string | null,
  expectedToken: string | undefined
): AdminAuthResult {
  if (!expectedToken) return "unconfigured";
  if (!headerToken) return "missing";
  return headerToken === expectedToken ? "ok" : "forbidden";
}

export interface AdminTestimonial {
  id: string;
  author: string;
  source: string;
  rating: number;
  isActive: boolean;
  sortOrder: number;
}

export interface AdminPhoto {
  id: string;
  src: string;
  isActive: boolean;
  sortOrder: number;
}

export interface AdminBlogPost {
  id: string;
  slug: string;
  titleId: string;
  titleEn: string;
  isActive: boolean;
  publishedAt: string;
}

export interface AdminContentDto {
  testimonials: AdminTestimonial[];
  gallery: AdminPhoto[];
  blog: AdminBlogPost[];
}

/** Lists every content row (including inactive) for the admin panel. */
export async function listAdminContent(): Promise<AdminContentDto> {
  const testimonialRows = await db
    .select()
    .from(schema.testimonials)
    .orderBy(asc(schema.testimonials.sortOrder));
  const photoRows = await db
    .select()
    .from(schema.galleryPhotos)
    .orderBy(asc(schema.galleryPhotos.sortOrder));
  const blogRows = await db
    .select()
    .from(schema.blogPosts)
    .orderBy(asc(schema.blogPosts.publishedAt));

  return {
    testimonials: testimonialRows.map((row) => ({
      id: row.id,
      author: row.author,
      source: row.source,
      rating: row.rating,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
    })),
    gallery: photoRows.map((row) => ({
      id: row.id,
      src: row.src,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
    })),
    blog: blogRows.map((row) => ({
      id: row.id,
      slug: row.slug,
      titleId: row.titleId,
      titleEn: row.titleEn,
      isActive: row.isActive,
      publishedAt: row.publishedAt.toISOString(),
    })),
  };
}

/** Toggles the visibility of one content row. */
export async function setContentActive(
  resource: AdminResource,
  id: string,
  isActive: boolean
): Promise<boolean> {
  const now = new Date();

  const table =
    resource === "testimonials"
      ? schema.testimonials
      : resource === "gallery"
        ? schema.galleryPhotos
        : schema.blogPosts;

  const [existing] = await db
    .select({ id: table.id })
    .from(table)
    .where(eq(table.id, id));
  if (!existing) return false;

  await db.update(table).set({ isActive, updatedAt: now }).where(eq(table.id, id));
  return true;
}
