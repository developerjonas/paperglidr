import { db } from "@/drizzle/db"
import { CourseTable, InstructorTable, UserRole } from "@/drizzle/schema"
import { eq, count } from "drizzle-orm"

// Same tiers as canPublishProduct's live-product cap. Space left to layer
// in account age or sales history later — not implemented yet.
const UNVERIFIED_COURSE_CAP = 1
const PHONE_VERIFIED_COURSE_CAP = 3

export type CourseCreationCheckResult =
  | { canCreate: true }
  | { canCreate: false; reason: string }

export async function canCreateCourse({
  userId,
  role,
}: {
  userId: string
  role: UserRole | undefined
}): Promise<CourseCreationCheckResult> {
  // Admins have no cap, same exception as canPublishProduct.
  if (role === "admin") return { canCreate: true }

  const instructor = await db.query.InstructorTable.findFirst({
    where: eq(InstructorTable.userId, userId),
    columns: { phoneVerifiedAt: true },
  })

  const cap =
    instructor?.phoneVerifiedAt != null
      ? PHONE_VERIFIED_COURSE_CAP
      : UNVERIFIED_COURSE_CAP

  // CourseTable has no draft/published distinction of its own — that
  // lives on ProductTable. This caps TOTAL courses per author, not
  // "unpublished" courses specifically, since there's nothing on
  // CourseTable to filter by.
  const [row] = await db
    .select({ courseCount: count() })
    .from(CourseTable)
    .where(eq(CourseTable.authorId, userId))

  const courseCount = row?.courseCount ?? 0

  if (courseCount >= cap) {
    return {
      canCreate: false,
      reason:
        instructor?.phoneVerifiedAt != null
          ? `You've reached your limit of ${cap} courses. Contact support if you need more room.`
          : `Unverified creators can have ${cap} course. Verify your phone to create up to ${PHONE_VERIFIED_COURSE_CAP}.`,
    }
  }

  return { canCreate: true }
}
