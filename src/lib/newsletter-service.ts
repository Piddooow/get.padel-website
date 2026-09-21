/**
 * Newsletter service (PRD §6 `newsletter_subscribers`): subscribes an email to
 * the venue newsletter. Contact data only — unsubscribing flips the status.
 */
import { randomUUID } from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { isValidEmail, normalizeEmail } from "@/lib/newsletter";

export type SubscriptionStatus = "subscribed" | "already_subscribed";

export interface NewsletterInput {
  email: string;
  locale: string | null;
  source: string | null;
}

export type NewsletterValidation =
  | { ok: true; data: NewsletterInput }
  | { ok: false; error: string };

/** Validates and normalizes a subscription payload (pure, unit-testable). */
export function validateNewsletterInput(body: unknown): NewsletterValidation {
  if (typeof body !== "object" || body === null) {
    return { ok: false, error: "Body must be a JSON object." };
  }
  const input = body as Record<string, unknown>;

  const email = typeof input.email === "string" ? input.email : "";
  if (!isValidEmail(email)) {
    return { ok: false, error: "`email` must be a valid email address." };
  }

  const locale =
    typeof input.locale === "string" ? input.locale.trim() : null;
  if (locale && !hasLocale(routing.locales, locale)) {
    return {
      ok: false,
      error: `locale must be one of: ${routing.locales.join(", ")}.`,
    };
  }

  const source =
    typeof input.source === "string"
      ? input.source.trim().slice(0, 60) || null
      : null;

  return { ok: true, data: { email: normalizeEmail(email), locale, source } };
}

export interface SubscriptionResult {
  email: string;
  status: SubscriptionStatus;
}

/** Subscribes (or re-subscribes) an email to the newsletter. */
export async function subscribeToNewsletter(
  input: NewsletterInput
): Promise<SubscriptionResult> {
  const [venue] = await db
    .select({ id: schema.venues.id })
    .from(schema.venues)
    .orderBy(asc(schema.venues.id));

  if (!venue) {
    throw new Error("Venue is not configured.");
  }

  const [existing] = await db
    .select()
    .from(schema.newsletterSubscribers)
    .where(
      and(
        eq(schema.newsletterSubscribers.venueId, venue.id),
        eq(schema.newsletterSubscribers.email, input.email)
      )
    );

  const now = new Date();

  if (existing) {
    if (existing.status === "subscribed") {
      return { email: input.email, status: "already_subscribed" };
    }
    await db
      .update(schema.newsletterSubscribers)
      .set({
        status: "subscribed",
        locale: input.locale ?? existing.locale,
        source: input.source ?? existing.source,
        updatedAt: now,
      })
      .where(eq(schema.newsletterSubscribers.id, existing.id));
    return { email: input.email, status: "subscribed" };
  }

  await db.insert(schema.newsletterSubscribers).values({
    id: randomUUID(),
    venueId: venue.id,
    email: input.email,
    locale: input.locale,
    status: "subscribed",
    source: input.source,
    createdAt: now,
    updatedAt: now,
  });

  return { email: input.email, status: "subscribed" };
}
