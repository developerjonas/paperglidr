// features/purchases/db/referral.ts
import { cookies } from "next/headers"
import { db } from "@/drizzle/db"
import { InstructorTable } from "@/drizzle/schema"
import { eq } from "drizzle-orm"

const REF_COOKIE = "pg_ref"

export async function getReferringInstructorId(): Promise<string | null> {
  const handle = (await cookies()).get(REF_COOKIE)?.value
  if (!handle) return null

  const instructor = await db.query.InstructorTable.findFirst({
    where: eq(InstructorTable.handle, handle),
    columns: { userId: true }, // this is the User.id — matches referredByInstructorId and ledger.instructorId
  })
  return instructor?.userId ?? null
}
