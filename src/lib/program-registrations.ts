/**
 * Programme registrations (PRD §6 `program_registrations`): guest sign-ups for
 * the free trial and junior classes. Contact details only — no payment data;
 * the venue follows up via WhatsApp.
 */
import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const REFERENCE_RE = /^REG-[A-Z2-9]{6}$/;

/** Human-friendly registration reference (no ambiguous characters). */
export function generateRegistrationReference(
  random: () => number = Math.random
): string {
  let suffix = "";
  for (let index = 0; index < 6; index++) {
    suffix +=
      REFERENCE_ALPHABET[
        Math.floor(random() * REFERENCE_ALPHABET.length) %
          REFERENCE_ALPHABET.length
      ];
  }
  return `REG-${suffix}`;
}

export function isValidRegistrationReference(value: string): boolean {
  return REFERENCE_RE.test(value);
}

/** Normalizes an Indonesian WhatsApp number to 62-prefixed digits. */
export function normalizeWhatsapp(value: string): string | null {
  const digits = value.replace(/[^\d]/g, "");
  const normalized = digits.startsWith("0")
    ? `62${digits.slice(1)}`
    : digits.startsWith("62")
      ? digits
      : null;
  if (!normalized || normalized.length < 10 || normalized.length > 15) {
    return null;
  }
  return normalized;
}

export interface RegistrationInput {
  name: string;
  whatsapp: string;
  email?: string | null;
  preferredSchedule?: string | null;
  notes?: string | null;
}

export interface NormalizedRegistration {
  name: string;
  whatsapp: string;
  email: string | null;
  preferredSchedule: string | null;
  notes: string | null;
}

export type RegistrationValidation =
  | { ok: true; data: NormalizedRegistration }
  | { ok: false; errors: string[] };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validates and normalizes a registration payload (pure, unit-testable). */
export function validateRegistration(
  body: unknown
): RegistrationValidation {
  if (typeof body !== "object" || body === null) {
    return { ok: false, errors: ["Body must be a JSON object."] };
  }
  const input = body as Record<string, unknown>;
  const errors: string[] = [];

  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length < 2 || name.length > 80) {
    errors.push("`name` must be 2–80 characters.");
  }

  const whatsapp =
    typeof input.whatsapp === "string"
      ? normalizeWhatsapp(input.whatsapp)
      : null;
  if (!whatsapp) {
    errors.push(
      "`whatsapp` must be a valid Indonesian number (e.g. 081188022770)."
    );
  }

  const email = typeof input.email === "string" ? input.email.trim() : null;
  if (email && !EMAIL_RE.test(email)) {
    errors.push("`email` must be a valid email address.");
  }

  const preferredSchedule =
    typeof input.preferredSchedule === "string"
      ? input.preferredSchedule.trim().slice(0, 200)
      : null;
  const notes =
    typeof input.notes === "string"
      ? input.notes.trim().slice(0, 500)
      : null;

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    data: {
      name,
      whatsapp: whatsapp!,
      email: email || null,
      preferredSchedule: preferredSchedule || null,
      notes: notes || null,
    },
  };
}

export type RegistrationErrorCode =
  | "PROGRAM_NOT_FOUND"
  | "PROGRAM_NOT_REGISTRABLE";

export class RegistrationError extends Error {
  constructor(public code: RegistrationErrorCode, message: string) {
    super(message);
  }
}

const REGISTRABLE_KINDS = ["free_trial", "junior"] as const;

export interface CreatedRegistration {
  id: string;
  reference: string;
  programId: string;
  status: string;
  createdAt: string;
}

/** Creates a registration for a self-serve programme (free trial / junior). */
export async function createRegistration(
  programId: string,
  input: NormalizedRegistration
): Promise<CreatedRegistration> {
  const [program] = await db
    .select()
    .from(schema.coachingPrograms)
    .where(eq(schema.coachingPrograms.id, programId));

  if (!program) {
    throw new RegistrationError(
      "PROGRAM_NOT_FOUND",
      `Unknown programme "${programId}".`
    );
  }
  if (
    !program.isActive ||
    !REGISTRABLE_KINDS.includes(
      program.kind as (typeof REGISTRABLE_KINDS)[number]
    )
  ) {
    throw new RegistrationError(
      "PROGRAM_NOT_REGISTRABLE",
      `Programme "${programId}" does not accept online registrations. Register via WhatsApp instead.`
    );
  }

  const now = new Date();
  const id = randomUUID();
  const reference = generateRegistrationReference();

  await db.insert(schema.programRegistrations).values({
    id,
    reference,
    programId,
    venueId: program.venueId,
    name: input.name,
    whatsapp: input.whatsapp,
    email: input.email,
    preferredSchedule: input.preferredSchedule,
    notes: input.notes,
    status: "new",
    createdAt: now,
    updatedAt: now,
  });

  return {
    id,
    reference,
    programId,
    status: "new",
    createdAt: now.toISOString(),
  };
}

/** Whether a programme currently accepts self-serve registrations. */
export async function isProgramRegistrable(programId: string): Promise<boolean> {
  const [program] = await db
    .select({
      kind: schema.coachingPrograms.kind,
      isActive: schema.coachingPrograms.isActive,
    })
    .from(schema.coachingPrograms)
    .where(eq(schema.coachingPrograms.id, programId));
  return Boolean(
    program &&
      program.isActive &&
      REGISTRABLE_KINDS.includes(
        program.kind as (typeof REGISTRABLE_KINDS)[number]
      )
  );
}

/** Counts registrations for a programme (venue follow-up metric). */
export async function countRegistrations(
  programId: string
): Promise<number> {
  const rows = await db
    .select({ id: schema.programRegistrations.id })
    .from(schema.programRegistrations)
    .where(
      and(
        eq(schema.programRegistrations.programId, programId),
        eq(schema.programRegistrations.status, "new")
      )
    );
  return rows.length;
}
