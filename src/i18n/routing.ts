import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // Supported locales — Indonesian is the default (PRD §1).
  locales: ["id", "en"],
  // Used when no locale matches.
  defaultLocale: "id",
});

export type Locale = (typeof routing.locales)[number];
