/**
 * Venue list service (PRD §6 `venues`): venue summaries with court specs and
 * facility counts for the locations listing, plus an optional city filter.
 */
import { asc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";

export interface VenueSummaryDto {
  id: string;
  name: string;
  tagline: string;
  address: {
    street: string;
    district: string;
    city: string;
    plusCode: string;
    coordinates: { lat: number; lng: number };
  };
  hours: {
    courtsOpenHour: number;
    courtsCloseHour: number;
    cafeOpenHour: number;
    cafeCloseHour: number;
    sessionMinutes: number;
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
    emailEvent: string | null;
    emailCommercial: string | null;
    instagramUrl: string | null;
    tiktokUrl: string | null;
    cafeInstagramUrl: string | null;
  };
  links: {
    booking: string;
    maps: string | null;
    linktree: string | null;
  };
  courts: {
    id: string;
    name: string;
    indoor: boolean;
    surface: string;
    sessionMinutes: number;
  }[];
  facilities: { total: number; official: number };
  /** Areas the venue explicitly serves (PRD §1: Jakarta Timur–Bekasi border). */
  servedAreas: string[];
}

/**
 * Areas the venue explicitly serves — sourced from PRD §1 ("perbatasan
 * Jakarta Timur–Bekasi, di dalam perumahan Billy & Moon").
 */
export const SERVED_AREAS: readonly string[] = ["Jakarta Timur", "Bekasi"];

export interface FacilityDto {
  id: string;
  titleId: string;
  titleEn: string;
  detailId: string | null;
  detailEn: string | null;
  icon: string;
  official: boolean;
  sortOrder: number;
}

export interface VenueDetailDto extends Omit<VenueSummaryDto, "facilities"> {
  facilities: FacilityDto[];
  facilityCounts: { total: number; official: number };
}

export interface CityFilterable {
  addressStreet: string;
  addressDistrict: string;
  addressCity: string;
}

export function normalizeCity(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * Whether a venue matches a city query — checks the address parts and the
 * served areas (case-insensitive, substring match). Empty query matches all.
 */
export function venueMatchesCity(venue: CityFilterable, city: string): boolean {
  const needle = normalizeCity(city);
  if (!needle) return true;
  const haystack = [
    venue.addressStreet,
    venue.addressDistrict,
    venue.addressCity,
    ...SERVED_AREAS,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export interface ListVenuesOptions {
  /** City/area filter (e.g. "Jakarta Timur", "Bekasi"). */
  city?: string;
}

/** Lists venue summaries, optionally filtered by city/area. */
export async function listVenues(
  options: ListVenuesOptions = {}
): Promise<VenueSummaryDto[]> {
  const venueRows = await db
    .select()
    .from(schema.venues)
    .orderBy(asc(schema.venues.id));

  const courtRows = await db
    .select()
    .from(schema.courts)
    .orderBy(asc(schema.courts.sortOrder));

  const facilityRows = await db
    .select({
      venueId: schema.facilities.venueId,
      total: sql<number>`count(*)`,
      official: sql<number>`sum(case when ${schema.facilities.official} = 1 then 1 else 0 end)`,
    })
    .from(schema.facilities)
    .groupBy(schema.facilities.venueId);

  const facilitiesByVenue = new Map(
    facilityRows.map((row) => [
      row.venueId,
      { total: Number(row.total), official: Number(row.official) },
    ])
  );
  const courtsByVenue = new Map<string, typeof courtRows>();
  for (const court of courtRows) {
    const list = courtsByVenue.get(court.venueId) ?? [];
    list.push(court);
    courtsByVenue.set(court.venueId, list);
  }

  return venueRows
    .filter((venue) => venueMatchesCity(venue, options.city ?? ""))
    .map((venue) => toSummary(venue, courtsByVenue, facilitiesByVenue));
}

type VenueRow = typeof schema.venues.$inferSelect;
type CourtRows = (typeof schema.courts.$inferSelect)[];

function toSummary(
  venue: VenueRow,
  courtsByVenue: Map<string, CourtRows>,
  facilitiesByVenue: Map<string, { total: number; official: number }>
): VenueSummaryDto {
  return {
    id: venue.id,
    name: venue.name,
    tagline: venue.tagline,
    address: {
      street: venue.addressStreet,
      district: venue.addressDistrict,
      city: venue.addressCity,
      plusCode: venue.plusCode,
      coordinates: { lat: venue.latitude, lng: venue.longitude },
    },
    hours: {
      courtsOpenHour: venue.courtOpenHour,
      courtsCloseHour: venue.courtCloseHour,
      cafeOpenHour: venue.cafeOpenHour,
      cafeCloseHour: venue.cafeCloseHour,
      sessionMinutes: venue.sessionMinutes,
    },
    ratings: {
      google: { score: venue.ratingGoogle, count: venue.ratingGoogleCount },
      ayo: { score: venue.ratingAyo, count: venue.ratingAyoCount },
      sub: {
        cleanliness: venue.ratingCleanliness,
        courtCondition: venue.ratingCourtCondition,
        communication: venue.ratingCommunication,
      },
    },
    contact: {
      whatsapp: venue.whatsapp,
      emailEvent: venue.emailEvent,
      emailCommercial: venue.emailCommercial,
      instagramUrl: venue.instagramUrl,
      tiktokUrl: venue.tiktokUrl,
      cafeInstagramUrl: venue.cafeInstagramUrl,
    },
    links: {
      booking: venue.bookingUrl,
      maps: venue.mapsUrl,
      linktree: venue.linktreeUrl,
    },
    courts: (courtsByVenue.get(venue.id) ?? []).map((court) => ({
      id: court.id,
      name: court.name,
      indoor: court.indoor,
      surface: court.surface,
      sessionMinutes: court.sessionMinutes,
    })),
    facilities: facilitiesByVenue.get(venue.id) ?? { total: 0, official: 0 },
    servedAreas: [...SERVED_AREAS],
  };
}

/** Venue detail incl. court specs and the full ordered facility list. */
export async function getVenueDetail(
  venueId: string
): Promise<VenueDetailDto | null> {
  const [venue] = await db
    .select()
    .from(schema.venues)
    .where(eq(schema.venues.id, venueId));
  if (!venue) return null;

  const courtRows = await db
    .select()
    .from(schema.courts)
    .where(eq(schema.courts.venueId, venueId))
    .orderBy(asc(schema.courts.sortOrder));

  const facilityRows = await db
    .select()
    .from(schema.facilities)
    .where(eq(schema.facilities.venueId, venueId))
    .orderBy(asc(schema.facilities.sortOrder));

  const facilities: FacilityDto[] = facilityRows.map((facility) => ({
    id: facility.id,
    titleId: facility.titleId,
    titleEn: facility.titleEn,
    detailId: facility.detailId,
    detailEn: facility.detailEn,
    icon: facility.icon,
    official: facility.official,
    sortOrder: facility.sortOrder,
  }));

  const officialCount = facilities.filter((facility) => facility.official)
    .length;
  const summary = toSummary(
    venue,
    new Map([[venueId, courtRows]]),
    new Map([[venueId, { total: facilities.length, official: officialCount }]])
  );

  return {
    ...summary,
    facilities,
    facilityCounts: { total: facilities.length, official: officialCount },
  };
}
