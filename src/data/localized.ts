/**
 * Bilingual content helper shared by data modules and UI components.
 * Indonesian is the default locale (PRD §1).
 */
export interface Localized {
  id: string;
  en: string;
}

export function pick(locale: string, value: Localized): string {
  return locale === "en" ? value.en : value.id;
}
