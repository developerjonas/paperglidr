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

  const existingPurchase = await db.query.PurchaseTable.findFirst({
    where: and(
      eq(PurchaseTable.userId, userId),
      eq(PurchaseTable.productId, productId),
    ),
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
    .leftJoin(CourseReviewTable, eq(CourseReviewTable.courseId, ProductTable.id))
    .where(eq(ProductTable.status, "public"))
    .groupBy(ProductTable.id)

  const rows = limit ? await query.limit(limit) : await query

  return rows.map(r => ({ ...r, avgRating: r.avgRating ? Number(r.avgRating) : null }))
}

export async function getPublicProductDetail(productId: string) {
  const product = await db.query.ProductTable.findFirst({
    where: eq(ProductTable.id, productId),
  })
  if (!product) return null

  const courses = await db
    .select({
      courseId: CourseTable.id,
      courseName: CourseTable.name,
    })
    .from(CourseProductTable)
    .innerJoin(CourseTable, eq(CourseTable.id, CourseProductTable.courseId))
    .where(eq(CourseProductTable.productId, productId))

  return { ...product, courses }
}
