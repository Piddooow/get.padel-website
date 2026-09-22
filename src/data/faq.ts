/**
 * FAQ — answers composed strictly from the venue facts in
 * getpadel-information.md (§7 fasilitas, §8 aturan, §9 kebijakan, §11 promo)
 * and PRD §8. Static mock data for now; a lightweight CMS will replace it.
 */
import type { Localized } from "./localized";

export interface FaqItem {
  id: string;
  question: Localized;
  answer: Localized;
}

export const faqItems: FaqItem[] = [
  {
    id: "included",
    question: {
      id: "Apa saja yang sudah termasuk dalam harga sewa?",
      en: "What is included in the court rental price?",
    },
    answer: {
      id: "Setiap sesi 60 menit sudah termasuk 2 dus air mineral 240 ml. Setelah bermain kamu juga mendapat handuk dingin.",
      en: "Every 60-minute session includes 2 boxes of 240 ml mineral water. You also get a cold towel after playing.",
    },
  },
  {
    id: "how-to-book",
    question: {
      id: "Bagaimana cara booking lapangan?",
      en: "How do I book a court?",
    },
    answer: {
      id: "Booking melalui kanal resmi AYO (ayo.co.id/v/get-padel-jakarta) atau chat CS WhatsApp 0811 8802 2770. Saat checkout, slot ditahan sementara sekitar 10 menit sampai pembayaran selesai.",
      en: "Book through the official AYO channel (ayo.co.id/v/get-padel-jakarta) or chat CS on WhatsApp +62 811 8802 2770. At checkout the slot is held for about 10 minutes until payment is completed.",
    },
  },
  {
    id: "booking-window",
    question: {
      id: "Berapa lama slot bisa dibooking di muka?",
      en: "How far in advance can I book?",
    },
    answer: {
      id: "Slot terbuka hingga ± 1 bulan ke depan. Jam favorit (weekday 18.00–22.00 dan hampir semua slot weekend) paling cepat penuh.",
      en: "Slots are open up to ~1 month ahead. Favourite hours (weekday 18:00–22:00 and almost all weekend slots) fill up first.",
    },
  },
  {
    id: "outside-coach",
    question: {
      id: "Boleh bawa coach dari luar?",
      en: "Can I bring my own coach?",
    },
    answer: {
      id: "Boleh, tanpa biaya tambahan. Reservasi tanpa coaching diperlakukan sebagai sesi bermain biasa.",
      en: "Yes, at no extra charge. A booking without coaching is treated as a regular play session.",
    },
  },
  {
    id: "reschedule-refund",
    question: {
      id: "Apakah bisa reschedule atau refund?",
      en: "Can I reschedule or get a refund?",
    },
    answer: {
      id: "Pembatalan dan refund tidak tersedia. Reschedule gratis maksimal 1 kali hingga 5 hari sebelum jadwal. Untuk anggota membership, perubahan jadwal maksimal info 3×24 jam sebelum tanggal bermain, sesuai ketersediaan lapangan.",
      en: "Cancellations and refunds are not available. Rescheduling is free, once, up to 5 days before your slot. Members may change their schedule with at least 3×24 hours' notice, subject to court availability.",
    },
  },
  {
    id: "racket-rental",
    question: {
      id: "Bisa sewa raket? Bagaimana kalau rusak?",
      en: "Can I rent a racket? What if it gets damaged?",
    },
    answer: {
      id: "Sewa raket tersedia lengkap, termasuk raket anak. Raket yang dikembalikan rusak dikenakan denda minimum Rp300.000.",
      en: "Racket rental is available, including kids' rackets. A racket returned damaged incurs a minimum Rp300,000 fee.",
    },
  },
  {
    id: "rules",
    question: {
      id: "Aturan sepatu & area lapangan?",
      en: "What are the shoe and court rules?",
    },
    answer: {
      id: "Wajib memakai sepatu olahraga bersih (non-marking & no-studs). Makanan dan minuman dilarang dibawa ke area lapangan. Seluruh area bebas asap rokok, dan vape atau e-cigarette diperkenankan.",
      en: "Clean sports shoes are required (non-marking & no-studs). Food and drinks are not allowed on the court. The whole venue is smoke-free, and vaping or e-cigarettes are permitted.",
    },
  },
  {
    id: "kids",
    question: {
      id: "Apakah anak-anak boleh bermain?",
      en: "Can kids play here?",
    },
    answer: {
      id: "Boleh. Anak di bawah 12 tahun wajib dalam pengawasan orang dewasa, dan tersedia kelas junior untuk usia 6–9 tahun & 10–13 tahun.",
      en: "Yes. Children under 12 must be supervised by an adult, and junior classes are available for ages 6–9 and 10–13.",
    },
  },
  {
    id: "parking-facilities",
    question: {
      id: "Fasilitas apa saja yang tersedia di venue?",
      en: "What facilities are available at the venue?",
    },
    answer: {
      id: "Parkir mobil & motor, ruang ganti, shower air panas, kamar mandi ber-AC, Wi-Fi, musholla, tribun penonton, toko olahraga, dan cafe Race & Rally. Setelah bermain kamu mendapat handuk dingin.",
      en: "Car & motorbike parking, changing room, hot showers, air-conditioned bathrooms, Wi-Fi, a musholla, spectator tribune, sports shop, and the Race & Rally cafe. You also get a cold towel after playing.",
    },
  },
  {
    id: "payment",
    question: {
      id: "Metode pembayaran apa saja yang diterima?",
      en: "Which payment methods are accepted?",
    },
    answer: {
      id: "Pembayaran diproses di kanal resmi AYO: QRIS, Virtual Account, e-wallet, kartu kredit/debit, serta cicilan 0% Mandiri & BRI (syarat berlaku).",
      en: "Payment is processed on the official AYO channel: QRIS, Virtual Account, e-wallet, credit/debit cards, and 0% instalments with Mandiri & BRI (terms apply).",
    },
  },
  {
    id: "membership",
    question: {
      id: "Bagaimana cara beli paket membership?",
      en: "How do I buy a membership package?",
    },
    answer: {
      id: "Paket membership Get Padel hanya dapat dibeli melalui aplikasi AYO Indonesia. Harga dan voucher aktif terlihat langsung di aplikasi.",
      en: "Get Padel membership packages can only be purchased through the AYO Indonesia app. Pricing and active vouchers are shown in the app.",
    },
  },
  {
    id: "events",
    question: {
      id: "Bisa untuk event atau konten komersial?",
      en: "Can I use the venue for events or commercial shoots?",
    },
    answer: {
      id: "Harga normal hanya untuk penggunaan non-event. Untuk turnamen, brand/booth, shooting, pre-wedding, atau iklan, hubungi getpadeljakarta@gmail.com atau WA 0811 8802 2770. Tarif khusus di luar harga normal.",
      en: "Standard rates are for non-event use only. For tournaments, brand booths, shoots, pre-weddings or ads, contact getpadeljakarta@gmail.com or WhatsApp +62 811 8802 2770. Commercial rates apply.",
    },
  },
];
