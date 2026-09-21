/**
 * Event service (PRD §6 `events`): tournaments, social days and community
 * classes with upcoming/past classification for the API and the UI.
 */
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { pick } from "@/data/localized";

export type EventKind = "tournament" | "social" | "class" | "community";
export type EventStatus = "upcoming" | "past";

export const EVENT_STATUSES: readonly EventStatus[] = ["upcoming", "past"];

export interface VenueEventDto {
  id: string;
  kind: EventKind;
  title: string;
  description: string;
  period: string;
  /** ISO datetime when announced; null for archive entries. */
  startsAt: string | null;
  status: EventStatus;
}

/** Classifies an event by its start time (pure, unit-testable). */
export function classifyEventStatus(
  startsAt: Date | null,
  now: Date
): EventStatus {
  return startsAt && startsAt.getTime() > now.getTime() ? "upcoming" : "past";
}

export interface ListEventsOptions {
  locale: string;
  status?: EventStatus;
}

/** Lists active events, optionally filtered by upcoming/past status. */
export async function listEvents(
  options: ListEventsOptions
): Promise<VenueEventDto[]> {
  const rows = await db
    .select()
    .from(schema.events)
    .orderBy(asc(schema.events.sortOrder));

  const now = new Date();

  return rows
    .filter((event) => event.isActive)
    .map((event) => {
      const startsAt = event.startsAt ?? null;
      return {
        id: event.id,
        kind: event.kind as EventKind,
        title: pick(options.locale, { id: event.titleId, en: event.titleEn }),
        description: pick(options.locale, {
          id: event.descriptionId,
          en: event.descriptionEn,
        }),
        period: pick(options.locale, {
          id: event.periodId,
          en: event.periodEn,
        }),
        startsAt: startsAt ? startsAt.toISOString() : null,
        status: classifyEventStatus(startsAt, now),
      };
    })
    .filter((event) => !options.status || event.status === options.status);
}
