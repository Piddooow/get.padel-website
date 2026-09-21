/**
 * Database schema (SQLite / Drizzle ORM) — PRD §6.
 *
 * Scope for this task: venue, courts, and the schedule-slot table that backs
 * the real-time availability engine. Other tables (pricing_rules, promos, …)
 * are added by their own tasks.
 *
 * Booking & payment are intentionally NOT modelled here — transactions are
 * handled entirely by the official AYO channel (PRD §5).
 */
import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/** Single-row venue configuration (one venue → one row). */
export const venues = sqliteTable("venues", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),

  addressStreet: text("address_street").notNull(),
  addressDistrict: text("address_district").notNull(),
  addressCity: text("address_city").notNull(),
  plusCode: text("plus_code").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),

  /** Opening hours in 24h format (courts 6–22, cafe 7–22). */
  courtOpenHour: integer("court_open_hour").notNull(),
  courtCloseHour: integer("court_close_hour").notNull(),
  cafeOpenHour: integer("cafe_open_hour").notNull(),
  cafeCloseHour: integer("cafe_close_hour").notNull(),
  sessionMinutes: integer("session_minutes").notNull().default(60),

  ratingGoogle: real("rating_google"),
  ratingGoogleCount: integer("rating_google_count"),
  ratingAyo: real("rating_ayo"),
  ratingAyoCount: integer("rating_ayo_count"),
  /** Ayo.co.id sub-ratings (getpadel-information.md §10.2). */
  ratingCleanliness: real("rating_cleanliness"),
  ratingCourtCondition: real("rating_court_condition"),
  ratingCommunication: real("rating_communication"),

  whatsapp: text("whatsapp").notNull(),
  emailEvent: text("email_event"),
  emailCommercial: text("email_commercial"),
  instagramUrl: text("instagram_url"),
  tiktokUrl: text("tiktok_url"),
  cafeInstagramUrl: text("cafe_instagram_url"),

  bookingUrl: text("booking_url").notNull(),
  mapsUrl: text("maps_url"),
  linktreeUrl: text("linktree_url"),

  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

