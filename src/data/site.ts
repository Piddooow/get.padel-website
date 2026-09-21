/**
 * Central site configuration — mirrors the `site_config` / `venues` table in
 * the PRD (§6). Values are static for now (mock data); a lightweight CMS/DB
 * will replace this module later without changing component props.
 */
export const site = {
  name: "Get Padel Jakarta",
  tagline: "Get Padel, Get Well",
  address: {
    street: "Billy Moon Blok L V/9, Jl. Raya Kalimalang, RT 007 RW 010",
    district: "Kel. Pondok Kelapa, Kec. Duren Sawit",
    city: "Jakarta Timur 13450",
    plusCode: "QW4H+RR",
    coordinates: { lat: -6.2429028, lng: 106.9295802 },
  },
  links: {
    ayo: "https://ayo.co.id/v/get-padel-jakarta",
    linktree: "https://linktr.ee/getpadeljakarta",
    maps: "https://maps.app.goo.gl/kdb8QrEzGW8821Y76",
    instagram: "https://www.instagram.com/get.padel/",
    tiktok: "https://www.tiktok.com/@get.padel",
    cafeInstagram: "https://www.instagram.com/racerallycoffee/",
  },
  contact: {
    whatsapp: "6281188022770",
    whatsappDisplay: "0811 8802 2770",
    emailEvent: "getpadelcourt@gmail.com",
    emailCommercial: "getpadeljakarta@gmail.com",
  },
  hours: {
    courts: "06.00–22.00",
    cafe: "07.00–22.00",
  },
  ratings: {
    google: { score: 5.0, count: 52 },
    ayo: { score: 4.95, count: 180 },
    /** Ayo.co.id sub-ratings (getpadel-information.md §10.2). */
    sub: {
      cleanliness: 4.94,
      court: 4.94,
      communication: 4.93,
    },
  },
} as const;

/** Build a wa.me link with a prefilled message. */
export function whatsappLink(message: string): string {
  return `https://wa.me/${site.contact.whatsapp}?text=${encodeURIComponent(message)}`;
}

/** Hero image — venue exterior at dusk (Ayo.co.id gallery, stored locally). */
export const heroImage = "/images/hero-getpadel-dusk.jpg";
