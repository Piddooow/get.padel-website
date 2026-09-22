/**
 * Static content loaders (no database).
 *
 * The landing page is an informational site: every loader here reads the
 * plain-TypeScript content in `src/data/*` and returns the view shapes the UI
 * components expect. Booking, payments, accounts and newsletter live outside
 * the website (AYO handles court booking).
 */
import {
  courts as courtsMock,
  type Court,
} from "@/data/courts";
import {
  facilities as facilitiesMock,
  type FacilityIcon,
} from "@/data/facilities";
import {
  testimonials as testimonialsMock,
  type TestimonialSource,
} from "@/data/testimonials";
import { galleryPhotos as galleryMock } from "@/data/gallery";
import { getLatestBlogPosts } from "@/data/blog-posts";
import { faqItems } from "@/data/faq";
import { events as eventsMock } from "@/data/events";
import { programs as programsMock, type ProgramCta } from "@/data/programs";
import { archivedPromos, promos as promosMock } from "@/data/promos";
import {
  FIRST_HOUR,
  LAST_HOUR,
  getDayType,
  getSlotPrice,
} from "@/data/pricing";
import { pick } from "@/data/localized";

/* ------------------------------------------------------------ testimonials */

export interface TestimonialView {
  id: string;
  author: string;
  source: TestimonialSource;
  rating: number;
  period: string;
  quote: string;
}

export interface TestimonialsResponseDto {
  aggregate: { averageRating: number; count: number };
  platforms: {
    google: { score: number | null; count: number | null };
    ayo: { score: number | null; count: number | null };
    sub: {
      cleanliness: number | null;
      courtCondition: number | null;
      communication: number | null;
    };
  };
  count: number;
  testimonials: TestimonialView[];
}

/** Curated reviews (static) with platform ratings from the source snapshot. */
export async function loadTestimonials(
  locale: string
): Promise<TestimonialsResponseDto> {
  return {
    aggregate: {
      averageRating:
        Math.round(
          (testimonialsMock.reduce((sum, item) => sum + item.rating, 0) /
            testimonialsMock.length) *
            100
        ) / 100,
      count: testimonialsMock.length,
    },
    platforms: {
      google: { score: 5, count: 52 },
      ayo: { score: 4.95, count: 180 },
      sub: { cleanliness: 4.94, courtCondition: 4.94, communication: 4.93 },
    },
    count: testimonialsMock.length,
    testimonials: testimonialsMock.map((item) => ({
      id: item.id,
      author: item.author,
      source: item.source,
      rating: item.rating,
      period: pick(locale, item.period),
      quote: pick(locale, item.quote),
    })),
  };
}

/* ----------------------------------------------------------------- gallery */

export interface GalleryPhotoDto {
  id: string;
  src: string;
  alt: string;
}

export async function loadGallery(locale: string): Promise<GalleryPhotoDto[]> {
  return galleryMock.map((photo) => ({
    id: photo.id,
    src: photo.src,
    alt: pick(locale, photo.alt),
  }));
}

/* -------------------------------------------------------------------- blog */

export interface BlogPostSummaryDto {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  tag: string;
  cover: string | null;
  readMinutes: number;
  publishedAt: string;
}

export interface BlogPostDetailDto extends BlogPostSummaryDto {
  body: string[];
}

export async function loadBlogPosts(
  locale: string,
  limit = 3
): Promise<BlogPostSummaryDto[]> {
  return getLatestBlogPosts(limit).map((post) => ({
    id: post.slug,
    slug: post.slug,
    title: pick(locale, post.title),
    excerpt: pick(locale, post.excerpt),
    tag: pick(locale, post.tag),
    cover: post.cover,
    readMinutes: post.readMinutes,
    publishedAt: new Date(post.date).toISOString(),
  }));
}

export async function loadBlogPost(
  locale: string,
  slug: string
): Promise<BlogPostDetailDto | null> {
  const post = getLatestBlogPosts(20).find((item) => item.slug === slug);
  if (!post) return null;

  return {
    id: post.slug,
    slug: post.slug,
    title: pick(locale, post.title),
    excerpt: pick(locale, post.excerpt),
    tag: pick(locale, post.tag),
    cover: post.cover,
    readMinutes: post.readMinutes,
    publishedAt: new Date(post.date).toISOString(),
    body: post.body.map((paragraph) => pick(locale, paragraph)),
  };
}

