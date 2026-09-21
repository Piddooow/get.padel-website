/**
 * Site configuration service (PRD §6 `venues`): contact details, service
 * hours and WhatsApp settings served to the Help/Contact UI.
 */
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";

/** Formats a numeric WhatsApp number for display: 6281… → "0811 8802 2770". */
export function formatWhatsappDisplay(number: string): string {
  const digits = number.replace(/\D/g, "");
  const local = digits.startsWith("62") ? `0${digits.slice(2)}` : digits;
  return local.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export interface SiteConfigDto {
  venue: { id: string; name: string; tagline: string };
  contact: {
    whatsapp: string;
    whatsappDisplay: string;
    emailEvent: string | null;
    emailCommercial: string | null;
    instagramUrl: string | null;
    tiktokUrl: string | null;
    cafeInstagramUrl: string | null;
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
  whatsapp: {
    number: string;
    /** Base wa.me link; append `?text=` to prefill a message. */
    link: string;
  };
  links: {
    booking: string;
    maps: string | null;
    linktree: string | null;
  };
  address: {
    street: string;
    district: string;
    city: string;
    plusCode: string;
    coordinates: { lat: number; lng: number };
  };
}

/** Returns the venue's contact/hours/WhatsApp configuration. */
export async function getSiteConfig(): Promise<SiteConfigDto | null> {
  const [venue] = await db
    .select()
    .from(schema.venues)
    .orderBy(asc(schema.venues.id));

  if (!venue) return null;

  return {
    venue: { id: venue.id, name: venue.name, tagline: venue.tagline },
    contact: {
      whatsapp: venue.whatsapp,
      whatsappDisplay: formatWhatsappDisplay(venue.whatsapp),
      emailEvent: venue.emailEvent,
      emailCommercial: venue.emailCommercial,
      instagramUrl: venue.instagramUrl,
      tiktokUrl: venue.tiktokUrl,
      cafeInstagramUrl: venue.cafeInstagramUrl,
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
    whatsapp: {
      number: venue.whatsapp,
      link: `https://wa.me/${venue.whatsapp}`,
    },
    links: {
      booking: venue.bookingUrl,
      maps: venue.mapsUrl,
      linktree: venue.linktreeUrl,
    },
    address: {
      street: venue.addressStreet,
      district: venue.addressDistrict,
      city: venue.addressCity,
      plusCode: venue.plusCode,
      coordinates: { lat: venue.latitude, lng: venue.longitude },
    },
  };
}
