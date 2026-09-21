/**
 * Programs & events — mirrors the `coaching_programs` / `events` tables
 * (PRD §6). Static mock data for now; a lightweight CMS will replace it.
 *
 * Content: getpadel-information.md §8.11 kelebihan + §11 (promo/program aktif &
 * arsip) + PRD §8.9/§8.11. Facts only — no invented schedules or prices.
 */
import type { Localized } from "./localized";

/** Official free-trial registration form (getpadel-information.md §11). */
export const FREE_TRIAL_REGISTRATION_URL =
  "https://forms.gle/2zNxHCYW3NyUNsiF9";

/** Where a program's CTA leads. */
export type ProgramCta = "form" | "wa" | "ayo" | "email";

export interface ProgramPriceRow {
  label: Localized;
  value: string;
}

export type ProgramGroup = "coaching" | "junior" | "trial";

export interface Program {
  id: string;
  /** Which section the program belongs to. */
  group: ProgramGroup;
  title: Localized;
  description: Localized;
  highlights: Localized[];
  /** Priced packages (empty when the price is only available on request). */
  priceRows?: ProgramPriceRow[];
  /** Small footnote under the price rows (e.g. "harga tidak dipublikasikan"). */
  priceNote?: Localized;
  cta: ProgramCta;
}

export const programs: Program[] = [
  {
    id: "multi-session-coaching",
    group: "coaching",
    title: {
      id: "Multi-Session Private Coaching",
      en: "Multi-Session Private Coaching",
    },
    description: {
      id: "Paket 5 sesi coaching privat — maksimal 2 orang per jam, termasuk court, certified coach, dan bola. Valid 1 bulan.",
      en: "Five-session private coaching package — max 2 players per hour, including court, certified coach and balls. Valid for one month.",
    },
    highlights: [
      {
        id: "Maksimal 2 orang per jam",
        en: "Maximum 2 players per hour",
      },
      {
        id: "Termasuk court, certified coach & bola",
        en: "Includes court, certified coach & balls",
      },
      {
        id: "Boleh bawa coach luar tanpa biaya tambahan",
        en: "Bring your own coach at no extra charge",
      },
    ],
    priceRows: [
      {
        label: { id: "Weekday 06.00–16.00", en: "Weekday 06:00–16:00" },
        value: "Rp2.625.000",
      },
      {
        label: { id: "Weekday 16.00–22.00", en: "Weekday 16:00–22:00" },
        value: "Rp2.895.000",
      },
      {
        label: { id: "Weekend sepanjang hari", en: "Weekend all day" },
        value: "Rp2.975.000",
      },
    ],
    cta: "ayo",
  },
  {
    id: "private-coaching",
    group: "coaching",
    title: {
      id: "Private Coaching",
      en: "Private Coaching",
    },
    description: {
      id: "Sesi privat dengan certified coach untuk semua level — dari pemula sampai pemain kompetitif. Jadwal & harga mengikuti ketersediaan coach.",
      en: "Private sessions with a certified coach for every level — from beginners to competitive players. Schedule & price follow coach availability.",
    },
    highlights: [
      {
        id: "Cocok untuk pemula & latihan teknik",
        en: "Great for beginners & technique work",
      },
      {
        id: "Reservasi dengan coaching diperlakukan sebagai sesi coaching",
        en: "Bookings with coaching are treated as coaching sessions",
      },
      {
        id: "Coach certified, pernah kedatangan atlet padel",
        en: "Certified coaches, with visiting padel athletes",
      },
    ],
    priceNote: {
      id: "Jadwal & harga konfirmasi via kanal resmi AYO atau CS WhatsApp.",
      en: "Schedule & price confirmed via the official AYO channel or WhatsApp CS.",
    },
    cta: "wa",
  },
  {
    id: "junior-class",
    group: "junior",
    title: {
      id: "Kelas Junior 6–9 & 10–13 Tahun",
      en: "Junior Class Ages 6–9 & 10–13",
    },
    description: {
      id: "Kelas padel untuk anak dengan certified coach. Fokus pada dasar permainan, koordinasi, dan keseruan — termasuk raket anak.",
      en: "Kids padel classes with a certified coach — game basics, coordination and fun, with kids' rackets included.",
    },
    highlights: [
      {
        id: "Rp450.000/pax untuk 3 sesi",
        en: "Rp450,000/pax for 3 sessions",
      },
      {
        id: "Minimal 4 & maksimal 5 pax per kelas",
        en: "Minimum 4 & maximum 5 pax per class",
      },
      {
        id: "Termasuk certified coach, court, raket, bola & certificate",
        en: "Includes certified coach, court, racket, balls & certificate",
      },
    ],
    priceNote: {
      id: "Jadwal per angkatan diumumkan saat pendaftaran.",
      en: "Batch schedule is announced at registration.",
    },
    cta: "wa",
  },
  {
    id: "free-trial",
    group: "trial",
    title: {
      id: "Free Trial",
      en: "Free Trial",
    },
    description: {
      id: "Belum pernah main padel? Coba gratis dulu — padel fever sudah datang dan slot free trial menunggumu. Kuota terbatas.",
      en: "Never played padel? Try it for free first — padel fever has arrived and a free-trial slot is waiting. Limited spots.",
    },
    highlights: [
      {
        id: "Untuk pemain baru semua level",
        en: "For new players of every level",
      },
      {
        id: "Pendaftaran lewat Google Form resmi",
        en: "Registration via the official Google Form",
      },
      {
        id: "Kuota terbatas setiap periode",
        en: "Limited spots each period",
      },
    ],
    cta: "form",
  },
];

