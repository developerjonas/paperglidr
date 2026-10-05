"use server"

import { and, count, eq, isNull } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/drizzle/db"
import { InstructorTable, SessionTable, UserCourseAccessTable, UserTable } from "@/drizzle/schema"
import { auth } from "@/lib/auth"
import { actionError, UserFacingError } from "@/lib/safeError"
import { requireAdmin } from "@/services/auth"
import { revalidateUserCache } from "@/features/users/db/cache"
import { addUserCourseAccess } from "@/features/courses/db/userCourseAccess"
import { revalidateUserCourseAccessCache } from "@/features/courses/db/cache/userCourseAccess"
import { deleteAccount, getAccountDeletionBlocker } from "@/features/users/lib/deleteAccount"
import { searchCoursesForGrant } from "../db/users"

// Admin actions on one user. Each returns { error, message } for ActionButton.

const uuid = z.string().uuid()

async function findLiveUser(userId: string) {
  const user = await db.query.UserTable.findFirst({
    where: and(eq(UserTable.id, uuid.parse(userId)), isNull(UserTable.deletedAt)),
    columns: { id: true, email: true, role: true },
  })
  if (user == null) throw new UserFacingError("User not found (or the account was deleted).")
  return user
}

function done(userId: string, message: string) {
  revalidatePath(`/admin/users/${userId}`)
  revalidatePath("/admin/users")
  return { error: false, message }
}

/** Makes a user an admin, or back to a normal user. Never yourself; never the last admin. */
export async function setUserRole(userId: string, role: "user" | "admin") {
  const admin = await requireAdmin()
  try {
    if (userId === admin.userId) throw new UserFacingError("You can't change your own role. Ask another admin.")
    const user = await findLiveUser(userId)
    if (user.role === role) return { error: false, message: "No change needed." }
    if (role === "user") {
      const [admins] = await db
        .select({ n: count() })
        .from(UserTable)
        .where(and(eq(UserTable.role, "admin"), isNull(UserTable.deletedAt)))
      if ((admins?.n ?? 0) <= 1) throw new UserFacingError("There must always be at least one admin.")
    }
    await db.update(UserTable).set({ role, updatedAt: new Date() }).where(eq(UserTable.id, userId))
    revalidateUserCache(userId)
    return done(userId, role === "admin" ? "Now an admin." : "Admin role removed.")
  } catch (error) {
    return actionError(error, "setUserRole")
  }
}

/** Gives a user a course without a purchase (support, gifts, store reviewers). */
export async function grantCourseAccess(userId: string, courseId: string) {
  await requireAdmin()
  try {
    await findLiveUser(userId)
    const course = await db.query.CourseTable.findFirst({ where: (c, { eq }) => eq(c.id, uuid.parse(courseId)), columns: { id: true } })
    if (course == null) throw new UserFacingError("Course not found.")
    const added = await addUserCourseAccess({ userId, courseIds: [course.id] })
    return done(userId, added.length > 0 ? "Access granted." : "They already have this course.")
  } catch (error) {
    return actionError(error, "grantCourseAccess")
  }
}

/** Courses for the "Give a course" picker. */
export async function findCoursesToGrant(q: string) {
  await requireAdmin()
  if (q.trim().length < 2) return []
  return searchCoursesForGrant(q.slice(0, 100))
}

/** Removes a course from a user. Purchases and invoices are untouched. */
export async function revokeCourseAccess(userId: string, courseId: string) {
  await requireAdmin()
  try {
    const removed = await db
      .delete(UserCourseAccessTable)
      .where(and(eq(UserCourseAccessTable.userId, uuid.parse(userId)), eq(UserCourseAccessTable.courseId, uuid.parse(courseId))))
      .returning()
    removed.forEach(revalidateUserCourseAccessCache)
    return done(userId, removed.length > 0 ? "Access removed." : "They didn't have this course.")
  } catch (error) {
    return actionError(error, "revokeCourseAccess")
  }
}

/** Emails the user the normal "reset your password" link. */
export async function sendPasswordResetEmail(userId: string) {
  await requireAdmin()
  try {
    const user = await findLiveUser(userId)
    await auth.api.requestPasswordReset({ body: { email: user.email, redirectTo: "/reset-password" } })
    return { error: false, message: `Reset link sent to ${user.email}.` }
  } catch (error) {
    return actionError(error, "sendPasswordResetEmail")
  }
}

/** Ends every session: web and app sign out. */
export async function signOutEverywhere(userId: string) {
  await requireAdmin()
  try {
    const removed = await db.delete(SessionTable).where(eq(SessionTable.userId, uuid.parse(userId))).returning({ id: SessionTable.id })
    return done(userId, removed.length > 0 ? `Signed out of ${removed.length} session(s).` : "They weren't signed in anywhere.")
  } catch (error) {
    return actionError(error, "signOutEverywhere")
  }
}

/**
 * Deletes the account the same way the owner would (anonymised; financial
 * records kept). Admins and creators with records are refused, as for the owner.
 */
export async function deleteUserAccount(userId: string, confirmation: string) {
  const admin = await requireAdmin()
  try {
    if (userId === admin.userId) throw new UserFacingError("Delete your own account from your account page.")
    const blocker = await getAccountDeletionBlocker(uuid.parse(userId))
    if (blocker?.reason === "admin") throw new UserFacingError("Remove their admin role first.")
    if (blocker?.reason === "creator")
      throw new UserFacingError("This creator has courses, products or earnings. Pay them out and hand over the courses first.")
    const result = await deleteAccount({ userId, confirmation })
    if (!result.ok) throw new UserFacingError(result.message)
    return done(userId, "Account deleted.")
  } catch (error) {
    return actionError(error, "deleteUserAccount")
  }
}

/** Sets how much lesson content (video and files) a creator may upload, in GB. */
export async function setCreatorStorageLimit(userId: string, gigabytes: number) {
  await requireAdmin()
  try {
    const gb = z.number().min(1).max(1000).parse(gigabytes)
    const [updated] = await db
      .update(InstructorTable)
      .set({ storageLimitBytes: Math.round(gb * 1024 ** 3), updatedAt: new Date() })
      .where(eq(InstructorTable.userId, uuid.parse(userId)))
      .returning({ id: InstructorTable.id })
    if (updated == null) throw new UserFacingError("This user isn't a creator.")
    return done(userId, `Storage limit set to ${gb} GB.`)
  } catch (error) {
    if (error instanceof z.ZodError) return { error: true, message: "Enter a limit between 1 and 1000 GB." }
    return actionError(error, "setCreatorStorageLimit")
  }
}
