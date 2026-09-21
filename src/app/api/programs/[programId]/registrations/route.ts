/**
 * POST /api/programs/[programId]/registrations — free trial / junior class
 * registration (contact details only; the venue follows up via WhatsApp).
 *
 * Body: { name, whatsapp, email?, preferredSchedule?, notes? }
 *
 * Responses: 201 { registration } · 400 invalid body · 404 unknown programme
 * · 400 when the programme does not accept online registrations.
 */
import { NextResponse } from "next/server";
import {
  createRegistration,
  RegistrationError,
  validateRegistration,
} from "@/lib/program-registrations";

export const runtime = "nodejs";

const MAX_ID_LENGTH = 80;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ programId: string }> }
) {
  const { programId } = await params;

  if (!programId || programId.length > MAX_ID_LENGTH) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_PARAM",
          message: `\`programId\` must be 1–${MAX_ID_LENGTH} characters.`,
        },
      },
      { status: 400 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_BODY",
          message: "Request body must be valid JSON.",
        },
      },
      { status: 400 }
    );
  }

  const validation = validateRegistration(body);
  if (!validation.ok) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: validation.errors.join(" "),
        },
      },
      { status: 400 }
    );
  }

  try {
    const registration = await createRegistration(programId, validation.data);
    return NextResponse.json({ registration }, { status: 201 });
  } catch (error) {
    if (error instanceof RegistrationError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.code === "PROGRAM_NOT_FOUND" ? 404 : 400 }
      );
    }
    throw error;
  }
}
