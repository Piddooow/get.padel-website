/**
 * Navigation helpers shared by server and client components.
 */

/** Only same-site paths are accepted as a redirect destination. */
export function safeNextPath(value: string | null, fallback: string): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value;
}
