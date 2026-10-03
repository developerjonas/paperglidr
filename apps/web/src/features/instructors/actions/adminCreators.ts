"use server"

import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/drizzle/db"
import { InstructorTable } from "@/drizzle/schema"
import { requireAdmin } from "@/services/auth"
import { UserFacingError, actionError } from "@/lib/safeError"
import { revalidateInstructorCache } from "../db/cache/instructors"

const flagSchema = z.object({
  instructorId: z.string().uuid(),
  flag: z.enum(["isVerified", "isFounding"]),
  value: z.boolean(),
})

/** Admin: turn a creator's Verified tick or Founding-creator badge on or off. */
export async function setCreatorFlag(instructorId: string, flag: "isVerified" | "isFounding", value: boolean) {
  await requireAdmin()
  try {
    const parsed = flagSchema.safeParse({ instructorId, flag, value })
    if (!parsed.success) throw new UserFacingError("Invalid request")
    const [instructor] = await db
      .update(InstructorTable)
      .set({ [parsed.data.flag]: parsed.data.value, updatedAt: new Date() })
      .where(eq(InstructorTable.id, parsed.data.instructorId))
      .returning({ id: InstructorTable.id, userId: InstructorTable.userId, handle: InstructorTable.handle })
    if (!instructor) throw new UserFacingError("Creator not found")
    revalidateInstructorCache(instructor)
    revalidatePath("/admin/creators")
    const label = parsed.data.flag === "isVerified" ? "Verified" : "Founding creator"
    return { error: false as const, message: `${label} ${parsed.data.value ? "on" : "off"}` }
  } catch (error) {
    return actionError(error, "setCreatorFlag")
  }
}
