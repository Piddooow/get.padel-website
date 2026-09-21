/**
 * Server-side content loaders for the UI.
 *
 * Each loader reads the database services and falls back to the static mock
 * modules when the database is empty or unavailable — so pages always render
 * and the seeded data is what visitors actually see. Used by Server
 * Components (App Router best practice: fetch data where it is rendered).
 */
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  getTestimonials,
  type TestimonialsResponseDto,
} from "@/lib/testimonial-service";
import { listGalleryPhotos, type GalleryPhotoDto } from "@/lib/gallery-service";
import {
  getBlogPost,
  listBlogPosts,
  type BlogPostDetailDto,
  type BlogPostSummaryDto,
} from "@/lib/blog-service";
import { getSiteConfig } from "@/lib/site-config-service";
import { getVenueDetail } from "@/lib/venue-service";
import { listCoachingPrograms, type ProgramKind } from "@/lib/program-service";
import { classifyEventStatus, listEvents } from "@/lib/event-service";
import { listOpenMatches, type SpotsStatus } from "@/lib/open-match-service";
import { listFaqs } from "@/lib/faq-service";
import { listPromos, type LocalizedPromo } from "@/lib/promos-service";
import { isPeakHour } from "@/lib/schedule-service";
import { getLatestBlogPosts } from "@/data/blog-posts";
import { courts as courtsMock, type Court } from "@/data/courts";
import { events as eventsMock } from "@/data/events";
import { facilities as facilitiesMock, type FacilityIcon } from "@/data/facilities";
import { faqItems } from "@/data/faq";
import { galleryPhotos as galleryMock } from "@/data/gallery";
import { archivedPromos, promos as promosMock } from "@/data/promos";
import { programs as programsMock, type ProgramCta } from "@/data/programs";
import { FIRST_HOUR, LAST_HOUR, getSlotPrice } from "@/data/pricing";
import { testimonials as testimonialsMock } from "@/data/testimonials";
import { pick } from "@/data/localized";

const VENUE_ID = "get-padel-jakarta";

