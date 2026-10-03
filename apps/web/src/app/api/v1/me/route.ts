import { eq } from "drizzle-orm"
import { z } from "zod"
import { apiError, apiJson, readJson, requireApiUser, v1Route } from "@/lib/api/v1"
import { deleteAccount } from "@/features/users/lib/deleteAccount"
import { db } from "@/drizzle/db"
import { InstructorTable, UserTable } from "@/drizzle/schema"

/**
 * GET: the signed-in user. DELETE: closes the account for good (body
 * `{ "confirmation": "DELETE" }`; see features/users/lib/deleteAccount.ts).
 * The Bearer token stops working at once. Profile edits, password changes and sign-out go
 * through Better Auth (/api/auth/*) — see docs/MOBILE_API.md.
 */
export const GET = v1Route("me", async () => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response

  const user = await db.query.UserTable.findFirst({
    where: eq(UserTable.id, gate.user.userId),
    columns: {
      id: true,
      name: true,
      username: true,
      displayUsername: true,
      email: true,
      emailVerified: true,
      image: true,
      role: true,
      createdAt: true,
    },
  })
  if (!user) return apiError(401, "Sign in to continue")

  const instructor = await db.query.InstructorTable.findFirst({
    where: eq(InstructorTable.userId, user.id),
    columns: { handle: true, name: true, profileImageUrl: true, isVerified: true },
  })

  return apiJson({ ...user, instructor: instructor ?? null })
})

const deleteSchema = z.object({ confirmation: z.string().max(20) })

export const DELETE = v1Route("delete account", async req => {
  const gate = await requireApiUser()
  if (!gate.ok) return gate.response
  const body = await readJson(req, deleteSchema)
  if (!body.ok) return body.response

  const result = await deleteAccount({ userId: gate.user.userId, confirmation: body.data.confirmation })
  if (!result.ok) {
    return apiError(result.reason === "confirmation" ? 400 : result.reason === "not_found" ? 404 : 409, result.message)
  }
  return apiJson({ message: "Your account has been deleted." })
})
