/**
 * Testimonial service (PRD §6 `testimonials` + Fase 4 "Testimoni & Rating"):
 * bilingual visitor reviews plus the aggregated platform ratings (Google,
 * Ayo.co.id and its sub-ratings).
 */
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { pick } from "@/data/localized";

export type TestimonialSourceDto = "google" | "ayo";

export interface TestimonialDto {
  id: string;
  author: string;
  source: TestimonialSourceDto;
  rating: number;
  period: string;
  quote: string;
}

export interface PlatformRatingDto {
  score: number | null;
  count: number | null;
}

export interface TestimonialAggregateDto {
  /** Average rating across the stored testimonials (null when empty). */
  averageRating: number | null;
  count: number;
}

export interface TestimonialsResponseDto {
  aggregate: TestimonialAggregateDto;
  platforms: {
    google: PlatformRatingDto;
    ayo: PlatformRatingDto;
    sub: {
      cleanliness: number | null;
      courtCondition: number | null;
      communication: number | null;
    };
  };
  count: number;
  testimonials: TestimonialDto[];
}

/** Rounded average of a rating list (pure, unit-testable). */
export function averageRating(ratings: number[]): number | null {
  if (ratings.length === 0) return null;
  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  return Math.round((total / ratings.length) * 100) / 100;
}

export interface ListTestimonialsOptions {
  locale: string;
}

/** Active testimonials in display order with aggregated ratings. */
export async function getTestimonials(
  options: ListTestimonialsOptions
): Promise<TestimonialsResponseDto> {
  const [venue] = await db
    .select()
    .from(schema.venues)
    .orderBy(asc(schema.venues.id));

  const rows = await db
    .select()
    .from(schema.testimonials)
    .orderBy(asc(schema.testimonials.sortOrder));

  const testimonials: TestimonialDto[] = rows
    .filter((row) => row.isActive)
    .map((row) => ({
      id: row.id,
      author: row.author,
      source: row.source as TestimonialSourceDto,
      rating: row.rating,
      period: pick(options.locale, { id: row.periodId, en: row.periodEn }),
      quote: pick(options.locale, { id: row.quoteId, en: row.quoteEn }),
    }));

  return {
    aggregate: {
      averageRating: averageRating(
        testimonials.map((testimonial) => testimonial.rating)
      ),
      count: testimonials.length,
    },
    platforms: {
      google: {
        score: venue?.ratingGoogle ?? null,
        count: venue?.ratingGoogleCount ?? null,
      },
      ayo: {
        score: venue?.ratingAyo ?? null,
        count: venue?.ratingAyoCount ?? null,
      },
      sub: {
        cleanliness: venue?.ratingCleanliness ?? null,
        courtCondition: venue?.ratingCourtCondition ?? null,
        communication: venue?.ratingCommunication ?? null,
      },
    },
    count: testimonials.length,
    testimonials,
  };
}
