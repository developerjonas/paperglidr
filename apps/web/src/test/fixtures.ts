// TEST CODE ONLY — DB fixtures for payment tests.
import crypto from "node:crypto"
import { and, eq, sql } from "drizzle-orm"
import { db } from "@/drizzle/db"
import {
  CourseProductTable,
  CourseTable,
  InvoiceTable,
  LedgerEntryTable,
  PaymentEventTable,
  ProductTable,
  PurchaseTable,
  UserCourseAccessTable,
  UserTable,
  DiscountRedemptionTable,
} from "@/drizzle/schema"

const run = crypto.randomBytes(4).toString("hex")
let seq = 0

export async function createUser(label = "user") {
  const [user] = await db
    .insert(UserTable)
    .values({ name: label, email: `${label}-${run}-${++seq}@test.invalid` })
    .returning()
  return user!
}

/** A creator with one course sold as one public product. */
export async function createProduct({ priceInRupees = 999, status = "public" as "public" | "private" } = {}) {
  const creator = await createUser("creator")
  const [course] = await db
    .insert(CourseTable)
    .values({ name: `Course ${run}-${++seq}`, description: "d", authorId: creator.id })
    .returning()
  const [product] = await db
    .insert(ProductTable)
    .values({
      name: `Product ${run}-${seq}`,
      description: "d",
      imageUrl: "/x.png",
      priceInRupees,
      status,
      authorId: creator.id,
    })
    .returning()
  await db.insert(CourseProductTable).values({ courseId: course!.id, productId: product!.id })
  return { creator, course: course!, product: product! }
}

/** A pending gateway purchase, as initiatePurchase leaves it. */
export async function createPendingPurchase({
  gateway = "esewa" as "esewa" | "khalti" | "fonepay",
  priceInRupees = 999,
  ageMs = 0,
  status = "pending" as "pending" | "failed",
} = {}) {
  const { product, course, creator } = await createProduct({ priceInRupees })
  const buyer = await createUser("buyer")
  const key = `${crypto.randomUUID()}:${gateway}`
  const [purchase] = await db
    .insert(PurchaseTable)
    .values({
      userId: buyer.id,
      productId: product.id,
      productDetails: { name: product.name, description: "d", imageUrl: "/x.png" },
      pricePaidInPaisa: priceInRupees * 100,
      gateway,
      status,
      gatewayCheckoutId: key,
      idempotencyKey: key,
      createdAt: new Date(Date.now() - ageMs),
    })
    .returning()
  return { purchase: purchase!, product, course, creator, buyer }
}

export async function purchaseState(purchaseId: string) {
  const [purchase] = await db.select().from(PurchaseTable).where(eq(PurchaseTable.id, purchaseId))
  const count = async (table: typeof LedgerEntryTable | typeof InvoiceTable | typeof DiscountRedemptionTable) =>
    (
      await db
        .select({ n: sql<number>`count(*)::int` })
        .from(table)
        .where(eq(table.purchaseId, purchaseId))
    )[0]!.n
  const access = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(UserCourseAccessTable)
    .innerJoin(CourseProductTable, eq(CourseProductTable.courseId, UserCourseAccessTable.courseId))
    .where(
      and(
        eq(UserCourseAccessTable.userId, purchase!.userId),
        eq(CourseProductTable.productId, purchase!.productId),
      ),
    )
  const events = await db
    .select()
    .from(PaymentEventTable)
    .where(eq(PaymentEventTable.purchaseId, purchaseId))
  return {
    status: purchase!.status,
    gatewayTransactionId: purchase!.gatewayTransactionId,
    ledgerEntries: await count(LedgerEntryTable),
    invoices: await count(InvoiceTable),
    redemptions: await count(DiscountRedemptionTable),
    accessRows: access[0]!.n,
    events,
  }
}

export const paisa = (rupees: number) => rupees * 100
