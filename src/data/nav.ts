/**
 * Header navigation model. `route` items are real pages (`/{locale}{route}`);
 * `hash` items point to sections on the homepage (`/{locale}#{hash}`).
 * Booking is NOT part of the website: all booking CTAs lead to AYO.
 */
export interface NavItem {
  /** Translation key under the `nav.*` namespace. */
  key: "home" | "about" | "schedule" | "services" | "events" | "raceRally" | "contact";
  /** Full in-app route (without the locale prefix). */
  route?: string;
  /** In-page section id on the homepage. */
  hash?: string;
}

/**
 * Desktop nav entries (Help stays in the fullscreen menu + footer; Contact is
 * reachable from the footer, which owns the #kontak anchor).
 */
export const navItems: NavItem[] = [
  { key: "home" },
  { key: "about", route: "/about" },
  { key: "schedule", route: "/schedule" },
  { key: "services", route: "/harga" },
  { key: "events", route: "/program" },
  { key: "raceRally", route: "/racerallycoffee" },
];
