/**
 * Header navigation model. `route` items are real pages (`/{locale}{route}`);
 * `hash` items point to sections on the homepage (`/{locale}#{hash}`).
 * Add new entries here as pages are built.
 */
export interface NavItem {
  /** Translation key under the `nav.*` namespace. */
  key: "home" | "schedule" | "pricing" | "location" | "program" | "contact";
  /** Full in-app route (without the locale prefix). */
  route?: string;
  /** In-page section id on the homepage. */
  hash?: string;
}

/**
 * Desktop nav entries. The Help page (`/bantuan`) intentionally lives in the
 * fullscreen menu + footer only — the desktop bar is at capacity from `lg`.
 */
export const navItems: NavItem[] = [
  { key: "home" },
  { key: "schedule", route: "/jadwal" },
  { key: "pricing", route: "/harga" },
  { key: "location", route: "/lokasi" },
  { key: "program", route: "/program" },
  { key: "contact", hash: "kontak" },
];
