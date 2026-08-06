import { db } from "@/drizzle/db"
import { PayoutTable, UserRole } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

export function canRequestPayout({ userId }: { userId: string | undefined }) {
  return userId != null
}

export async function canViewPayout(
  { userId, role }: { userId: string | undefined; role: UserRole | undefined },
  payoutId: string
) {
  if (role === "admin") return true
  if (userId == null) return false
  const payout = await db.query.PayoutTable.findFirst({
    where: eq(PayoutTable.id, payoutId),
    columns: { instructorId: true },
  })
  return payout?.instructorId === userId
}

export function canManagePayouts({ role }: { role: UserRole | undefined }) {
  return role === "admin"
}
