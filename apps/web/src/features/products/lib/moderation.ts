import "server-only"
import { and, asc, desc, eq, isNotNull } from "drizzle-orm"
import { db } from "@/drizzle/db"
import { CourseSectionTable, LessonTable, ProductTable, UserTable } from "@/drizzle/schema"
import { revalidateProductCache } from "../db/cache"
import { sendNotification } from "@/services/email/notifications"
import { env as clientEnv } from "@/data/env/client"
import { checkProductFreeTier } from "@/features/lessons/lib/freeTier"

/** The review queue (oldest submission first) and recent decisions. */
export async function getModerationQueue() {
  const columns = {
    id: true,
    name: true,
    description: true,
    priceInRupees: true,
    imageUrl: true,
    status: true,
    submittedForReviewAt: true,
    reviewedAt: true,
    reviewNote: true,
  } as const
  const withDetails = {
    author: { columns: { id: true, name: true, email: true } },
    courseProducts: {
      columns: {},
      with: {
        course: {
          columns: { id: true, name: true },
          with: {
            courseSections: {
              columns: { id: true, name: true, status: true },
              orderBy: asc(CourseSectionTable.order),
              with: {
                lessons: {
                  columns: { id: true, name: true, status: true },
                  orderBy: asc(LessonTable.order),
                },
              },
            },
          },
        },
      },
    },
  } as const
  const [pending, decided] = await Promise.all([
    db.query.ProductTable.findMany({
      columns,
      where: eq(ProductTable.status, "pending_review"),
      orderBy: asc(ProductTable.submittedForReviewAt),
      with: withDetails,
    }),
    db.query.ProductTable.findMany({
      columns,
      where: isNotNull(ProductTable.reviewedAt),
      orderBy: desc(ProductTable.reviewedAt),
      limit: 30,
      with: withDetails,
    }),
  ])
  return { pending, decided }
}

async function emailCreator(authorId: string, subject: string, paragraphs: string[], link: { href: string; label: string }) {
  const author = await db.query.UserTable.findFirst({
    where: eq(UserTable.id, authorId),
    columns: { name: true, email: true },
  })
  if (author == null) return
  await sendNotification({ to: author.email, subject, paragraphs: [`Hi ${author.name},`, ...paragraphs], link })
}

/** pending_review -> public (status-guarded: a product is decided once). */
export async function approveProduct({ productId, adminId }: { productId: string; adminId: string }) {
  // Lessons may have changed since submission: a free product's courses
  // must still have no uploaded video.
  const pending = await db.query.ProductTable.findFirst({
    where: and(eq(ProductTable.id, productId), eq(ProductTable.status, "pending_review")),
    columns: { priceInRupees: true },
    with: { courseProducts: { columns: { courseId: true } } },
  })
  if (pending == null) return { outcome: "not_pending" as const }
  const problem = await checkProductFreeTier({
    productId,
    after: { live: true, priceInRupees: pending.priceInRupees, courseIds: pending.courseProducts.map(cp => cp.courseId) },
  })
  if (problem) return { outcome: "blocked" as const, message: problem }

  const now = new Date()
  const [product] = await db
    .update(ProductTable)
    .set({ status: "public", reviewedAt: now, reviewedBy: adminId, reviewNote: null, updatedAt: now })
    .where(and(eq(ProductTable.id, productId), eq(ProductTable.status, "pending_review")))
    .returning()
  if (product == null) return { outcome: "not_pending" as const }

  revalidateProductCache(product.id)
  await emailCreator(
    product.authorId,
    `"${product.name}" is live on Chiyali`,
    [`Your product "${product.name}" was approved and is now on sale.`],
    { href: `${clientEnv.NEXT_PUBLIC_APP_URL}/products/${product.id}`, label: "View it" },
  )
  return { outcome: "approved" as const }
}

/** pending_review -> private, with the reason shown to (and emailed to) the creator. */
export async function rejectProduct({
  productId,
  adminId,
  reason,
}: {
  productId: string
  adminId: string
  reason: string
}) {
  const now = new Date()
  const [product] = await db
    .update(ProductTable)
    .set({ status: "private", reviewedAt: now, reviewedBy: adminId, reviewNote: reason, updatedAt: now })
    .where(and(eq(ProductTable.id, productId), eq(ProductTable.status, "pending_review")))
    .returning()
  if (product == null) return { outcome: "not_pending" as const }

  revalidateProductCache(product.id)
  await emailCreator(
    product.authorId,
    `"${product.name}" needs changes before it can go on sale`,
    [
      `We reviewed "${product.name}" and couldn't approve it yet. The reason:`,
      reason,
      'Fix the issue and choose "Publish" again to resubmit.',
    ],
    { href: `${clientEnv.NEXT_PUBLIC_APP_URL}/teach/products/${product.id}/edit`, label: "Edit the product" },
  )
  return { outcome: "rejected" as const }
}
