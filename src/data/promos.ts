/**
 * Promo data — mirrors the `promos` table (PRD §6, bilingual columns).
 * Content sourced from getpadel-information.md §8.9/§11 (scraped 20 Sep 2026).
 * Static for now; a lightweight CMS will replace this module later.
 */
export interface Localized {
  id: string;
  en: string;
}

export interface Promo {
  id: string;
  title: Localized;
  period: Localized;
  detail: Localized;
  source?: string;
  /** Poster asset in /public/promos (featured in the carousel). */
  poster?: string;
  /** External link (e.g. registration form). */
  link?: string;
  /** Copyable reference when there is no code/link (e.g. info URL, contact). */
  reference?: string;
  /** Structured validity window (YYYY-MM-DD); undefined = open ended. */
  startsOn?: string;
  endsOn?: string;
  /** Historical promos kept for the archive (not shown as running). */
  archived?: boolean;
}

export function pick(locale: string, value: Localized): string {
  return locale === "en" ? value.en : value.id;
}

export const promos: Promo[] = [
  {
    id: "season-rates",
    title: {
      id: "September Special Price",
      en: "September Special Price",
    },
    period: { id: "September 2026", en: "September 2026" },
    detail: {
      id: "Tarif spesial: Weekday Rp150.000 / Rp180.000 / Rp260.000 · Weekend Rp200.000 / Rp250.000 / Rp260.000. Lihat tabel harga di atas untuk detail per jam.",
      en: "Special rates: Weekday Rp150,000 / Rp180,000 / Rp260,000 · Weekend Rp200,000 / Rp250,000 / Rp260,000. See the rate table above for hourly details.",
    },
    source: "Instagram @get.padel",
    poster: "/promos/season-rates.webp",
    startsOn: "2026-09-01",
    endsOn: "2026-09-30",
  },
  {
    id: "snack-mayora",
    title: {
      id: "1 Hour 1 Box — Snack Mayora",
      en: "1 Hour 1 Box — Mayora Snack",
    },
    period: { id: "Mulai 9 Sep 2026 · selama stok", en: "From 9 Sep 2026 · while stock lasts" },
    detail: {
      id: "Booking 1 jam dan dapatkan gratis 1 box Hungry But Busy by Mayora. Berlaku selama stok masih tersedia.",
      en: "Book 1 hour and get 1 free box of Hungry But Busy by Mayora. Valid while stock lasts.",
    },
    source: "Instagram @get.padel",
    poster: "/promos/snack-mayora.webp",
    startsOn: "2026-09-09",
  },
  {
    id: "multi-session-coaching",
    title: {
      id: "Multi-Session Private Coaching",
      en: "Multi-Session Private Coaching",
    },
    period: { id: "5x meeting · valid 1 bulan", en: "5 sessions · valid for 1 month" },
    detail: {
      id: "Maksimal 2 orang per jam · Weekday 06.00–16.00 Rp2.625.000 · Weekday 16.00–22.00 Rp2.895.000 · Weekend all-day Rp2.975.000. Termasuk court, certified coach, dan balls.",
      en: "Up to 2 people per hour · Weekday 06.00–16.00 Rp2,625,000 · Weekday 16.00–22.00 Rp2,895,000 · Weekend all-day Rp2,975,000. Includes court, certified coach, and balls.",
    },
    source: "Instagram @get.padel",
    poster: "/promos/multi-session-coaching.webp",
  },
  {
    id: "mandiri",
    title: {
      id: "Diskon s.d. 20% — Tukar Livin' Poin Mandiri",
      en: "Up to 20% Off — Redeem Mandiri Livin' Poin",
    },
    period: { id: "9 Jan 2026 – 8 Jan 2027", en: "9 Jan 2026 – 8 Jan 2027" },
    detail: {
      id: "Tukar Livin' Poin dengan Mandiri Kartu Kredit/Debit, bertransaksi langsung di venue. Min. transaksi Rp300.000 · maks. redeem Rp100.000 · berlaku setiap hari · tidak berlaku kelipatan · bisa Power Installment. Info: bmri.id/getpadel atau Mandiri Call 14000.",
      en: "Redeem Livin' Poin with your Mandiri credit/debit card, transacting directly at the venue. Min. spend Rp300,000 · max. redemption Rp100,000 · valid daily · not cumulative · supports Power Installment. Info: bmri.id/getpadel or Mandiri Call 14000.",
    },
    source: "Bank Mandiri × Get Padel",
    poster: "/promos/mandiri.webp",
    reference: "bmri.id/getpadel",
    startsOn: "2026-01-09",
    endsOn: "2027-01-08",
  },
  {
    id: "junior-class",
    title: {
      id: "Junior Class — 6–9 & 10–13 Tahun",
      en: "Junior Class — Ages 6–9 & 10–13",
    },
    period: {
      id: "Rp450.000/pax untuk 3 sesi",
      en: "Rp450,000/pax for 3 sessions",
    },
    detail: {
      id: "Min 4 pax, maks 5 pax · termasuk certified coach, court, racket, balls, dan certificate. Jadwal per angkatan diumumkan saat pendaftaran.",
      en: "Min 4 pax, max 5 pax · includes certified coach, court, racket, balls, and certificate. Group schedule shared at registration.",
    },
    source: "Instagram @get.padel",
    poster: "/promos/junior-class.webp",
  },
  {
    id: "loyalty-card",
    title: {
      id: "Race & Rally Loyalty Card",
      en: "Race & Rally Loyalty Card",
    },
    period: { id: "Berjalan di Race & Rally Coffee", en: "Ongoing at Race & Rally Coffee" },
    detail: {
      id: "1 stamp untuk setiap pembelian minimum Rp30.000 · pembelian ke-10 gratis 1 minuman · minta kartu ke staff.",
      en: "1 stamp for every purchase of min. Rp30,000 · your 10th drink is free · ask the staff for your card.",
    },
    source: "Instagram @racerallycoffee",
    poster: "/promos/loyalty-card.webp",
  },
  {
    id: "bri-installment",
    title: {
      id: "Cicilan 0% — BRI Kartu Kredit",
      en: "0% Installments — BRI Credit Card",
    },
    period: { id: "1 Feb – 31 Des 2026", en: "1 Feb – 31 Dec 2026" },
    detail: {
      id: "Cicilan 0% hingga 12 bulan dengan BRI Kartu Kredit. Min. transaksi Rp5 juta. Kontak: Sabrina 0812 1214 017.",
      en: "0% installments up to 12 months with a BRI credit card. Min. spend Rp5 million. Contact: Sabrina 0812 1214 017.",
    },
    source: "Poster resmi Get Padel",
    reference: "Sabrina 0812 1214 017",
    startsOn: "2026-02-01",
    endsOn: "2026-12-31",
  },
  {
    id: "free-trial",
    title: {
      id: "Free Trial — Slot Terbatas",
      en: "Free Trial — Limited Spots",
    },
    period: { id: "Berjalan", en: "Ongoing" },
    detail: {
      id: "Coba padel gratis! Padel fever has arrived — dan free trial-mu menunggu. Daftar lewat formulir resmi.",
      en: "Try padel for free! Padel fever has arrived — and your free trial is waiting. Register via the official form.",
    },
    source: "Highlight Free Trial",
    link: "https://forms.gle/2zNxHCYW3NyUNsiF9",
  },
];

