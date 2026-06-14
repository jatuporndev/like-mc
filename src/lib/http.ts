import { NextResponse } from "next/server";

import { HttpError } from "@/server/auth";

/** Standard JSON success envelope. */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

/** Standard JSON error envelope. */
export function fail(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/**
 * Convert thrown errors into a JSON response. HttpError carries its own status;
 * anything else becomes a 500 with a safe message.
 */
export function handleError(error: unknown) {
  if (error instanceof HttpError) {
    return fail(error.message, error.status);
  }
  console.error("[api] unhandled error:", error);
  const message =
    error instanceof Error ? error.message : "Internal server error.";
  return fail(message, 500);
}
