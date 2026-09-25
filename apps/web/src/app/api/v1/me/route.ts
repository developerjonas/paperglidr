import { eq } from "drizzle-orm"
import { apiError, apiJson, requireApiUser, v1Route } from "@/lib/api/v1"
import { db } from "@/drizzle/db"
import { InstructorTable, UserTable } from "@/drizzle/schema"

/**
 * The signed-in user. Profile edits, password changes and sign-out go
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
