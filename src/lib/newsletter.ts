/** Newsletter helpers (PRD Fase 4): client-side validation + normalization. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Whether the value looks like a deliverable email address. */
export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/** Normalizes an email for submission (trim + lowercase). */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}