/** Testimonials + aggregated ratings with a mock fallback. */
export async function loadTestimonials(
  locale: string
): Promise<TestimonialsResponseDto> {
  try {
    const data = await getTestimonials({ locale });
    if (data.count > 0) return data;
  } catch {
    // fall through to the mock data
  }

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

/** Gallery photos with a mock fallback. */
export async function loadGallery(locale: string): Promise<GalleryPhotoDto[]> {
  try {
    const photos = await listGalleryPhotos({ locale });
    if (photos.length > 0) return photos;
  } catch {
    // fall through to the mock data
  }

  return galleryMock.map((photo) => ({
    id: photo.id,
    src: photo.src,
    alt: pick(locale, photo.alt),
  }));
}

/** Blog summaries (newest first) with a mock fallback. */
export async function loadBlogPosts(
  locale: string,
  limit = 3
): Promise<BlogPostSummaryDto[]> {
  try {
    const posts = await listBlogPosts({ locale, limit });
    if (posts.length > 0) return posts;
  } catch {
    // fall through to the mock data
  }

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

/** One blog post with body, with a mock fallback. */
export async function loadBlogPost(
  locale: string,
  slug: string
): Promise<BlogPostDetailDto | null> {
  try {
    const post = await getBlogPost({ locale, slug });
    if (post) return post;
  } catch {
    // fall through to the mock data
  }

  const mock = getLatestBlogPosts(20).find((post) => post.slug === slug);
  if (!mock) return null;

  return {
    id: mock.slug,
    slug: mock.slug,
    title: pick(locale, mock.title),
    excerpt: pick(locale, mock.excerpt),
    tag: pick(locale, mock.tag),
    cover: mock.cover,
    readMinutes: mock.readMinutes,
    publishedAt: new Date(mock.date).toISOString(),
    body: mock.body.map((paragraph) => pick(locale, paragraph)),
  };
}


export interface FacilityView {
  id: string;
  icon: FacilityIcon;
  title: string;
  detail?: string;
  official: boolean;
}

/** Facilities for the Location page, with a mock fallback. */
export async function loadFacilities(locale: string): Promise<FacilityView[]> {
  try {
    const venue = await getVenueDetail(VENUE_ID);
    if (venue && venue.facilities.length > 0) {
      return venue.facilities.map((facility) => ({
        id: facility.id,
        icon: facility.icon as FacilityIcon,
        title: locale === "en" ? facility.titleEn : facility.titleId,
        detail: (locale === "en" ? facility.detailEn : facility.detailId) ?? undefined,
        official: facility.official,
      }));
    }
  } catch {
    // fall through to the mock data
  }

  return facilitiesMock.map((facility) => ({
    id: facility.id,
    icon: facility.icon,
    title: pick(locale, facility.title),
    detail: facility.detail ? pick(locale, facility.detail) : undefined,
    official: facility.official,
  }));
}

/** Court specs for the Location page, with a mock fallback. */
export async function loadCourts(): Promise<Court[]> {
  try {
    const venue = await getVenueDetail(VENUE_ID);
    if (venue && venue.courts.length > 0) {
      return venue.courts.map((court) => ({
        id: court.id,
        name: court.name,
        indoor: court.indoor,
        surface: court.surface,
        sessionMinutes: court.sessionMinutes,
        description: "",
        image: `/images/${court.id}.jpg`,
      }));
    }
  } catch {
    // fall through to the mock data
  }

  return courtsMock;
}

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

const KIND_TO_GROUP: Record<ProgramKind, ProgramView["group"]> = {
  private: "coaching",
  multi_session: "coaching",
  junior: "junior",
  free_trial: "trial",
};

function formatIdr(value: number): string {
  return `Rp${new Intl.NumberFormat("id-ID").format(value)}`;
}

/** Coaching programmes for the Program page, with a mock fallback. */
export async function loadPrograms(locale: string): Promise<ProgramView[]> {
  try {
    const programs = await listCoachingPrograms({ locale });
    if (programs.length > 0) {
      return programs.map((program) => ({
        id: program.id,
        group: KIND_TO_GROUP[program.kind] ?? "coaching",
        title: program.title,
        description: program.description,
        highlights: program.highlights,
        priceRows: program.tiers.map((tier) => ({
          label: tier.label,
          value: formatIdr(tier.priceIdr ?? 0),
        })),
        priceNote: program.priceNote ?? undefined,
        cta: program.ctaKind === "form" ? "form" : program.ctaKind === "ayo" ? "ayo" : "wa",
        registrationUrl: program.registrationUrl,
      }));
    }
  } catch {
    // fall through to the mock data
  }

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

export interface EventCardView {
  id: string;
  title: string;
  period: string;
  description: string;
  startsAt: string | null;
}

/** Events split into upcoming/archive for the Program page, with fallback. */
export async function loadEvents(
  locale: string
): Promise<{ upcoming: EventCardView[]; archive: EventCardView[] }> {
  const now = new Date();
  try {
    const events = await listEvents({ locale });
    if (events.length > 0) {
      const cards = events.map((event) => ({
        id: event.id,
        title: event.title,
        period: event.period,
        description: event.description,
        startsAt: event.startsAt,
      }));
      return {
        upcoming: cards.filter((event) => event.startsAt !== null),
        archive: cards.filter((event) => event.startsAt === null).reverse(),
      };
    }
  } catch {
    // fall through to the mock data
  }

  const cards: EventCardView[] = eventsMock.map((event) => ({
    id: event.id,
    title: pick(locale, event.title),
    period: pick(locale, event.period),
    description: pick(locale, event.description),
    startsAt: event.startsAt ?? null,
  }));
  return {
    upcoming: cards.filter(
      (event) =>
        event.startsAt &&
        classifyEventStatus(new Date(event.startsAt), now) === "upcoming"
    ),
    archive: cards
      .filter(
        (event) =>
          !event.startsAt ||
          classifyEventStatus(new Date(event.startsAt), now) === "past"
      )
      .reverse(),
  };
}

export interface OpenMatchView {
  id: string;
  day: string;
  time: string;
  level: string;
  courtNote: string;
  spotsTotal: number;
  spotsLeft: number;
  status: SpotsStatus;
  /** ISO datetime of the session; null until the venue announces it. */
  startsAt: string | null;
}

/**
 * Open match sessions with live spots. Data comes from the venue-maintained
 * `open_matches` table ONLY — never fabricated in code, so the Join button can
 * be trusted to reflect real availability.
 */
export async function loadOpenMatches(
  locale: string
): Promise<OpenMatchView[]> {
  try {
    const matches = await listOpenMatches({ locale });
    return matches.map((match) => ({
      id: match.id,
      day: match.day,
      time: match.time,
      level: match.level,
      courtNote: match.courtNote,
      spotsTotal: match.spotsTotal,
      spotsLeft: match.spotsLeft,
      status: match.status,
      startsAt: match.startsAt,
    }));
  } catch {
    return [];
  }
}

export interface FaqView {
  id: string;
  question: string;
  answer: string;
}

/** FAQ entries for the Location and Help pages, with a mock fallback. */
export async function loadFaqs(locale: string): Promise<FaqView[]> {
  try {
    const faqs = await listFaqs({ locale });
    if (faqs.length > 0) return faqs;
  } catch {
    // fall through to the mock data
  }

  return faqItems.map((item) => ({
    id: item.id,
    question: pick(locale, item.question),
    answer: pick(locale, item.answer),
  }));
}


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

const CONTACT_FALLBACK: VenueProfile["contact"] = {
  whatsapp: "6281188022770",
  whatsappDisplay: "0811 8802 2770",
  emailEvent: "getpadelcourt@gmail.com",
  emailCommercial: "getpadeljakarta@gmail.com",
  instagramUrl: "https://www.instagram.com/get.padel/",
  tiktokUrl: "https://www.tiktok.com/@get.padel",
  cafeInstagramUrl: "https://www.instagram.com/racerallycoffee/",
};

/** Venue identity, hours, ratings and contacts with a static fallback. */
export async function loadVenueProfile(): Promise<VenueProfile> {
  try {
    const config = await getSiteConfig();
    if (config) {
      return {
        name: config.venue.name,
        tagline: config.venue.tagline,
        address: {
          street: config.address.street,
          district: config.address.district,
          city: config.address.city,
          plusCode: config.address.plusCode,
        },
        hours: {
          courtsOpenHour: config.hours.courtsOpenHour,
          courtsCloseHour: config.hours.courtsCloseHour,
          cafeOpenHour: config.hours.cafeOpenHour,
          cafeCloseHour: config.hours.cafeCloseHour,
        },
        ratings: config.ratings ?? {
          google: { score: null, count: null },
          ayo: { score: null, count: null },
          sub: { cleanliness: null, courtCondition: null, communication: null },
        },
        contact: config.contact,
      };
    }
  } catch {
    // fall through to the static data
  }

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
    contact: CONTACT_FALLBACK,
  };
}


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

const SAMPLE_DATES = { weekday: "2026-09-21", weekend: "2026-09-26" } as const;

/** Peak/off-peak rate card rows from the DB, with a mock fallback. */
export async function loadRateCard(): Promise<RateCardView> {
  try {
    const rows = await db
      .select()
      .from(schema.pricingRules)
      .orderBy(asc(schema.pricingRules.hour));
    if (rows.length > 0) {
      const build = (dayType: "weekday" | "weekend"): RateRow[] =>
        rows
          .filter((row) => row.dayType === dayType)
          .map((row) => ({
            hour: row.hour,
            price: row.price,
            strike: row.strikePrice,
            peak: row.isPeak,
          }));
      const weekday = build("weekday");
      const weekend = build("weekend");
      if (weekday.length > 0 && weekend.length > 0) {
        return { weekday, weekend };
      }
    }
  } catch {
    // fall through to the static rate card
  }

  const build = (dayType: "weekday" | "weekend"): RateRow[] =>
    Array.from(
      { length: LAST_HOUR - FIRST_HOUR + 1 },
      (_, index) => FIRST_HOUR + index
    ).map((hour) => {
      const { price, strike } = getSlotPrice(SAMPLE_DATES[dayType], hour);
      return { hour, price, strike, peak: isPeakHour(dayType, hour) };
    });

  return { weekday: build("weekday"), weekend: build("weekend") };
}

export interface TierRow {
  price: number;
  strike: number;
}

/** Up to three distinct price tiers per day type (ascending price). */
export async function loadPricingTiers(): Promise<{
  weekday: TierRow[];
  weekend: TierRow[];
}> {
  const card = await loadRateCard();

  const tiersOf = (rows: RateRow[]): TierRow[] => {
    const seen = new Map<number, TierRow>();
    for (const row of rows) {
      if (!seen.has(row.price)) {
        seen.set(row.price, { price: row.price, strike: row.strike });
      }
    }
    return [...seen.values()]
      .sort((a, b) => a.price - b.price)
      .slice(0, 3);
  };

  return {
    weekday: tiersOf(card.weekday),
    weekend: tiersOf(card.weekend),
  };
}

export interface PromoView {
  id: string;
  title: string;
  period: string;
  detail: string;
  code: string | null;
  source: string | null;
  link: string | null;
  reference: string | null;
  /** Promo aktif DAN masih di dalam periode berlaku. */
  isRunning: boolean;
}

/** Promos (running + archive) from the DB, with a mock fallback. */
export async function loadPromos(locale: string): Promise<PromoView[]> {
  try {
    const rows = await listPromos({
      includeExpired: true,
      locale: locale === "en" ? "en" : "id",
    });
    if (rows.length > 0) {
      return rows.map((promo: LocalizedPromo) => ({
        id: promo.id,
        title: promo.title,
        period: promo.period,
        detail: promo.detail,
        code: promo.code,
        source: promo.source,
        link: promo.linkUrl,
        reference: promo.reference,
        isRunning: promo.active,
      }));
    }
  } catch {
    // fall through to the mock data
  }

  const todayISO = new Date().toISOString().slice(0, 10);
  return [...promosMock, ...archivedPromos].map((promo) => ({
    id: promo.id,
    title: pick(locale, promo.title),
    period: pick(locale, promo.period),
    detail: pick(locale, promo.detail),
    code: null,
    source: promo.source ?? null,
    link: promo.link ?? null,
    reference: promo.reference ?? null,
    isRunning:
      !promo.archived &&
      (!promo.endsOn || promo.endsOn >= todayISO) &&
      (!promo.startsOn || promo.startsOn <= todayISO),
  }));
}
