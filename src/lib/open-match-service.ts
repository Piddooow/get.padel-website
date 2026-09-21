/**
 * Open match service (PRD §6 `open_matches`): joinable community sessions with
 * live remaining spots. `spots_left` is venue-maintained; the API surfaces it
 * as the real-time availability figure.
 */
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { pick } from "@/data/localized";

export type SpotsStatus = "open" | "almost_full" | "full";

/** Remaining-spot state: ≤2 left is "almost full", 0 is "full". */
export function deriveSpotsStatus(spotsLeft: number, spotsTotal: number): SpotsStatus {
  if (spotsLeft <= 0) return "full";
  if (spotsLeft <= Math.min(2, Math.floor(spotsTotal / 2))) return "almost_full";
  return "open";
}

export interface OpenMatchDto {
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

export interface ListOpenMatchesOptions {
  locale: string;
}

/** Lists active open match sessions with real-time spot counts. */
export async function listOpenMatches(
  options: ListOpenMatchesOptions
): Promise<OpenMatchDto[]> {
  const rows = await db
    .select()
    .from(schema.openMatches)
    .orderBy(asc(schema.openMatches.sortOrder));

  return rows
    .filter((match) => match.isActive)
    // Never surface a session whose start time has already passed.
    .filter(
      (match) => !match.startsAt || match.startsAt.getTime() > Date.now()
    )
    .map((match) => ({
      id: match.id,
      day: pick(options.locale, {
        id: match.dayLabelId,
        en: match.dayLabelEn,
      }),
      time: match.timeLabel,
      level: pick(options.locale, { id: match.levelId, en: match.levelEn }),
      courtNote: pick(options.locale, {
        id: match.courtNoteId,
        en: match.courtNoteEn,
      }),
      spotsTotal: match.spotsTotal,
      spotsLeft: match.spotsLeft,
      status: deriveSpotsStatus(match.spotsLeft, match.spotsTotal),
      startsAt: match.startsAt ? match.startsAt.toISOString() : null,
    }));
}
