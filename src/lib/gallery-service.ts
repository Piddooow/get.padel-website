/**
 * Gallery service (PRD §6 `gallery_photos` / Fase 4 "Galeri Foto"): ordered
 * venue photos resolved for one locale.
 */
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { pick } from "@/data/localized";

export interface GalleryPhotoDto {
  id: string;
  src: string;
  alt: string;
}

export interface ListGalleryOptions {
  locale: string;
}

/** Lists active gallery photos in display order. */
export async function listGalleryPhotos(
  options: ListGalleryOptions
): Promise<GalleryPhotoDto[]> {
  const rows = await db
    .select()
    .from(schema.galleryPhotos)
    .orderBy(asc(schema.galleryPhotos.sortOrder));

  return rows
    .filter((photo) => photo.isActive)
    .map((photo) => ({
      id: photo.id,
      src: photo.src,
      alt: pick(options.locale, { id: photo.altId, en: photo.altEn }),
    }));
}
