import type en from "./messages/en.json";

declare module "next-intl" {
  interface AppConfig {
    /** Supported locales — single source of truth: src/i18n/routing.ts */
    Locale: "id" | "en";
    /** Message keys are type-checked against the English catalogue. */
    Messages: typeof en;
  }
}
