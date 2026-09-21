/**
 * Promo query service (PRD Fase 2): the running promos plus expiry filtering
 * driven by the structured validity window (`starts_on` / `ends_on`).
 */
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Locale } from "@/i18n/routing";

export interface PromoValidity {
  isActive: boolean;
  startsOn: string | null;
  endsOn: string | null;
}

export interface LocalizedPromo {
  id: string;
  title: string;
  period: string;
  detail: string;
  code: string | null;
  source: string | null;
  linkUrl: string | null;
  reference: string | null;
  posterUrl: string | null;
  startsOn: string | null;
  endsOn: string | null;
  /** isActive flag AND inside the validity window for the given date. */
  active: boolean;
}

/** Inclusive validity check for a YYYY-MM-DD date. */
export function isPromoActive(
  promo: PromoValidity,
  dateISO: string
): boolean {
  if (!promo.isActive) return false;
  if (promo.startsOn && promo.startsOn > dateISO) return false;
  if (promo.endsOn && promo.endsOn < dateISO) return false;
  return true;
}

function pick(locale: Locale, id: string, en: string): string {
  return locale === "en" ? en : id;
}

export async function listPromos(options: {
  includeExpired?: boolean;
  dateISO?: string;
  locale?: Locale;
} = {}): Promise<LocalizedPromo[]> {
  const { includeExpired = false, locale = "id" } = options;
  const dateISO = options.dateISO ?? new Date().toISOString().slice(0, 10);

  const rows = await db
    .select()
    .from(schema.promos)
    .orderBy(asc(schema.promos.sortOrder), asc(schema.promos.id));

  return rows
    .map((row) => ({
      id: row.id,
      title: pick(locale, row.titleId, row.titleEn),
      period: pick(locale, row.periodId, row.periodEn),
      detail: pick(locale, row.detailId, row.detailEn),
      code: row.code,
      source: row.source,
      linkUrl: row.linkUrl,
      reference: row.reference,
      posterUrl: row.posterUrl,
      startsOn: row.startsOn,
      endsOn: row.endsOn,
      active: isPromoActive(row, dateISO),
    }))
    .filter((promo) => includeExpired || promo.active)
    .sort((a, b) => Number(b.active) - Number(a.active));
}