/* -------------------------------------------------------------- facilities */

export interface FacilityView {
  id: string;
  icon: FacilityIcon;
  title: string;
  detail?: string;
  official: boolean;
}

export async function loadFacilities(locale: string): Promise<FacilityView[]> {
  return facilitiesMock.map((facility) => ({
    id: facility.id,
    icon: facility.icon,
    title: pick(locale, facility.title),
    detail: facility.detail ? pick(locale, facility.detail) : undefined,
    official: facility.official,
  }));
}

/* ------------------------------------------------------------------ courts */

export async function loadCourts(): Promise<Court[]> {
  return courtsMock;
}

/* ---------------------------------------------------------------- programs */

export interface ProgramView {
  id: string;
  group: "coaching" | "junior" | "trial";
  title: string;
  description: string;
  highlights: string[];
  priceRows?: { label: string; value: string }[];
  priceNote?: string;
  cta: ProgramCta;
  registrationUrl?: string | null;
}

export async function loadPrograms(locale: string): Promise<ProgramView[]> {
  return programsMock.map((program) => ({
    id: program.id,
    group:
      program.group === "junior"
        ? "junior"
        : program.group === "trial"
          ? "trial"
          : "coaching",
    title: pick(locale, program.title),
    description: pick(locale, program.description),
    highlights: program.highlights.map((highlight) => pick(locale, highlight)),
    priceRows: program.priceRows?.map((row) => ({
      label: pick(locale, row.label),
      value: row.value,
    })),
    priceNote: program.priceNote ? pick(locale, program.priceNote) : undefined,
    cta: program.cta,
  }));
}

/* ------------------------------------------------------------------ events */

export interface EventCardView {
  id: string;
  title: string;
  period: string;
  description: string;
  startsAt: string | null;
}

/** Events split into upcoming/archive for the Program page. */
export async function loadEvents(
  locale: string
): Promise<{ upcoming: EventCardView[]; archive: EventCardView[] }> {
  const now = Date.now();
  const cards: EventCardView[] = eventsMock.map((event) => ({
    id: event.id,
    title: pick(locale, event.title),
    period: pick(locale, event.period),
    description: pick(locale, event.description),
    startsAt: event.startsAt ?? null,
  }));

  const isUpcoming = (card: EventCardView) =>
    Boolean(card.startsAt) && new Date(card.startsAt as string).getTime() >= now;

  return {
    upcoming: cards.filter(isUpcoming),
    archive: cards.filter((card) => !isUpcoming(card)).reverse(),
  };
}

/* --------------------------------------------------------------------- FAQ */

export interface FaqView {
  id: string;
  question: string;
  answer: string;
}

export async function loadFaqs(locale: string): Promise<FaqView[]> {
  return faqItems.map((item) => ({
    id: item.id,
    question: pick(locale, item.question),
    answer: pick(locale, item.answer),
  }));
}

/* ------------------------------------------------------------------- venue */

export interface VenueProfile {
  name: string;
  tagline: string;
  address: {
    street: string;
    district: string;
    city: string;
    plusCode: string;
  };
  hours: {
    courtsOpenHour: number;
    courtsCloseHour: number;
    cafeOpenHour: number;
    cafeCloseHour: number;
  };
  ratings: {
    google: { score: number | null; count: number | null };
    ayo: { score: number | null; count: number | null };
    sub: {
      cleanliness: number | null;
      courtCondition: number | null;
      communication: number | null;
    };
  };
  contact: {
    whatsapp: string;
    whatsappDisplay: string;
    emailEvent: string | null;
    emailCommercial: string | null;
    instagramUrl: string | null;
    tiktokUrl: string | null;
    cafeInstagramUrl: string | null;
  };
}

