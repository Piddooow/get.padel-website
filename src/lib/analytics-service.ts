/**
 * First-party analytics service (PRD §2.4): records outbound CTA click events
 * (AYO booking, WhatsApp, forms, email, socials). No personal data — only the
 * click context from the landing page.
 */
import { randomUUID } from "node:crypto";
import { db, schema } from "@/db";
import {
  ANALYTICS_EVENTS,
  type AnalyticsEvent,
} from "@/lib/analytics";

export interface AnalyticsEventInput {
  name: AnalyticsEvent;
  pagePath: string | null;
  linkUrl: string | null;
  linkText: string | null;
}

export type AnalyticsValidation =
  | { ok: true; data: AnalyticsEventInput }
  | { ok: false; error: string };

const ALLOWED_NAMES = new Set<string>(Object.values(ANALYTICS_EVENTS));

function trimmed(
  value: unknown,
  maxLength: number
): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  return text.slice(0, maxLength);
}

/** Validates and normalizes an analytics click payload (pure). */
export function validateAnalyticsEvent(body: unknown): AnalyticsValidation {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object." };
  }
  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!ALLOWED_NAMES.has(name)) {
    return {
      ok: false,
      error: `\`name\` must be one of: ${[...ALLOWED_NAMES].join(", ")}.`,
    };
  }

  return {
    ok: true,
    data: {
      name: name as AnalyticsEvent,
      pagePath: trimmed(input.pagePath, 200),
      linkUrl: trimmed(input.linkUrl, 500),
      linkText: trimmed(input.linkText, 120),
    },
  };
}

/** Persists one analytics click event. */
export async function recordAnalyticsEvent(
  input: AnalyticsEventInput
): Promise<void> {
  await db.insert(schema.analyticsEvents).values({
    id: randomUUID(),
    name: input.name,
    pagePath: input.pagePath,
    linkUrl: input.linkUrl,
    linkText: input.linkText,
    createdAt: new Date(),
  });
}