export const archivedPromos: Promo[] = [
  {
    id: "ramadhan-2026",
    title: {
      id: "Ramadhan Promo",
      en: "Ramadhan Promo",
    },
    period: { id: "20 Feb – 20 Mar 2026", en: "20 Feb – 20 Mar 2026" },
    detail: {
      id: "Weekday 06.00–15.00 Rp245.000 · 15.00–22.00 Rp330.000 · Weekend 06.00–15.00 Rp275.000 · 15.00–22.00 Rp330.000. Tidak dapat digabung dengan promo lain.",
      en: "Weekday 06.00–15.00 Rp245,000 · 15.00–22.00 Rp330,000 · Weekend 06.00–15.00 Rp275,000 · 15.00–22.00 Rp330,000. Not combinable with other promos.",
    },
    source: "Instagram @get.padel",
    startsOn: "2026-02-20",
    endsOn: "2026-03-20",
    archived: true,
  },
  {
    id: "bogo-2026",
    title: {
      id: "Buy 1 Get 1 (BOGO)",
      en: "Buy 1 Get 1 (BOGO)",
    },
    period: { id: "24 Apr 2026", en: "24 Apr 2026" },
    detail: {
      id: "Book 1 jam dapat 1 jam (durasi terbatas, sesuai ketersediaan).",
      en: "Book 1 hour, get 1 hour (limited duration, subject to availability).",
    },
    source: "Instagram @get.padel",
    startsOn: "2026-04-24",
    endsOn: "2026-04-24",
    archived: true,
  },
  {
    id: "opening-2025",
    title: {
      id: "Opening Promo — All Court, All Hours",
      en: "Opening Promo — All Court, All Hours",
    },
    period: { id: "20–31 Des 2025", en: "20–31 Dec 2025" },
    detail: {
      id: "Peak hour Rp350.000 / non-peak Rp300.000 · booking via AYO app.",
      en: "Peak hour Rp350,000 / non-peak Rp300,000 · booked via the AYO app.",
    },
    source: "Instagram @get.padel",
    startsOn: "2025-12-20",
    endsOn: "2025-12-31",
    archived: true,
  },
];

/** Running promos only (excludes the archive). */
export const activePromos = promos;

/** Promos featured in the poster carousel. */
export const promoPosters = activePromos.filter(
  (promo): promo is Promo & { poster: string } => Boolean(promo.poster)
);
