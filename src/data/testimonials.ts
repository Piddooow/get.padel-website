/**
 * Testimonials — real reviews captured during research
 * (getpadel-information.md §10, scraped 20 Sep 2026), lightly trimmed and
 * translated for the bilingual landing page. Mock module until the Phase 4
 * backend (`testimonials` table) takes over.
 */
import type { Localized } from "./localized";

export type TestimonialSource = "google" | "ayo";

export interface Testimonial {
  id: string;
  author: string;
  source: TestimonialSource;
  rating: number;
  /** Human period label, e.g. "5 bulan lalu" / "5 months ago". */
  period: Localized;
  quote: Localized;
}

export const testimonials: Testimonial[] = [
  {
    id: "david-antono",
    author: "David Antono",
    source: "google",
    rating: 5,
    period: { id: "5 bulan lalu", en: "5 months ago" },
    quote: {
      id: "Tempatnya super cozy dan nyaman banget buat main ama keluarga. Bersih, banyak colokan, fasilitas lengkap, kipas angin di berbagai sudut dan kamar mandinya bersih serta dingin banget. Sering ada promo menarik. Highly recommended!",
      en: "Super cosy and comfortable for playing with the family. Clean, plenty of power outlets, complete facilities, with fans everywhere and the bathrooms are spotless and really cool. There are often great promos. Highly recommended!",
    },
  },
  {
    id: "celia-sandra",
    author: "Celia Sandra",
    source: "google",
    rating: 5,
    period: { id: "5 bulan lalu", en: "5 months ago" },
    quote: {
      id: "10/10. Court-nya bagus, tidak licin sama sekali. Setelah main dikasih handuk dingin, segar banget. Kamar mandi bersih, tidak bau, adem. Pelayanannya ramah dan gercep. Worth to come back!",
      en: "10/10. The court is great and not slippery at all. After playing you get a cold towel, so refreshing. The bathrooms are clean, odour-free and cool. Friendly, fast service. Worth coming back!",
    },
  },
  {
    id: "motret-murah",
    author: "Motret Murah",
    source: "google",
    rating: 5,
    period: { id: "4 bulan lalu", en: "4 months ago" },
    quote: {
      id: "Get Padel keren banget. Kesadaran larangan merokok sudah ada di awal masuk. Concierge super ramah. Bintang lima.",
      en: "Get Padel is excellent. The smoke-free policy is clear from the moment you walk in. Super friendly concierge. Five stars.",
    },
  },
  {
    id: "mita",
    author: "Mita",
    source: "google",
    rating: 5,
    period: { id: "4 bulan lalu", en: "4 months ago" },
    quote: {
      id: "Hospitality oke banget! Tempat nyaman, resepsionis ramah, dan pas mau sewa raket dijelasin dengan sabar.",
      en: "Hospitality is excellent! Comfortable venue, friendly reception, and they patiently explained everything when I wanted to rent a racket.",
    },
  },
  {
    id: "reda-harman",
    author: "Reda Harman",
    source: "google",
    rating: 5,
    period: { id: "9 bulan lalu", en: "9 months ago" },
    quote: {
      id: "Lapangan padel 2 court di perumahan Billy & Moon. Lapangan oke, sirkulasi udara bagus, tidak panas dan tidak pengap. Kamar mandi oke, ruang tunggu cukup. Overall memuaskan.",
      en: "Two padel courts inside the Billy & Moon estate. Great courts, good air circulation, not hot and not stuffy. Nice bathrooms and a spacious lounge. Satisfying overall.",
    },
  },
  {
    id: "gegyu-arin",
    author: "Gegyu Arin",
    source: "google",
    rating: 5,
    period: { id: "6 bulan lalu", en: "6 months ago" },
    quote: {
      id: "Tempatnya nyaman dan bersih, sirkulasi udaranya mantap, toiletnya bersih. Yang paling penting: yang tidak punya raket bisa sewa di sini karena harganya murah dan lengkap.",
      en: "Comfortable and clean, great air circulation, clean toilets. Most importantly: if you don't own a racket you can rent here, affordable and complete.",
    },
  },
  {
    id: "lucky-aryanto",
    author: "Lucky Aryanto",
    source: "ayo",
    rating: 5,
    period: { id: "26 Jul 2026", en: "26 Jul 2026" },
    quote: {
      id: "Bersih, nyaman, dapat handuk dingin, kamar mandi ber-AC, dan yang penting air kelapanya enak.",
      en: "Clean, comfortable, you get a cold towel, air-conditioned bathrooms, and most importantly, the coconut water is delicious.",
    },
  },
  {
    id: "syofyan-azhar",
    author: "Syofyan Azhar",
    source: "ayo",
    rating: 5,
    period: { id: "02 Jun 2026", en: "02 Jun 2026" },
    quote: {
      id: "Venue-nya oke, komunikasi staf-nya bagus. Saya pernah lupa hari saat booking dan akhirnya diberi opsi refund full di hari H.",
      en: "The venue is great and the staff communicate well. I once forgot my booking day and they still offered a full refund on the day itself.",
    },
  },
];
