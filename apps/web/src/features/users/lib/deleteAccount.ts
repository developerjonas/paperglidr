import "server-only"
import { count, eq } from "drizzle-orm"
import { db } from "@/drizzle/db"
import {
  AccountTable,
  CourseTable,
  InstructorTable,
  LedgerEntryTable,
  PayoutTable,
  ProductTable,
  SessionTable,
  UserCourseAccessTable,
  UserLessonCompleteTable,
  UserTable,
  VerificationTable,
  WishlistTable,
} from "@/drizzle/schema"
import { revalidateUserCache } from "../db/cache"
import { getWishlistGlobalTag, getWishlistUserTag } from "@/features/wishlist/db/cache"
import { getUserCourseAccessGlobalTag, getUserCourseAccessUserTag } from "@/features/courses/db/cache/userCourseAccess"
import {
  getUserLessonCompleteGlobalTag,
  getUserLessonCompleteUserTag,
} from "@/features/lessons/db/cache/userLessonComplete"
import { revalidateInstructorCache } from "@/features/instructors/db/cache/instructors"
import { COMPANY } from "@/config/company"
import { revalidateTag } from "next/cache"

/** What the user must type to confirm, on the web and in the app. */
export const DELETE_ACCOUNT_CONFIRMATION = "DELETE"

export type DeleteAccountResult =
  | { ok: true }
  | { ok: false; reason: "confirmation" | "not_found" | "admin" | "creator"; message: string }

/**
 * Closes an account for good, as the Privacy Policy (section 5) describes:
 *
 * - Removed: every way to sign in (password, Google/GitHub links), every
 *   session (web and app sign out at once), password-reset links, the
 *   name, email, username and photo, the wishlist, course access and
 *   progress. The email and username are freed, so they can sign up again.
 * - Kept: purchases, invoices, refunds and payment records (tax and
 *   accounting law); reviews and Q&A, shown as "Deleted user"; and
 *   certificates already issued, which stay verifiable under the name
 *   printed on them.
 *
 * The user row itself stays (anonymised) because those kept records point
 * at it. Creators with courses, products or earnings close their account
 * through support instead, so their students keep access and earnings are
 * paid out first; admins can't delete themselves.
 */
export async function deleteAccount({
  userId,
  confirmation,
}: {
  userId: string
  confirmation: string
}): Promise<DeleteAccountResult> {
  if (confirmation.trim() !== DELETE_ACCOUNT_CONFIRMATION) {
    return {
      ok: false,
      reason: "confirmation",
      message: `Type ${DELETE_ACCOUNT_CONFIRMATION} to confirm.`,
    }
  }

  const blocker = await getAccountDeletionBlocker(userId)
  if (blocker) return { ok: false, ...blocker }

  const instructor = await db.query.InstructorTable.findFirst({
    where: eq(InstructorTable.userId, userId),
    columns: { id: true, handle: true },
  })

  await db.transaction(async tx => {
    // Signing in: gone everywhere, at once.
    await tx.delete(SessionTable).where(eq(SessionTable.userId, userId))
    await tx.delete(AccountTable).where(eq(AccountTable.userId, userId))
    await tx.delete(VerificationTable).where(eq(VerificationTable.value, userId))

    // Personal data with no legal reason to keep.
    await tx.delete(WishlistTable).where(eq(WishlistTable.userId, userId))
    await tx.delete(UserCourseAccessTable).where(eq(UserCourseAccessTable.userId, userId))
    await tx.delete(UserLessonCompleteTable).where(eq(UserLessonCompleteTable.userId, userId))
    if (instructor != null) await tx.delete(InstructorTable).where(eq(InstructorTable.id, instructor.id))

    await tx
      .update(UserTable)
      .set({
        name: "Deleted user",
        // .invalid can never be a real address (RFC 2606).
        email: `deleted-${userId}@deleted.invalid`,
        username: null,
        displayUsername: null,
        image: null,
        emailVerified: false,
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(UserTable.id, userId))
  })

  revalidateUserCache(userId)
  for (const tag of [
    getWishlistGlobalTag(),
    getWishlistUserTag(userId),
    getUserCourseAccessGlobalTag(),
    getUserCourseAccessUserTag(userId),
    getUserLessonCompleteGlobalTag(),
    getUserLessonCompleteUserTag(userId),
  ]) {
    revalidateTag(tag)
  }
  if (instructor != null) revalidateInstructorCache({ id: instructor.id, userId, handle: instructor.handle })

  return { ok: true }
}

/**
 * Why this account can't be deleted by its owner right now, or null if it
 * can. The delete page shows it before the user types anything.
 */
export async function getAccountDeletionBlocker(
  userId: string,
): Promise<{ reason: "not_found" | "admin" | "creator"; message: string } | null> {
  const user = await db.query.UserTable.findFirst({
    where: eq(UserTable.id, userId),
    columns: { id: true, role: true, deletedAt: true },
  })
  if (user == null || user.deletedAt != null) {
    return { reason: "not_found", message: "Account not found." }
  }
  if (user.role === "admin") {
    return {
      reason: "admin",
      message: "Admin accounts can't be deleted here. Ask another admin to remove your admin role first.",
    }
  }
  const instructor = await db.query.InstructorTable.findFirst({
    where: eq(InstructorTable.userId, userId),
    columns: { id: true },
  })
  if (instructor != null && (await hasCreatorRecords(userId))) {
    return {
      reason: "creator",
      message: `You have courses or earnings on ${COMPANY.brandName}. To close a creator account, email ${COMPANY.supportEmail}: we'll pay out what you've earned and make sure your students keep their courses.`,
    }
  }
  return null
}

/** Whether a creator has anything students or the books depend on. */
async function hasCreatorRecords(userId: string) {
  const [[courses], [products], [ledger], [payouts]] = await Promise.all([
    db.select({ n: count() }).from(CourseTable).where(eq(CourseTable.authorId, userId)),
    db.select({ n: count() }).from(ProductTable).where(eq(ProductTable.authorId, userId)),
    db.select({ n: count() }).from(LedgerEntryTable).where(eq(LedgerEntryTable.instructorId, userId)),
    db.select({ n: count() }).from(PayoutTable).where(eq(PayoutTable.instructorId, userId)),
  ])
  return [courses, products, ledger, payouts].some(row => (row?.n ?? 0) > 0)
}
