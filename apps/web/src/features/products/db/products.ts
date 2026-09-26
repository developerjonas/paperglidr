import { and, asc, avg, count, eq, ilike } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { getProductGlobalTag, revalidateProductCache } from "./cache";
import {
  CourseProductTable,
  ProductTable,
  ProductTagTable,
  CategoryTable,
  PurchaseTable,
  CourseReviewTable,
  CourseTable,
  InstructorTable,
  UserTable,
} from "@/drizzle/schema";
import { cacheTag } from "next/dist/server/use-cache/cache-tag";
import { wherePublicProducts } from "../permissions/products";

export async function insertProduct(
  data: typeof ProductTable.$inferInsert & {
    courseIds: string[];
    tagIds?: string[];
  },
) {
  const { courseIds, tagIds = [], ...productValues } = data;

  const newProduct = await db.transaction(async (trx) => {
    const [newProduct] = await trx
      .insert(ProductTable)
      .values(productValues)
      .returning();

    if (newProduct == null) {
      trx.rollback();
      throw new Error("Failed to create product");
    }

    if (courseIds.length > 0) {
      await trx.insert(CourseProductTable).values(
        courseIds.map((courseId) => ({
          productId: newProduct.id,
          courseId,
        })),
      );
    }

    if (tagIds.length > 0) {
      await trx.insert(ProductTagTable).values(
        tagIds.map((tagId) => ({
          productId: newProduct.id,
          tagId,
        })),
      );
    }

    return newProduct;
  });

  revalidateProductCache(newProduct.id);
  return newProduct;
}

export async function updateProduct(
  id: string,
  data: Partial<typeof ProductTable.$inferInsert> & {
    courseIds: string[];
    tagIds?: string[];
  },
) {
  const { courseIds, tagIds = [], ...productValues } = data;

  const updatedProduct = await db.transaction(async (trx) => {
    const [updatedProduct] = await trx
      .update(ProductTable)
      .set(productValues)
      .where(eq(ProductTable.id, id))
      .returning();

    if (updatedProduct == null) {
      trx.rollback();
      throw new Error("Failed to update product");
    }

    await trx
      .delete(CourseProductTable)
      .where(eq(CourseProductTable.productId, updatedProduct.id));

    if (courseIds.length > 0) {
      await trx.insert(CourseProductTable).values(
        courseIds.map((courseId) => ({
          productId: updatedProduct.id,
          courseId,
        })),
      );
    }

    await trx
      .delete(ProductTagTable)
      .where(eq(ProductTagTable.productId, updatedProduct.id));

    if (tagIds.length > 0) {
      await trx.insert(ProductTagTable).values(
        tagIds.map((tagId) => ({
          productId: updatedProduct.id,
          tagId,
        })),
      );
    }

    return updatedProduct;
  });

  revalidateProductCache(updatedProduct.id);
  return updatedProduct;
}

export async function getPublicProducts({
  query = "",
  categorySlug,
}: {
  query?: string;
  categorySlug?: string;
} = {}) {
  "use cache";
  cacheTag(getProductGlobalTag());

  const trimmed = query.trim();

  let categoryIdFilter: string | undefined;

  if (categorySlug && categorySlug !== "all") {
    const category = await db.query.CategoryTable.findFirst({
      where: eq(CategoryTable.slug, categorySlug),
      columns: { id: true },
    });
    if (category) {
      categoryIdFilter = category.id;
    }
  }

  return db.query.ProductTable.findMany({
    columns: {
      id: true,
      name: true,
      description: true,
      priceInRupees: true,
      imageUrl: true,
    },
    where: and(
      wherePublicProducts,
      trimmed ? ilike(ProductTable.name, `%${trimmed}%`) : undefined,
      categoryIdFilter
        ? eq(ProductTable.categoryId, categoryIdFilter)
        : undefined,
    ),
    orderBy: asc(ProductTable.name),
  });
}

export async function userOwnsProduct({
  userId,
  productId,
}: {
  userId: string;
  productId: string;
}) {
  if (!userId) return false;

  // Only a COMPLETED purchase is ownership. A pending, failed, disputed or
  // refunded attempt must not block the buyer from checking out again.
  const existingPurchase = await db.query.PurchaseTable.findFirst({
    where: and(
      eq(PurchaseTable.userId, userId),
      eq(PurchaseTable.productId, productId),
      eq(PurchaseTable.status, "completed"),
    ),
    columns: { id: true },
  });

  return existingPurchase != null;
}

export async function deleteProduct(id: string) {
  const [deletedProduct] = await db
    .delete(ProductTable)
    .where(eq(ProductTable.id, id))
    .returning();

  return deletedProduct;
}

export async function getPublicProductListings({ limit }: { limit?: number } = {}) {
  const query = db
    .select({
      id: ProductTable.id,
      name: ProductTable.name,
      description: ProductTable.description,
      imageUrl: ProductTable.imageUrl,
      priceInRupees: ProductTable.priceInRupees,
      avgRating: avg(CourseReviewTable.rating),
      reviewCount: count(CourseReviewTable.id),
    })
    .from(ProductTable)
    // Reviews belong to courses; a product's rating covers every course in it.
    .leftJoin(CourseProductTable, eq(CourseProductTable.productId, ProductTable.id))
    .leftJoin(
      CourseReviewTable,
      and(
        eq(CourseReviewTable.courseId, CourseProductTable.courseId),
        eq(CourseReviewTable.isHidden, false),
      ),
    )
    .where(eq(ProductTable.status, "public"))
    .groupBy(ProductTable.id)
    // Same order as the website's home page (getPublicProducts).
    .orderBy(asc(ProductTable.name))

  const rows = limit ? await query.limit(limit) : await query

  return rows.map(r => ({ ...r, avgRating: r.avgRating ? Number(r.avgRating) : null }))
}

// Public catalogue (GET /api/v1/products/[id], no auth): public products
// only, and only fields the product page shows.
export async function getPublicProductDetail(productId: string) {
  const product = await db.query.ProductTable.findFirst({
    columns: {
      id: true,
      name: true,
      description: true,
      imageUrl: true,
      priceInRupees: true,
      categoryId: true,
      authorId: true,
    },
    where: and(eq(ProductTable.id, productId), wherePublicProducts),
  })
  if (!product) return null
  const { authorId, ...shown } = product

  // "Created by": the instructor profile, or — for an author without one
  // (e.g. an admin) — just their name, as the website's product page shows.
  const [author] = await db
    .select({ name: UserTable.name })
    .from(UserTable)
    .where(eq(UserTable.id, authorId))
    .limit(1)

  // The public instructor profile only — never the user id or phone.
  const [instructor] = await db
    .select({
      handle: InstructorTable.handle,
      name: InstructorTable.name,
      profileImageUrl: InstructorTable.profileImageUrl,
      isVerified: InstructorTable.isVerified,
    })
    .from(InstructorTable)
    .where(eq(InstructorTable.userId, authorId))
    .limit(1)

  const courses = await db
    .select({
      courseId: CourseTable.id,
      courseName: CourseTable.name,
    })
    .from(CourseProductTable)
    .innerJoin(CourseTable, eq(CourseTable.id, CourseProductTable.courseId))
    .where(eq(CourseProductTable.productId, productId))

  return {
    ...shown,
    authorName: instructor?.name ?? author?.name ?? "Chiyali instructor",
    instructor: instructor ?? null,
    courses,
  }
}
