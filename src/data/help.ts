/**
 * Quick help topics — mock data routing visitors to the right page or channel.
 * Facts and destinations mirror the live site pages (PRD Fase 3: Bantuan).
 */
import type { Localized } from "./localized";

export type HelpTopicIcon =
  | "calendar"
  | "tag"
  | "map"
  | "shield"
  | "graduation"
  | "sparkles";

export interface HelpTopic {
  id: string;
  icon: HelpTopicIcon;
  title: Localized;
  description: Localized;
  /** Internal route (without locale) when the answer lives on a page. */
  route?: string;
  /** Outbound channel when the venue should answer directly. */
  channel?: "wa" | "email-event";
}

export const helpTopics: HelpTopic[] = [
  {
    id: "schedule",
    icon: "calendar",
    title: { id: "Cek jadwal & slot kosong", en: "Check the schedule & open slots" },
    description: {
      id: "Lihat slot tersedia hari ini, besok, atau akhir pekan.",
      en: "See available slots for today, tomorrow, or the weekend.",
    },
    route: "/jadwal",
  },
  {
    id: "pricing",
    icon: "tag",
    title: { id: "Harga & promo berjalan", en: "Prices & running promos" },
    description: {
      id: "Rate card peak/off-peak dan promo aktif (Mandiri, BRI, snack, dll.).",
      en: "Peak/off-peak rate card and active promos (Mandiri, BRI, snacks, and more).",
    },
    route: "/harga",
  },
  {
    id: "venue",
    icon: "map",
    title: { id: "Lokasi, fasilitas & aturan", en: "Location, facilities & rules" },
    description: {
      id: "Alamat, peta, fasilitas, jam buka, dan FAQ.",
      en: "Address, map, facilities, opening hours, and FAQ.",
    },
    route: "/lokasi",
  },
  {
    id: "policy",
    icon: "shield",
    title: { id: "Reschedule & refund", en: "Reschedule & refund" },
    description: {
      id: "Kebijakan reschedule gratis dan ketentuan tanpa refund.",
      en: "Free reschedule policy and no-refund terms.",
    },
    route: "/program",
  },
  {
    id: "junior",
    icon: "graduation",
    title: { id: "Kelas junior & free trial", en: "Junior classes & free trial" },
    description: {
      id: "Program anak 6–9 & 10–13 tahun, plus free trial pemain baru.",
      en: "Kids' programmes for ages 6–9 & 10–13, plus new-player free trials.",
    },
    route: "/program",
  },
  {
    id: "event",
    icon: "sparkles",
    title: { id: "Event & partnership", en: "Events & partnership" },
    description: {
      id: "Turnamen, brand/booth, shooting, atau konten komersial.",
      en: "Tournaments, brand/booth, shoots, or commercial content.",
    },
    channel: "email-event",
  },
];
