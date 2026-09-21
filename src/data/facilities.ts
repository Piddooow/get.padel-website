/**
 * Venue facilities — mirrors the `facilities` table (PRD §6). Static mock data
 * for now; a lightweight CMS will replace this module later.
 *
 * Content: 12 official facilities from Ayo.co.id + extras from reviews and
 * venue info (getpadel-information.md §7, PRD §8.5).
 */
import type { Localized } from "./localized";

export type FacilityIcon =
  | "showerHead"
  | "car"
  | "bike"
  | "shirt"
  | "droplets"
  | "toilet"
  | "store"
  | "wifi"
  | "armchair"
  | "cupSoda"
  | "moonStar"
  | "coffee"
  | "snowflake"
  | "airVent"
  | "glassWater"
  | "plug"
  | "fan"
  | "circleDot"
  | "cigaretteOff"
  | "graduationCap";

export interface Facility {
  id: string;
  icon: FacilityIcon;
  title: Localized;
  /** Short supporting note shown under the title (extra amenities). */
  detail?: Localized;
  /** Official (Ayo.co.id) vs. additional amenity from reviews/venue info. */
  official: boolean;
}

export const facilities: Facility[] = [
  // ----- 12 fasilitas resmi (Ayo.co.id) -----
  {
    id: "hot-shower",
    icon: "showerHead",
    official: true,
    title: { id: "Hot Shower", en: "Hot shower" },
  },
  {
    id: "car-parking",
    icon: "car",
    official: true,
    title: { id: "Parkir Mobil", en: "Car parking" },
  },
  {
    id: "bike-parking",
    icon: "bike",
    official: true,
    title: { id: "Parkir Motor", en: "Motorbike parking" },
  },
  {
    id: "changing-room",
    icon: "shirt",
    official: true,
    title: { id: "Ruang Ganti", en: "Changing room" },
  },
  {
    id: "shower",
    icon: "droplets",
    official: true,
    title: { id: "Shower", en: "Shower" },
  },
  {
    id: "toilet",
    icon: "toilet",
    official: true,
    title: { id: "Toilet", en: "Toilet" },
  },
  {
    id: "sports-shop",
    icon: "store",
    official: true,
    title: { id: "Toko Olahraga", en: "Sports shop" },
  },
  {
    id: "wifi",
    icon: "wifi",
    official: true,
    title: { id: "Wi-Fi", en: "Wi-Fi" },
  },
  {
    id: "tribune",
    icon: "armchair",
    official: true,
    title: { id: "Tribun Penonton", en: "Spectator tribune" },
  },
  {
    id: "drinks",
    icon: "cupSoda",
    official: true,
    title: { id: "Jual Minuman", en: "Drinks for sale" },
  },
  {
    id: "musholla",
    icon: "moonStar",
    official: true,
    title: { id: "Musholla", en: "Musholla (prayer room)" },
  },
  {
    id: "cafe",
    icon: "coffee",
    official: true,
    title: { id: "Cafe & Resto", en: "Cafe & resto" },
  },

  // ----- Fasilitas tambahan (ulasan & info venue) -----
  {
    id: "cold-towel",
    icon: "snowflake",
    detail: {
      id: "Disiapkan setelah bermain",
      en: "Provided after your session",
    },
    official: false,
    title: {
      id: "Handuk dingin setelah bermain",
      en: "Cold towel after play",
    },
  },
  {
    id: "ac-bathroom",
    icon: "airVent",
    detail: {
      id: "Adem, bersih, dan terawat",
      en: "Cool, clean and well kept",
    },
    official: false,
    title: { id: "Kamar mandi ber-AC", en: "Air-conditioned bathrooms" },
  },
  {
    id: "coconut-water",
    icon: "glassWater",
    detail: {
      id: "Tersedia langsung di venue",
      en: "Available right at the venue",
    },
    official: false,
    title: { id: "Air kelapa dijual", en: "Fresh coconut water" },
  },
  {
    id: "power-outlets",
    icon: "plug",
    detail: {
      id: "Banyak titik di area tunggu",
      en: "Plenty of points in the lounge",
    },
    official: false,
    title: {
      id: "Banyak colokan & charging point",
      en: "Plenty of power outlets",
    },
  },
  {
    id: "fans",
    icon: "fan",
    detail: {
      id: "Sirkulasi udara tetap nyaman",
      en: "Comfortable air circulation",
    },
    official: false,
    title: {
      id: "Kipas angin di berbagai sudut",
      en: "Fans around the venue",
    },
  },
  {
    id: "racket-rental",
    icon: "circleDot",
    detail: {
      id: "Murah & lengkap, termasuk raket anak",
      en: "Affordable and complete, kids' rackets included",
    },
    official: false,
    title: {
      id: "Sewa raket — termasuk raket anak",
      en: "Racket rental — kids' rackets too",
    },
  },
  {
    id: "smoke-free",
    icon: "cigaretteOff",
    detail: {
      id: "Seluruh area bebas asap rokok",
      en: "The whole venue is smoke-free",
    },
    official: false,
    title: {
      id: "Area bebas asap rokok",
      en: "Smoke-free area",
    },
  },
  {
    id: "coaching",
    icon: "graduationCap",
    detail: {
      id: "Certified coach untuk semua level",
      en: "Certified coaches for every level",
    },
    official: false,
    title: {
      id: "Coaching & kelas anak",
      en: "Coaching & kids classes",
    },
  },
];
