/**
 * Venue gallery photos (PRD Fase 4 "Galeri Foto") — mirrors the
 * `gallery_photos` table. Static module until the backend takes over; also
 * used as the seed source. Every photo here is unique on the site (nothing in
 * this list is used by the hero, court specs or blog covers).
 */
import type { Localized } from "./localized";

export interface GalleryPhoto {
  id: string;
  src: string;
  alt: Localized;
}

export const galleryPhotos: GalleryPhoto[] = [
  {
    id: "gallery-lifestyle",
    src: "/images/gallery-lifestyle.jpg",
    alt: {
      id: "Pemain bersiap di area venue Get Padel",
      en: "A player getting ready at the Get Padel venue",
    },
  },
  {
    id: "gallery-community",
    src: "/images/gallery-community.jpg",
    alt: {
      id: "Foto bersama komunitas padel di court Get Padel",
      en: "The padel community group photo on court at Get Padel",
    },
  },
  {
    id: "gallery-lounge",
    src: "/images/gallery-lounge.jpg",
    alt: {
      id: "Area tunggu court dengan kursi merah dan tanaman",
      en: "Court-side lounge with red chairs and plants",
    },
  },
];
