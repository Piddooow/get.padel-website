/**
 * Shared helpers for API route handlers.
 *
 * Routes that read the database must never surface an unhandled error as a
 * 500: when the data layer is unavailable (e.g. a preview deployment without a
 * persistent database) they answer with a clean 503 JSON body instead.
 */
import { NextResponse } from "next/server";

export function serviceUnavailableResponse(
  message = "This data isn't available in the current environment yet."
) {
  return NextResponse.json(
    { error: { code: "SERVICE_UNAVAILABLE", message } },
    { status: 503 }
  );
}

/**
 * Wraps a route handler so unexpected failures (database down/unconfigured,
 * upstream errors) become a 503 instead of a runtime 500.
 */
export function apiRoute<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch {
      return serviceUnavailableResponse();
    }
  };
}
