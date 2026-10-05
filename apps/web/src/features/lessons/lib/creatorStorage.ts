import "server-only"
import { and, eq, inArray, sql } from "drizzle-orm"
import { db } from "@/drizzle/db"
import {
  CourseSectionTable,
  CourseTable,
  DEFAULT_CREATOR_STORAGE_LIMIT_BYTES,
  InstructorTable,
  LessonAssetTable,
  LessonTable,
} from "@/drizzle/schema"
import { UserFacingError } from "@/lib/safeError"
import { formatBytes } from "./uploadRules"

type Tx = Omit<typeof db, "$client">

/**
 * Each creator may store up to their limit (5 GB by default, raised per
 * creator by an admin) of lesson content: uploaded video (Bunny) and files
 * (R2). Uploads in progress count, so parallel uploads can't overshoot;
 * failed ones and YouTube/Vimeo links don't. This caps the storage bill
 * per creator, including for courses that never go on sale.
 */
export async function getCreatorStorage(userId: string, trx: Tx = db) {
  const [usage] = await trx
    .select({ used: sql<string>`coalesce(sum(${LessonAssetTable.fileSizeBytes}), 0)` })
    .from(LessonAssetTable)
    .innerJoin(LessonTable, eq(LessonTable.id, LessonAssetTable.lessonId))
    .innerJoin(CourseSectionTable, eq(CourseSectionTable.id, LessonTable.sectionId))
    .innerJoin(CourseTable, eq(CourseTable.id, CourseSectionTable.courseId))
    .where(
      and(
        eq(CourseTable.authorId, userId),
        inArray(LessonAssetTable.provider, ["r2", "bunny"]),
        inArray(LessonAssetTable.status, ["pending", "ready"]),
      ),
    )
  const instructor = await trx.query.InstructorTable.findFirst({
    where: eq(InstructorTable.userId, userId),
    columns: { storageLimitBytes: true },
  })
  return {
    usedBytes: Number(usage?.used ?? 0),
    limitBytes: instructor?.storageLimitBytes ?? DEFAULT_CREATOR_STORAGE_LIMIT_BYTES,
  }
}

/**
 * Inside a transaction: locks the creator's instructor row (so two uploads
 * at once are checked one after the other) and refuses a file that would
 * go over the limit.
 */
export async function assertStorageAvailable(userId: string, addBytes: number, trx: Tx) {
  await trx.execute(sql`select 1 from ${InstructorTable} where ${InstructorTable.userId} = ${userId} for update`)
  const { usedBytes, limitBytes } = await getCreatorStorage(userId, trx)
  if (usedBytes + addBytes > limitBytes) {
    const left = Math.max(limitBytes - usedBytes, 0)
    throw new UserFacingError(
      `Not enough storage: you've used ${formatBytes(usedBytes)} of ${formatBytes(limitBytes)}${
        left > 0 ? ` (${formatBytes(left)} left)` : ""
      }. Remove a video you no longer need, or contact support for more space.`,
    )
  }
}
