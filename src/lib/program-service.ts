/**
 * Coaching programme service (PRD §6 `coaching_programs` + tiers): lists
 * programmes with resolved bilingual content for the API and the UI.
 */
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { pick, type Localized } from "@/data/localized";

export type ProgramKind =
  | "private"
  | "multi_session"
  | "junior"
  | "free_trial";

export const PROGRAM_KINDS: readonly ProgramKind[] = [
  "private",
  "multi_session",
  "junior",
  "free_trial",
];

export interface CoachingProgramDto {
  id: string;
  kind: ProgramKind;
  title: string;
  description: string;
  highlights: string[];
  priceNote: string | null;
  ctaKind: "form" | "whatsapp" | "ayo";
  registrationUrl: string | null;
  tiers: { label: string; priceIdr: number | null }[];
}

/** Parses the stored `highlights` JSON into localized strings (pure). */
export function parseHighlights(
  json: string | null,
  locale: string
): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is Localized =>
          typeof item === "object" &&
          item !== null &&
          typeof (item as Localized).id === "string" &&
          typeof (item as Localized).en === "string"
      )
      .map((item) => pick(locale, item));
  } catch {
    return [];
  }
}

export interface ListProgramsOptions {
  locale: string;
  kind?: ProgramKind;
}

/** Lists active coaching programmes, optionally filtered by kind. */
export async function listCoachingPrograms(
  options: ListProgramsOptions
): Promise<CoachingProgramDto[]> {
  const programRows = await db
    .select()
    .from(schema.coachingPrograms)
    .where(
      options.kind
        ? eq(schema.coachingPrograms.kind, options.kind)
        : undefined
    )
    .orderBy(asc(schema.coachingPrograms.sortOrder));

  const tierRows = await db
    .select()
    .from(schema.coachingProgramTiers)
    .orderBy(asc(schema.coachingProgramTiers.sortOrder));

  const tiersByProgram = new Map<string, typeof tierRows>();
  for (const tier of tierRows) {
    const list = tiersByProgram.get(tier.programId) ?? [];
    list.push(tier);
    tiersByProgram.set(tier.programId, list);
  }

  return programRows
    .filter((program) => program.isActive)
    .map((program) => ({
      id: program.id,
      kind: program.kind as ProgramKind,
      title: pick(options.locale, {
        id: program.titleId,
        en: program.titleEn,
      }),
      description: pick(options.locale, {
        id: program.descriptionId,
        en: program.descriptionEn,
      }),
      highlights: parseHighlights(program.highlights, options.locale),
      priceNote:
        program.priceNoteId && program.priceNoteEn
          ? pick(options.locale, {
              id: program.priceNoteId,
              en: program.priceNoteEn,
            })
          : null,
      ctaKind: program.ctaKind as CoachingProgramDto["ctaKind"],
      registrationUrl: program.registrationUrl,
      tiers: (tiersByProgram.get(program.id) ?? []).map((tier) => ({
        label: pick(options.locale, {
          id: tier.labelId,
          en: tier.labelEn,
        }),
        priceIdr: tier.priceIdr,
      })),
    }));
}
