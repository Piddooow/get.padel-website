/**
 * Event & social archive — mirrors the `events` table (PRD §6). Facts from the
 * Instagram archive (getpadel-information.md §8.11/§14, scraped 20 Sep 2026).
 */
import type { Localized } from "./localized";

export interface VenueEvent {
  id: string;
  title: Localized;
  period: Localized;
  description: Localized;
  /**
   * ISO datetime of an announced upcoming event (drives the countdown).
   * Archive events leave it undefined.
   */
  startsAt?: string;
}

export const events: VenueEvent[] = [
  {
    id: "chasing-sunset",
    title: { id: "Chasing Sunset", en: "Chasing Sunset" },
    period: { id: "Agustus 2026", en: "August 2026" },
    description: {
      id: "Friendly match komunitas bersama PadelHub — ajak komunitasmu untuk mengejar sunset bersama.",
      en: "A community friendly match with PadelHub — bring your crew and chase another sunset together.",
    },
  },
  {
    id: "junior-summer-class",
    title: { id: "Junior Summer Class", en: "Junior Summer Class" },
    period: { id: "29 Jun – 4 Jul 2026", en: "29 Jun – 4 Jul 2026" },
    description: {
      id: "Program liburan untuk anak: kelas padel 6–9 & 10–13 tahun dengan certified coach.",
      en: "Holiday programme for kids: padel classes for ages 6–9 and 10–13 with a certified coach.",
    },
  },
  {
    id: "jamu-day",
    title: { id: "Jamu Day — Hari Pancasila", en: "Jamu Day — Pancasila Day" },
    period: { id: "1 & 3 Juni 2026", en: "1 & 3 June 2026" },
    description: {
      id: "Setiap booking 1 jam pukul 07.00–12.00 mendapat 4 fresh jamu gratis.",
      en: "Every 1-hour booking between 07:00–12:00 came with 4 complimentary fresh jamu.",
    },
  },
  {
    id: "hari-kartini",
    title: { id: "Hari Kartini × Padel Moms Club", en: "Kartini Day × Padel Moms Club" },
    period: { id: "23 April 2026", en: "23 April 2026" },
    description: {
      id: "Sesi spesial bersama Padel Moms Club, dengan partisipasi Flowerglass, Calysta Skin Clinic, dan Chezini Bakery.",
      en: "A special session with Padel Moms Club, joined by Flowerglass, Calysta Skin Clinic and Chezini Bakery.",
    },
  },
  {
    id: "fortune-cookie-day",
    title: { id: "Fortune Cookie Day", en: "Fortune Cookie Day" },
    period: { id: "15–22 Feb 2026", en: "15–22 Feb 2026" },
    description: {
      id: "Pekan keberuntungan dengan hadiah utama tambahan 2 jam bermain gratis.",
      en: "A lucky week with a grand prize of 2 extra hours of free play.",
    },
  },
];
