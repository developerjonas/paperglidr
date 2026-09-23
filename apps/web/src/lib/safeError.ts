import "server-only";
import { unstable_rethrow } from "next/navigation";
import { NextResponse } from "next/server";

/**
 * The allow-list: throw this when the message is deliberately written for
 * the end user (no internals, no SQL, no ids of other users). Every other
 * error is treated as internal — logged in full, never shown.
 */
export class UserFacingError extends Error {
  override name = "UserFacingError";
}

export const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

/**
 * Message that is safe to send to the client for `error`. Logs the full
 * error server-side (with `context`) unless it's a UserFacingError.
 * Re-throws Next's control-flow errors (redirect(), notFound()) so it can
 * wrap code that uses them.
 */
export function safeErrorMessage(
  error: unknown,
  context: string,
  fallback: string = GENERIC_ERROR_MESSAGE,
): string {
  unstable_rethrow(error);
  if (error instanceof UserFacingError) return error.message;
  console.error(`[${context}]`, error);
  return fallback;
}

/** `{ error: true, message }` for a server action's catch block. */
export function actionError(error: unknown, context: string, fallback?: string) {
  return { error: true as const, message: safeErrorMessage(error, context, fallback) };
}

/** JSON error response for a route handler's catch block. */
export function routeError(
  error: unknown,
  context: string,
  status = 500,
  fallback?: string,
) {
  return NextResponse.json(
    { error: safeErrorMessage(error, context, fallback) },
    { status },
  );
}
