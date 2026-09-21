/**
 * Blog posts — mock articles for the Proof & Blog section (PRD Fase 4).
 * Content is composed from researched venue facts (getpadel-information.md);
 * the Phase 4 backend (`blog_posts` table) will replace this module.
 */
import type { Localized } from "./localized";

export interface BlogPost {
  slug: string;
  title: Localized;
  excerpt: Localized;
  /** ISO date (publication). */
  date: string;
  tag: Localized;
  /** Local cover photo (public path). */
  cover: string;
  readMinutes: number;
  /** Short article body (paragraphs) shown on the blog list page. */
  body: Localized[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "tips-padel-pertama-kali",
    title: {
      id: "Pertama Kali Main Padel? Mulai dari Sini",
      en: "Playing Padel for the First Time? Start Here",
    },
    excerpt: {
      id: "Lima hal yang perlu kamu siapkan sebelum sesi pertamamu di Get Padel — dari sepatu sampai sewa raket.",
      en: "Five things to prepare before your first session at Get Padel — from shoes to racket rental.",
    },
    date: "2026-09-10",
    tag: { id: "Tips", en: "Tips" },
    cover: "/images/blog-first-time.jpg",
    readMinutes: 3,
    body: [
      {
        id: "Padel dimainkan 2 lawan 2 di court tertutup, jadi kamu tidak perlu stamina level atlet untuk mencobanya. Sesi di Get Padel berdurasi 60 menit dan sudah termasuk 2 dus air mineral 240 ml plus handuk dingin setelah bermain.",
        en: "Padel is played 2v2 on an enclosed court, so you don't need athlete-level stamina to try it. Sessions at Get Padel last 60 minutes and include 2 boxes of 240 ml mineral water plus a cold towel afterwards.",
      },
      {
        id: "Wajib pakai sepatu olahraga bersih dengan sol non-marking dan tanpa studs. Belum punya raket? Tidak masalah — sewa raket tersedia lengkap dan murah, termasuk raket anak. Bola sudah disediakan.",
        en: "Clean sports shoes with non-marking, stud-free soles are required. No racket yet? No problem — complete, affordable racket rental is available, kids' rackets included. Balls are provided.",
      },
      {
        id: "Booking slot favoritmu lewat kanal resmi AYO atau WhatsApp CS. Slot terbuka hingga ± 1 bulan ke depan, dan jam 18.00–22.00 paling cepat penuh — jadi jadwalkan lebih awal ya.",
        en: "Book your favourite slot via the official AYO channel or WhatsApp CS. Slots open up to ~1 month ahead, and 18:00–22:00 fills up first — so plan ahead.",
      },
    ],
  },
  {
    slug: "kelas-junior-dan-free-trial",
    title: {
      id: "Kelas Junior & Free Trial: Kenalan dengan Padel Sejak Dini",
      en: "Junior Classes & Free Trial: Meet Padel Early",
    },
    excerpt: {
      id: "Kelas padel anak 6–9 & 10–13 tahun plus free trial untuk pemain baru — inilah cara memulainya.",
      en: "Kids' padel classes for ages 6–9 & 10–13 plus a free trial for new players — here's how to start.",
    },
    date: "2026-09-05",
    tag: { id: "Program", en: "Programs" },
    cover: "/images/blog-junior-class.jpg",
    readMinutes: 3,
    body: [
      {
        id: "Kelas junior Get Padel tersedia untuk dua kelompok usia: 6–9 tahun dan 10–13 tahun. Setiap kelas dijalankan bersama certified coach dengan maksimal 5 anak, sehingga setiap anak mendapat perhatian yang cukup.",
        en: "Get Padel's junior classes run for two age groups: 6–9 and 10–13. Each class is led by a certified coach with a maximum of 5 kids, so every child gets proper attention.",
      },
      {
        id: "Paket kelasnya Rp450.000/pax untuk 3 sesi, sudah termasuk certified coach, court, raket, bola, dan certificate. Jadwal per angkatan diumumkan saat pendaftaran.",
        en: "The class package is Rp450,000/pax for 3 sessions, including a certified coach, court, racket, balls and a certificate. Batch schedules are announced at registration.",
      },
      {
        id: "Untuk pemain baru segala usia, program Free Trial membuka kesempatan mencoba padel tanpa biaya. Kuota terbatas setiap periode — daftar lewat Google Form resmi atau tanya CS via WhatsApp.",
        en: "For new players of any age, the Free Trial programme lets you try padel at no cost. Spots are limited each period — register via the official Google Form or ask CS on WhatsApp.",
      },
    ],
  },
  {
    slug: "chasing-sunset-recap",
    title: {
      id: "Chasing Sunset: Main Bareng Komunitas Jakarta Timur–Bekasi",
      en: "Chasing Sunset: Playing with the East Jakarta–Bekasi Community",
    },
    excerpt: {
      id: "Cerita di balik friendly match komunitas kami bersama PadelHub — dan cara ikut sesi Open Match berikutnya.",
      en: "The story behind our community friendly match with PadelHub — and how to join the next Open Match.",
    },
    date: "2026-08-30",
    tag: { id: "Event", en: "Events" },
    cover: "/images/blog-chasing-sunset.jpg",
    readMinutes: 2,
    body: [
      {
        id: "Chasing Sunset adalah sesi friendly match komunitas yang kami jalankan bersama PadelHub pada Agustus 2026. Dua court indoor penuh, ditutup dengan sunset dan obrolan panjang di area tunggu.",
        en: "Chasing Sunset was a community friendly match we ran with PadelHub in August 2026. Both indoor courts were full, wrapped up with a sunset and long conversations in the lounge.",
      },
      {
        id: "Ingin ikut sesi berikutnya? Kami rutin membuka Open Match untuk semua level. Pantau jadwal di halaman Program atau langsung tanya CS lewat WhatsApp untuk slot yang tersisa.",
        en: "Want in on the next one? We regularly open Open Match sessions for all levels. Watch the schedule on the Programs page or ask CS on WhatsApp for remaining spots.",
      },
    ],
  },
];

/** Latest posts first (the Proof & Blog section shows the newest three). */
export function getLatestBlogPosts(limit = 3): BlogPost[] {
  return [...blogPosts]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit);
}
