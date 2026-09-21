const idrFormatter = new Intl.NumberFormat("id-ID");

/** Format a number as Indonesian rupiah, e.g. 150000 → "Rp150.000". */
export function formatIDR(value: number): string {
  return `Rp${idrFormatter.format(value)}`;
}

/** Whole-percent discount from a strike (regular) price, e.g. 225000→150000 = 33. */
export function discountPercent(price: number, strike: number): number {
  if (strike <= 0 || price >= strike) return 0;
  return Math.round((1 - price / strike) * 100);
}

/** Discount (%) from which a slot is highlighted as a special price. */
export const SPECIAL_PRICE_MIN_DISCOUNT = 30;

/** Promo slots with the deepest discount get the yellow "special" treatment. */
export function isSpecialPrice(price: number, strike: number): boolean {
  return discountPercent(price, strike) >= SPECIAL_PRICE_MIN_DISCOUNT;
}

/** Hour in local convention: "06.00" (id) or "06:00" (en). */
export function formatHour(locale: string, hour: number): string {
  const hh = String(hour).padStart(2, "0");
  return locale === "en" ? `${hh}:00` : `${hh}.00`;
}

/** Hourly range label, e.g. "06.00–07.00" (id) / "06:00–07:00" (en). */
export function formatHourRange(
  locale: string,
  startHour: number,
  endHour: number
): string {
  return `${formatHour(locale, startHour)}–${formatHour(locale, endHour)}`;
}

/**
 * Parse an Indonesian rupiah string ("Rp2.625.000/pax") → 2625000.
 * For ranges ("Rp150.000 – Rp260.000") the first amount is returned.
 */
export function parseIDR(value: string): number | null {
  const match = value.match(/\d[\d.]*/);
  if (!match) return null;
  const digits = match[0].replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}
