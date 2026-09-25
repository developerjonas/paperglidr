import "server-only"
import { NextResponse } from "next/server"
import { z } from "zod"
import type { UserRole } from "@/drizzle/schema"
import { getCurrentUser } from "@/services/auth"
import { mobileApiDisabled } from "@/lib/mobileApi"
import { safeErrorMessage } from "@/lib/safeError"

/**
 * Shared plumbing for /api/v1 (the mobile app's API). Every response is
 * JSON; every error is `{ message }` with a meaningful status. Auth is the
 * Better Auth session — a cookie on the web, `Authorization: Bearer <token>`
 * from the app (the bearer plugin in lib/auth.ts). See docs/MOBILE_API.md.
 */

// Per-user answers must never be cached by a proxy.
const noStore = { "Cache-Control": "private, no-store" }

export function apiJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: noStore })
}

export function apiError(status: number, message: string) {
  return apiJson({ message }, status)
}

const uuidSchema = z.string().uuid()

/** True for a well-formed UUID. Path ids that aren't one are a 404, not a database error. */
export function isUuid(value: string) {
  return uuidSchema.safeParse(value).success
}

export type ApiViewer = { userId: string | undefined; role: UserRole | undefined }
export type ApiUser = { userId: string; role: UserRole }

/** The signed-in viewer, if any — for routes that also work signed out. */
export async function getApiViewer(): Promise<ApiViewer> {
  const { userId, role } = await getCurrentUser()
  return { userId, role }
}

/**
 * Gate for user-specific routes: 404 while MOBILE_API_ENABLED is off (see
 * lib/mobileApi.ts), 401 without a session.
 */
export async function requireApiUser(): Promise<
  { ok: true; user: ApiUser } | { ok: false; response: Response }
> {
  const disabled = mobileApiDisabled()
  if (disabled) return { ok: false, response: disabled }
  const { userId, role } = await getCurrentUser()
  if (userId == null || role == null) {
    return { ok: false, response: apiError(401, "Sign in to continue") }
  }
  return { ok: true, user: { userId, role } }
}

/** Parses a JSON body against a schema; a 400 with the first issue otherwise. */
export async function readJson<T extends z.ZodTypeAny>(
  req: Request,
  schema: T,
): Promise<{ ok: true; data: z.infer<T> } | { ok: false; response: Response }> {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return { ok: false, response: apiError(400, "Request body must be JSON") }
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const field = issue?.path.join(".")
    return {
      ok: false,
      response: apiError(400, issue ? `${field ? `${field}: ` : ""}${issue.message}` : "Invalid request"),
    }
  }
  return { ok: true, data: parsed.data }
}

/**
 * Turns a server action's `{ error, message }` result into a response, so
 * a route reuses the action's validation and permission checks instead of
 * copying them.
 */
export function actionResponse(
  result: { error: boolean; message?: string },
  { errorStatus = 400, successStatus = 200, body }: {
    errorStatus?: number
    successStatus?: number
    body?: Record<string, unknown>
  } = {},
) {
  if (result.error) return apiError(errorStatus, result.message ?? "Request failed")
  return apiJson({ message: result.message, ...body }, successStatus)
}

type RouteContext<P> = { params: Promise<P> }

/**
 * Wraps a handler so an unexpected error is logged (and sent to Sentry)
 * and answered with a generic 500 — never the raw error.
 */
export function v1Route<P = Record<string, never>>(
  name: string,
  handler: (req: Request, context: RouteContext<P>) => Promise<Response>,
) {
  return async (req: Request, context: RouteContext<P>) => {
    try {
      return await handler(req, context)
    } catch (error) {
      return apiError(500, safeErrorMessage(error, `api v1: ${name}`, undefined, { area: "route" }))
    }
  }
}