/** Venue identity, hours, ratings and contacts (static source of truth). */
export async function loadVenueProfile(): Promise<VenueProfile> {
  return {
    name: "Get Padel Jakarta",
    tagline: "Get Padel, Get Well",
    address: {
      street: "Billy Moon Blok L V/9, Jl. Raya Kalimalang, RT 007 RW 010",
      district: "Kel. Pondok Kelapa, Kec. Duren Sawit",
      city: "Jakarta Timur 13450",
      plusCode: "QW4H+RR",
    },
    hours: {
      courtsOpenHour: 6,
      courtsCloseHour: 22,
      cafeOpenHour: 7,
      cafeCloseHour: 22,
    },
    ratings: {
      google: { score: 5, count: 52 },
      ayo: { score: 4.95, count: 180 },
      sub: { cleanliness: 4.94, courtCondition: 4.94, communication: 4.93 },
    },
    contact: {
      whatsapp: "6281188022770",
      whatsappDisplay: "0811 8802 2770",
      emailEvent: "getpadelcourt@gmail.com",
      emailCommercial: "getpadeljakarta@gmail.com",
      instagramUrl: "https://www.instagram.com/get.padel/",
      tiktokUrl: "https://www.tiktok.com/@get.padel",
      cafeInstagramUrl: "https://www.instagram.com/racerallycoffee/",
    },
  };
}

/* ----------------------------------------------------------------- pricing */

export interface RateRow {
  hour: number;
  price: number;
  strike: number;
  peak: boolean;
}

export interface RateCardView {
  weekday: RateRow[];
  weekend: RateRow[];
}

function rateRowsFor(dayType: "weekday" | "weekend", dateISO: string): RateRow[] {
  const rows: RateRow[] = [];
  for (let hour = FIRST_HOUR; hour <= LAST_HOUR; hour++) {
    const { price, strike } = getSlotPrice(dateISO, hour);
    rows.push({ hour, price, strike, peak: hour >= 18 });
  }
  return rows;
}

/** Informational rate card for both day types (from the static rate rules). */
export async function loadRateCard(): Promise<RateCardView> {
  // A representative Monday and Saturday keep the card stable every day.
  const weekday = rateRowsFor("weekday", "2026-01-05");
  const weekend = rateRowsFor("weekend", "2026-01-10");
  return { weekday, weekend };
}

export interface TierRow {
  price: number;
  strike: number;
}

/** Three headline tiers per day type (info only; final price on AYO). */
export async function loadPricingTiers(): Promise<{
  weekday: TierRow[];
  weekend: TierRow[];
}> {
  return {
    weekday: [
      { price: 150_000, strike: 225_000 },
      { price: 180_000, strike: 225_000 },
      { price: 260_000, strike: 300_000 },
    ],
    weekend: [
      { price: 200_000, strike: 330_000 },
      { price: 250_000, strike: 330_000 },
      { price: 260_000, strike: 300_000 },
    ],
  };
}

/* ------------------------------------------------------------------- promos */

export interface PromoView {
  id: string;
  title: string;
  period: string;
  detail: string;
  code: string | null;
  source: string | null;
  link: string | null;
  reference: string | null;
  poster?: string;
  isRunning: boolean;
  /** Structured validity window (YYYY-MM-DD); null = open ended. */
  startsOn: string | null;
  endsOn: string | null;
}

function isPromoRunning(startsOn?: string, endsOn?: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  if (startsOn && today < startsOn) return false;
  if (endsOn && today > endsOn) return false;
  return true;
}

/** Active promotions first, then the archive (never shown as running). */
export async function loadPromos(locale: string): Promise<PromoView[]> {
  const map = (promo: (typeof promosMock)[number], archived: boolean): PromoView => ({
    id: promo.id,
    title: pick(locale, promo.title),
    period: pick(locale, promo.period),
    detail: pick(locale, promo.detail),
    code: null,
    source: promo.source ?? null,
    link: promo.link ?? null,
    reference: promo.reference ?? null,
    poster: promo.poster,
    isRunning: !archived && isPromoRunning(promo.startsOn, promo.endsOn),
    startsOn: promo.startsOn ?? null,
    endsOn: promo.endsOn ?? null,
  });

  return [
    ...promosMock.filter((p) => !p.archived).map((p) => map(p, false)),
    ...archivedPromos.map((p) => map(p, true)),
  ];
}

export { getDayType };
