/**
 * Social highlights — selected posts from the venue's own Instagram accounts
 * (@get.padel and @racerallycoffee). Captions are used as published in the
 * source archive (getpadel-information.md §12–13); nothing is invented.
 */
export type SocialAccount = "getpadel" | "racerallycoffee";

export interface SocialPost {
  id: string;
  account: SocialAccount;
  /** Publication date label (source snapshot). */
  date: string;
  /** Original caption excerpt from the archive. */
  caption: string;
  url: string;
  /** Local copy of the archived post image (public path). */
  image: string;
  /** Short description for the image (accessibility). */
  imageAlt: string;
}

export const socialAccounts: Record<
  SocialAccount,
  { handle: string; label: string; url: string }
> = {
  getpadel: {
    handle: "@get.padel",
    label: "Get Padel Jakarta",
    url: "https://www.instagram.com/get.padel/",
  },
  racerallycoffee: {
    handle: "@racerallycoffee",
    label: "Race & Rally Coffee",
    url: "https://www.instagram.com/racerallycoffee/",
  },
};

export const socialPosts: SocialPost[] = [
  {
    id: "chasing-sunset",
    image: "/images/social/social-chasing-sunset.jpg",
    imageAlt:
      "Momen Chasing Sunset komunitas Get Padel / Get Padel Chasing Sunset community moment",
    account: "getpadel",
    date: "29 Agustus 2026",
    caption:
      "CHASING SUNSET: August edition recap! Snack abis main padel? Ya @karro.roti dong.",
    url: "https://www.instagram.com/get.padel/reel/DcnBaahSYti/",
  },
  {
    id: "loyalty-card",
    image: "/images/social/social-loyalty-card.jpg",
    imageAlt:
      "Kartu loyalty Race & Rally dengan minuman / Race & Rally loyalty card with drinks",
    account: "racerallycoffee",
    date: "16 September 2026",
    caption:
      "Loyalty Card is here! Kumpulkan 1 stamp per pembelian min. 30K. Pembelian ke-10 gratis 1 minuman.",
    url: "https://www.instagram.com/p/DdYA6y-vxNz/",
  },
  {
    id: "jamu-day",
    image: "/images/social/social-jamu-day.jpg",
    imageAlt:
      "Recap Jamu Day di Get Padel / Jamu Day recap at Get Padel",
    account: "getpadel",
    date: "3 Juni 2026",
    caption:
      "Recap Pancasila Day: celebrating togetherness, wellness, dan jamu gratis untuk semua yang datang.",
    url: "https://www.instagram.com/get.padel/reel/DZH2yk0yLs6/",
  },
  {
    id: "fuel-up",
    image: "/images/social/social-fuel-up.jpg",
    imageAlt:
      "Dua minuman Race & Rally / Two Race & Rally drinks",
    account: "racerallycoffee",
    date: "30 Juli 2026",
    caption:
      "Fuel up with us! Buka setiap hari 07.00–22.00, tersedia GoFood & GrabFood.",
    url: "https://www.instagram.com/p/DbcfSfJvTdB/",
  },
  {
    id: "junior-summer",
    image: "/images/social/social-junior-summer.jpg",
    imageAlt:
      "Poster Junior Summer Class / Junior Summer Class poster",
    account: "getpadel",
    date: "25 Juni 2026",
    caption:
      "Junior Summer Class: biarkan anak-anak menemukan keseruan padel, mulai dari koordinasi, teamwork, sampai percaya diri.",
    url: "https://www.instagram.com/get.padel/p/DaASp1tSzQ6/",
  },
  {
    id: "now-brewing",
    image: "/images/social/social-now-brewing.jpg",
    imageAlt:
      "Poster NOW OPEN Race & Rally / Race & Rally NOW OPEN poster",
    account: "racerallycoffee",
    date: "28 Juli 2026",
    caption:
      "We're now brewing at Get Padel Jakarta. Kopi siap menemani sebelum dan sesudah rally.",
    url: "https://www.instagram.com/p/DbVjsBvvqaM/",
  },
  {
    id: "one-hour-one-box",
    image: "/images/social/social-one-hour-one-box.jpg",
    imageAlt:
      "Poster promo 1 Hour 1 Box / 1 Hour 1 Box promo poster",
    account: "getpadel",
    date: "9 September 2026",
    caption:
      "PLAY HARD, SNACK SMART! Book 1 jam dan dapat gratis 1 box snack selama stok tersedia.",
    url: "https://www.instagram.com/get.padel/p/DdEWI0jSYsX/",
  },
  {
    id: "kartini-rally",
    image: "/images/social/social-kartini.jpg",
    imageAlt:
      "Rally Hari Kartini bersama Padel Moms Club / Kartini Day rally with Padel Moms Club",
    account: "getpadel",
    date: "24 April 2026",
    caption:
      "Kebaya on, game strong. Rally bersama Padel Moms Club merayakan Hari Kartini.",
    url: "https://www.instagram.com/padelmomsclub/reel/DXgQjf7iYbX/",
  },
];