/** Physical courts belonging to a venue. */
export const courts = sqliteTable(
  "courts",
  {
    id: text("id").primaryKey(),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    indoor: integer("indoor", { mode: "boolean" }).notNull().default(true),
    surface: text("surface").notNull(),
    sessionMinutes: integer("session_minutes").notNull().default(60),
    descriptionEn: text("description_en"),
    imageUrl: text("image_url"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("courts_venue_idx").on(table.venueId),
    check("courts_session_minutes_check", sql`${table.sessionMinutes} > 0`),
  ]
);

/**
 * Venue facilities (PRD §6 `facilities`): the 12 official Ayo.co.id items plus
 * additional amenities from reviews/venue info, bilingual and ordered for the
 * Location page. Content source: getpadel-information.md §7.
 */
export const facilities = sqliteTable(
  "facilities",
  {
    id: text("id").primaryKey(),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    titleId: text("title_id").notNull(),
    titleEn: text("title_en").notNull(),
    /** Short supporting note (extra amenities), optional. */
    detailId: text("detail_id"),
    detailEn: text("detail_en"),
    /** Icon key mapped to a lucide icon in the UI. */
    icon: text("icon").notNull(),
    /** Official (Ayo.co.id) vs. additional amenity from reviews/venue info. */
    official: integer("official", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    index("facilities_venue_idx").on(table.venueId, table.sortOrder),
  ]
);

/**
 * Hourly slot availability per court (the "slot jadwal" engine).
 * One row per court + date + hour; status mirrors what AYO exposes.
 */
export const scheduleSlots = sqliteTable(
  "schedule_slots",
  {
    id: text("id").primaryKey(), // `${courtId}:${date}:${hour}`
    courtId: text("court_id")
      .notNull()
      .references(() => courts.id, { onDelete: "cascade" }),
    /** Local date, YYYY-MM-DD. */
    date: text("date").notNull(),
    /** Slot start hour in 24h format. */
    hour: integer("hour").notNull(),
    status: text("status", { enum: ["available", "booked", "past"] }).notNull(),
    /** Where the status came from ("mock" until the AYO integration lands). */
    source: text("source", { enum: ["mock", "ayo"] })
      .notNull()
      .default("mock"),
    checkedAt: integer("checked_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    uniqueIndex("schedule_slots_court_date_hour_unique").on(
      table.courtId,
      table.date,
      table.hour
    ),
    index("schedule_slots_date_idx").on(table.date),
    check(
      "schedule_slots_hour_check",
      sql`${table.hour} >= 0 AND ${table.hour} <= 23`
    ),
  ]
);

/**
 * Peak / off-peak rate card (PRD §6 `pricing_rules`): one row per venue +
 * day type + hour, with the strike-through (normal) price.
 */
export const pricingRules = sqliteTable(
  "pricing_rules",
  {
    id: text("id").primaryKey(), // `${dayType}:${hour}`
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    dayType: text("day_type", { enum: ["weekday", "weekend"] }).notNull(),
    hour: integer("hour").notNull(),
    /** Discounted price in IDR (per 60-minute session). */
    price: integer("price").notNull(),
    /** Regular (strike-through) price in IDR. */
    strikePrice: integer("strike_price").notNull(),
    isPeak: integer("is_peak", { mode: "boolean" }).notNull(),
  },
  (table) => [
    uniqueIndex("pricing_rules_venue_day_hour_unique").on(
      table.venueId,
      table.dayType,
      table.hour
    ),
    check(
      "pricing_rules_hour_check",
      sql`${table.hour} >= 0 AND ${table.hour} <= 23`
    ),
    check(
      "pricing_rules_price_check",
      sql`${table.price} > 0 AND ${table.strikePrice} >= ${table.price}`
    ),
  ]
);

/**
 * Temporary slot holds ("kunci slot", PRD Fase 2). A hold mirrors the ~10
 * minute window while the visitor completes checkout on the official AYO
 * channel. It is advisory local state only:
 * - no booking/payment records are stored here (PRD §6);
 * - AYO remains the source of truth for bookings and payments.
 */
export const slotHolds = sqliteTable(
  "slot_holds",
  {
    id: text("id").primaryKey(),
    /** Human-friendly reference shared with CS / shown in the UI. */
    reference: text("reference").notNull(),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    courtId: text("court_id")
      .notNull()
      .references(() => courts.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    startHour: integer("start_hour").notNull(),
    durationHours: integer("duration_hours").notNull().default(1),
    /** Where the booking handoff is happening. */
    channel: text("channel", { enum: ["ayo", "whatsapp"] })
      .notNull()
      .default("ayo"),
    status: text("status", {
      enum: ["active", "released", "expired", "completed"],
    })
      .notNull()
      .default("active"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    releasedAt: integer("released_at", { mode: "timestamp_ms" }),
  },
  (table) => [
    uniqueIndex("slot_holds_reference_unique").on(table.reference),
    index("slot_holds_court_date_idx").on(
      table.courtId,
      table.date,
      table.startHour
    ),
    index("slot_holds_expires_idx").on(table.expiresAt),
    check(
      "slot_holds_start_hour_check",
      sql`${table.startHour} >= 0 AND ${table.startHour} <= 23`
    ),
    check(
      "slot_holds_duration_check",
      sql`${table.durationHours} >= 1 AND ${table.durationHours} <= 3`
    ),
  ]
);

/**
 * Guest orders ("pesanan tamu tanpa akun", PRD Fase 2). One row per booking
 * handoff started from the landing page — links to its temporary slot hold
 * and optionally records the guest's contact details for confirmation help.
 *
 * PRD compliance: no payment credentials, no payment status and no booking
 * transaction are stored — AYO completes the booking and payment.
 */
export const guestOrders = sqliteTable(
  "guest_orders",
  {
    id: text("id").primaryKey(),
    /** Same reference as the linked slot hold (shown to the guest / CS). */
    reference: text("reference").notNull(),
    holdId: text("hold_id")
      .notNull()
      .references(() => slotHolds.id, { onDelete: "cascade" }),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    courtId: text("court_id")
      .notNull()
      .references(() => courts.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    startHour: integer("start_hour").notNull(),
    durationHours: integer("duration_hours").notNull().default(1),
    /** Booking handoff channel chosen by the guest. */
    channel: text("channel", { enum: ["ayo", "whatsapp"] })
      .notNull()
      .default("ayo"),
    /** Informational only — processed on AYO / at the venue. */
    paymentMethod: text("payment_method", {
      enum: ["qris", "va", "ewallet", "card", "installment"],
    }),
    guestName: text("guest_name"),
    guestWhatsapp: text("guest_whatsapp"),
    guestEmail: text("guest_email"),
    status: text("status", {
      enum: ["created", "handed_off", "cancelled"],
    })
      .notNull()
      .default("created"),
    /** Last time booking proof was (re)sent — drives the resend cooldown. */
    lastNotifiedAt: integer("last_notified_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("guest_orders_reference_unique").on(table.reference),
    uniqueIndex("guest_orders_hold_unique").on(table.holdId),
    index("guest_orders_court_date_idx").on(table.courtId, table.date),
    check(
      "guest_orders_start_hour_check",
      sql`${table.startHour} >= 0 AND ${table.startHour} <= 23`
    ),
    check(
      "guest_orders_duration_check",
      sql`${table.durationHours} >= 1 AND ${table.durationHours} <= 3`
    ),
  ]
);

/**
 * Coaching programmes (PRD §6 `coaching_programs`): private, multi-session,
 * junior class and free trial. Bilingual content; price tiers live in
 * `coaching_program_tiers` and highlights are stored as a JSON array of
 * `{ id, en }` pairs (display-only content).
 */
export const coachingPrograms = sqliteTable(
  "coaching_programs",
  {
    id: text("id").primaryKey(),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    kind: text("kind", {
      enum: ["private", "multi_session", "junior", "free_trial"],
    }).notNull(),
    titleId: text("title_id").notNull(),
    titleEn: text("title_en").notNull(),
    descriptionId: text("description_id").notNull(),
    descriptionEn: text("description_en").notNull(),
    /** JSON array of { id, en } highlight strings. */
    highlights: text("highlights"),
    priceNoteId: text("price_note_id"),
    priceNoteEn: text("price_note_en"),
    /** Where registration happens. */
    ctaKind: text("cta_kind", { enum: ["form", "whatsapp", "ayo"] })
      .notNull()
      .default("whatsapp"),
    /** Outbound registration link (e.g. the free-trial Google Form). */
    registrationUrl: text("registration_url"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("coaching_programs_venue_idx").on(table.venueId, table.sortOrder),
    check(
      "coaching_programs_kind_check",
      sql`${table.kind} IN ('private', 'multi_session', 'junior', 'free_trial')`
    ),
  ]
);

/** Price tiers per programme (e.g. weekday/weekend multi-session rates). */
export const coachingProgramTiers = sqliteTable(
  "coaching_program_tiers",
  {
    id: text("id").primaryKey(), // `${programId}:${sortOrder}`
    programId: text("program_id")
      .notNull()
      .references(() => coachingPrograms.id, { onDelete: "cascade" }),
    labelId: text("label_id").notNull(),
    labelEn: text("label_en").notNull(),
    /** Price in IDR; null when the tier is priced on request. */
    priceIdr: integer("price_idr"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (table) => [
    uniqueIndex("coaching_program_tiers_program_order_unique").on(
      table.programId,
      table.sortOrder
    ),
    check(
      "coaching_program_tiers_price_check",
      sql`${table.priceIdr} IS NULL OR ${table.priceIdr} > 0`
    ),
  ]
);

/**
 * Events (PRD §6 `events`): tournaments, social days and community classes.
 * `starts_at` is null for archive entries whose exact date is unknown — the
 * period label carries the announced window (getpadel-information.md §14).
 */
export const events = sqliteTable(
  "events",
  {
    id: text("id").primaryKey(),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    kind: text("kind", {
      enum: ["tournament", "social", "class", "community"],
    }).notNull(),
    titleId: text("title_id").notNull(),
    titleEn: text("title_en").notNull(),
    descriptionId: text("description_id").notNull(),
    descriptionEn: text("description_en").notNull(),
    /** Human period label, e.g. "Agustus 2026" / "29 Jun – 4 Jul 2026". */
    periodId: text("period_id").notNull(),
    periodEn: text("period_en").notNull(),
    /** Exact start datetime when announced (drives countdown/upcoming). */
    startsAt: integer("starts_at", { mode: "timestamp_ms" }),
    endsAt: integer("ends_at", { mode: "timestamp_ms" }),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("events_venue_idx").on(table.venueId, table.sortOrder),
    index("events_starts_idx").on(table.startsAt),
    check(
      "events_kind_check",
      sql`${table.kind} IN ('tournament', 'social', 'class', 'community')`
    ),
    check(
      "events_period_check",
      sql`${table.endsAt} IS NULL OR ${table.startsAt} IS NULL OR ${table.startsAt} <= ${table.endsAt}`
    ),
  ]
);

/**
 * Programme registrations (free trial / junior class): guest sign-ups captured
 * on the landing page. Contact details only — no payment data (PRD §6), the
 * venue follows up via WhatsApp.
 */
export const programRegistrations = sqliteTable(
  "program_registrations",
  {
    id: text("id").primaryKey(),
    /** Human-friendly reference shared with CS (e.g. "REG-…"). */
    reference: text("reference").notNull(),
    programId: text("program_id")
      .notNull()
      .references(() => coachingPrograms.id, { onDelete: "cascade" }),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    whatsapp: text("whatsapp").notNull(),
    email: text("email"),
    /** Free-text preferred schedule (e.g. "Sabtu pagi"). */
    preferredSchedule: text("preferred_schedule"),
    notes: text("notes"),
    status: text("status", {
      enum: ["new", "contacted", "confirmed", "cancelled"],
    })
      .notNull()
      .default("new"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("program_registrations_reference_unique").on(table.reference),
    index("program_registrations_program_idx").on(
      table.programId,
      table.createdAt
    ),
  ]
);

/**
 * Open match sessions (PRD §6 `open_matches`): joinable community matches with
 * live remaining spots. The venue keeps `spots_left` current; the API exposes
 * it as the real-time availability figure.
 */
export const openMatches = sqliteTable(
  "open_matches",
  {
    id: text("id").primaryKey(),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    /** Session day label, e.g. "Sabtu, 26 Sep 2026". */
    dayLabelId: text("day_label_id").notNull(),
    dayLabelEn: text("day_label_en").notNull(),
    /** Session hours, e.g. "19.00–21.00". */
    timeLabel: text("time_label").notNull(),
    levelId: text("level_id").notNull(),
    levelEn: text("level_en").notNull(),
    courtNoteId: text("court_note_id").notNull(),
    courtNoteEn: text("court_note_en").notNull(),
    spotsTotal: integer("spots_total").notNull(),
    spotsLeft: integer("spots_left").notNull(),
    /** Session start (venue time). Null until the venue announces it. */
    startsAt: integer("starts_at", { mode: "timestamp_ms" }),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("open_matches_venue_idx").on(table.venueId, table.sortOrder),
    check("open_matches_spots_total_check", sql`${table.spotsTotal} > 0`),
    check(
      "open_matches_spots_left_check",
      sql`${table.spotsLeft} >= 0 AND ${table.spotsLeft} <= ${table.spotsTotal}`
    ),
  ]
);

/**
 * FAQ entries (PRD Fase 3: Bantuan): bilingual question/answer pairs shown on
 * the Location and Help pages. Content is composed from venue facts
 * (getpadel-information.md §7–§9, §11).
 */
export const faqs = sqliteTable(
  "faqs",
  {
    id: text("id").primaryKey(),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    questionId: text("question_id").notNull(),
    questionEn: text("question_en").notNull(),
    answerId: text("answer_id").notNull(),
    answerEn: text("answer_en").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [index("faqs_venue_idx").on(table.venueId, table.sortOrder)]
);

/**
 * Testimonials (PRD §6 / Fase 4): visitor reviews from Google Maps and
 * Ayo.co.id with bilingual quotes. Content source: getpadel-information.md §10.
 */
export const testimonials = sqliteTable(
  "testimonials",
  {
    id: text("id").primaryKey(),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    author: text("author").notNull(),
    source: text("source", { enum: ["google", "ayo"] }).notNull(),
    rating: integer("rating").notNull(),
    /** Human period label, e.g. "5 bulan lalu" / "26 Jul 2026". */
    periodId: text("period_id").notNull(),
    periodEn: text("period_en").notNull(),
    quoteId: text("quote_id").notNull(),
    quoteEn: text("quote_en").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("testimonials_venue_idx").on(table.venueId, table.sortOrder),
    check(
      "testimonials_rating_check",
      sql`${table.rating} >= 1 AND ${table.rating} <= 5`
    ),
  ]
);

/** Gallery photos (PRD Fase 4 "Galeri Foto"): ordered venue imagery. */
export const galleryPhotos = sqliteTable(
  "gallery_photos",
  {
    id: text("id").primaryKey(),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    /** Local path or remote URL. */
    src: text("src").notNull(),
    altId: text("alt_id").notNull(),
    altEn: text("alt_en").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("gallery_photos_venue_idx").on(table.venueId, table.sortOrder),
  ]
);

/**
 * Blog posts (PRD §6 `blog_posts`): bilingual title/excerpt/tag plus a body
 * stored as a JSON array of paragraphs per locale.
 */
export const blogPosts = sqliteTable(
  "blog_posts",
  {
    id: text("id").primaryKey(),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    titleId: text("title_id").notNull(),
    titleEn: text("title_en").notNull(),
    excerptId: text("excerpt_id").notNull(),
    excerptEn: text("excerpt_en").notNull(),
    /** JSON arrays of paragraphs, e.g. ["Paragraph one", "Paragraph two"]. */
    bodyId: text("body_id").notNull(),
    bodyEn: text("body_en").notNull(),
    tagId: text("tag_id").notNull(),
    tagEn: text("tag_en").notNull(),
    coverUrl: text("cover_url"),
    readMinutes: integer("read_minutes").notNull().default(2),
    /** Publication date (drives the "latest posts" ordering). */
    publishedAt: integer("published_at", { mode: "timestamp_ms" }).notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("blog_posts_venue_slug_unique").on(table.venueId, table.slug),
    index("blog_posts_venue_published_idx").on(
      table.venueId,
      table.publishedAt
    ),
    check("blog_posts_read_minutes_check", sql`${table.readMinutes} > 0`),
  ]
);

/**
 * Newsletter subscribers (PRD §6): email capture from the Proof section.
 * Contact data only — unsubscribing flips the status.
 */
export const newsletterSubscribers = sqliteTable(
  "newsletter_subscribers",
  {
    id: text("id").primaryKey(),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    /** Locale the visitor subscribed from ("id" | "en"). */
    locale: text("locale"),
    status: text("status", { enum: ["subscribed", "unsubscribed"] })
      .notNull()
      .default("subscribed"),
    /** Where the sign-up came from, e.g. "proof-section". */
    source: text("source"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("newsletter_subscribers_venue_email_unique").on(
      table.venueId,
      table.email
    ),
    index("newsletter_subscribers_status_idx").on(table.status),
  ]
);

/**
 * First-party analytics click events (PRD §2.4): records outbound CTA clicks
 * (AYO booking, WhatsApp, forms, email, socials) served from the landing page.
 * No personal data is stored — only the click context.
 */
export const analyticsEvents = sqliteTable(
  "analytics_events",
  {
    id: text("id").primaryKey(),
    /** Event name, e.g. "whatsapp_click" (see `src/lib/analytics.ts`). */
    name: text("name").notNull(),
    /** Page path where the click happened, e.g. "/id/program". */
    pagePath: text("page_path"),
    /** Target URL of the clicked link. */
    linkUrl: text("link_url"),
    /** Visible link text (truncated). */
    linkText: text("link_text"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("analytics_events_name_idx").on(table.name, table.createdAt),
  ]
);

/**
 * Promos (PRD §6 `promos`): bilingual title/detail, optional code, validity
 * window and provenance. Seed data comes from `src/data/promos.ts` (no codes
 * are invented — Get Padel promos are card/venue based today).
 */
export const promos = sqliteTable(
  "promos",
  {
    id: text("id").primaryKey(),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    titleId: text("title_id").notNull(),
    titleEn: text("title_en").notNull(),
    /** Promo code when one exists (nullable — most promos have none). */
    code: text("code"),
    periodId: text("period_id").notNull(),
    periodEn: text("period_en").notNull(),
    detailId: text("detail_id").notNull(),
    detailEn: text("detail_en").notNull(),
    /** Provenance label, e.g. "Bank Mandiri × Get Padel". */
    source: text("source"),
    /** Outbound link (registration form / info page). */
    linkUrl: text("link_url"),
    /** Copyable reference when there is no link (e.g. "bmri.id/getpadel"). */
    reference: text("reference"),
    /** Poster asset path, e.g. "/promos/mandiri.webp". */
    posterUrl: text("poster_url"),
    /** Structured validity window (YYYY-MM-DD); null = open ended. */
    startsOn: text("starts_on"),
    endsOn: text("ends_on"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("promos_venue_code_unique").on(table.venueId, table.code),
    index("promos_active_order_idx").on(table.isActive, table.sortOrder),
    check(
      "promos_period_check",
      sql`${table.startsOn} IS NULL OR ${table.endsOn} IS NULL OR ${table.startsOn} <= ${table.endsOn}`
    ),
  ]
);

/* ============================================================
   Accounts & bookings
   ------------------------------------------------------------
   Added for the visitor-facing login + "My Booking" flow and the
   Midtrans payment integration. Slot double-booking is prevented at the
   database level: at most one live booking (pending_payment | paid) may
   exist per court/date/hour (partial unique index below).
   ============================================================ */

/** Registered visitor. Passwords are stored as scrypt hashes. */
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    whatsapp: text("whatsapp"),
    passwordHash: text("password_hash").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("users_email_unique").on(table.email)]
);

/** Login sessions (httpOnly cookie → row in this table). */
export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    index("sessions_user_idx").on(table.userId),
    index("sessions_expires_idx").on(table.expiresAt),
  ]
);

/**
 * Court booking with its Midtrans payment state. `status` is the booking
 * lifecycle; `payment_status` mirrors the gateway's transaction status so the
 * UI and the My Booking page can show both clearly.
 */
export const bookings = sqliteTable(
  "bookings",
  {
    id: text("id").primaryKey(),
    reference: text("reference").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    courtId: text("court_id")
      .notNull()
      .references(() => courts.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    startHour: integer("start_hour").notNull(),
    durationHours: integer("duration_hours").notNull().default(1),
    amountIdr: integer("amount_idr").notNull(),
    status: text("status", {
      enum: ["pending_payment", "paid", "expired", "failed", "cancelled"],
    })
      .notNull()
      .default("pending_payment"),
    paymentStatus: text("payment_status", {
      enum: [
        "pending",
        "settlement",
        "capture",
        "deny",
        "cancel",
        "expire",
        "failure",
        "refund",
      ],
    })
      .notNull()
      .default("pending"),
    provider: text("provider").notNull().default("midtrans"),
    /** Order id sent to the gateway (also the reference we receive back). */
    providerOrderId: text("provider_order_id").notNull(),
    snapToken: text("snap_token"),
    snapRedirectUrl: text("snap_redirect_url"),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    paidAt: integer("paid_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("bookings_reference_unique").on(table.reference),
    uniqueIndex("bookings_provider_order_unique").on(table.providerOrderId),
    // Double-booking guard: one live booking per court/date/hour.
    uniqueIndex("bookings_slot_unique")
      .on(table.courtId, table.date, table.startHour)
      .where(sql`${table.status} in ('pending_payment','paid')`),
    index("bookings_user_idx").on(table.userId, table.createdAt),
  ]
);

/** Raw gateway notifications, kept for auditing and idempotency. */
export const payments = sqliteTable(
  "payments",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("midtrans"),
    providerOrderId: text("provider_order_id").notNull(),
    transactionId: text("transaction_id"),
    transactionStatus: text("transaction_status").notNull(),
    fraudStatus: text("fraud_status"),
    grossAmount: integer("gross_amount"),
    payload: text("payload"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    index("payments_booking_idx").on(table.bookingId),
    index("payments_order_idx").on(table.providerOrderId),
  ]
);

export type Venue = typeof venues.$inferSelect;
export type Court = typeof courts.$inferSelect;
export type Facility = typeof facilities.$inferSelect;
export type CoachingProgram = typeof coachingPrograms.$inferSelect;
export type CoachingProgramTier = typeof coachingProgramTiers.$inferSelect;
export type ProgramRegistration = typeof programRegistrations.$inferSelect;
export type VenueEvent = typeof events.$inferSelect;
export type OpenMatch = typeof openMatches.$inferSelect;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type TestimonialRow = typeof testimonials.$inferSelect;
export type GalleryPhoto = typeof galleryPhotos.$inferSelect;
export type BlogPostRow = typeof blogPosts.$inferSelect;
export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;
export type ScheduleSlot = typeof scheduleSlots.$inferSelect;
export type PricingRule = typeof pricingRules.$inferSelect;
export type SlotHold = typeof slotHolds.$inferSelect;
export type GuestOrder = typeof guestOrders.$inferSelect;
export type Promo = typeof promos.$inferSelect;
export type User = typeof users.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Payment = typeof payments.$inferSelect;
