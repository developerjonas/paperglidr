import { db } from "@/drizzle/db"
import { DiscountCodeTable } from "@/drizzle/schema/discountCode"
import { eq } from "drizzle-orm"

type UserContext = { userId: string | undefined; role: string | undefined }

// No creator-tier role exists — UserRole is just "user" | "admin". Anyone
// signed in can create a discount code; ownership is enforced by the
// action writing creatorId: user.userId at insert time, and by
// canUpdateDiscountCodes/canDeleteDiscountCodes below checking that field
// on read/write. This mirrors how products/courses work — no "instructor"
// role gate, just a direct authorId/creatorId comparison.
export function canCreateDiscountCodes(user: UserContext) {
  return !!user.userId
}

export async function canUpdateDiscountCodes(
  user: UserContext,
  discountCodeId: string
) {
  if (!user.userId) return false
  if (user.role === "admin") return true
  const discountCode = await db.query.DiscountCodeTable.findFirst({
    where: eq(DiscountCodeTable.id, discountCodeId),
  })
  if (!discountCode) return false
  return discountCode.creatorId === user.userId
}

export const canDeleteDiscountCodes = canUpdateDiscountCodes
