/**
 * Admin content endpoints (PRD Fase 4 follow-up) — manage testimonials,
 * gallery photos and blog posts.
 *
 * Auth: `x-admin-token` must match the `ADMIN_TOKEN` env var. Without a
 * configured token the endpoints answer 503 (disabled).
 *
 * GET   /api/admin/content               → { testimonials, gallery, blog }
 * PATCH /api/admin/content               → body { resource, id, isActive }
 *
 * Responses: 200 · 400 invalid body · 401/403 auth · 404 unknown row · 503.
 */
import { NextResponse } from "next/server";
import {
  isAdminResource,
  listAdminContent,
  resolveAdminAuth,
  setContentActive,
} from "@/lib/admin-service";

export const runtime = "nodejs";

function authorize(request: Request) {
  const result = resolveAdminAuth(
    request.headers.get("x-admin-token"),
    process.env.ADMIN_TOKEN
  );
  if (result === "ok") return null;
  if (result === "unconfigured") {
    return NextResponse.json(
      {
        error: {
          code: "ADMIN_DISABLED",
          message: "Set ADMIN_TOKEN to enable the admin endpoints.",
        },
      },
      { status: 503 }
    );
  }
  return NextResponse.json(
    {
      error: {
        code: result === "missing" ? "UNAUTHORIZED" : "FORBIDDEN",
        message:
          result === "missing"
            ? "Missing x-admin-token header."
            : "Invalid admin token.",
      },
    },
    { status: result === "missing" ? 401 : 403 }
  );
}

export async function GET(request: Request) {
  const denied = authorize(request);
  if (denied) return denied;

  const content = await listAdminContent();
  return NextResponse.json(content, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PATCH(request: Request) {
  const denied = authorize(request);
  if (denied) return denied;

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

  const input = body as Record<string, unknown>;
  if (!isAdminResource(input.resource) || typeof input.id !== "string") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message:
            "Body must be { resource: testimonials|gallery|blog, id, isActive }.",
        },
      },
      { status: 400 }
    );
  }
  if (typeof input.isActive !== "boolean") {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "`isActive` must be a boolean.",
        },
      },
      { status: 400 }
    );
  }

  const updated = await setContentActive(
    input.resource,
    input.id,
    input.isActive
  );
  if (!updated) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: `Unknown row "${input.id}".` } },
      { status: 404 }
    );
  }

  return NextResponse.json({ updated: true });
}
