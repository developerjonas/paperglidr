import { db } from "@/drizzle/db";
import { and, avg, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { ProductTable } from "@/drizzle/schema/product";
import { CourseProductTable } from "@/drizzle/schema/courseProduct";
import { CourseReviewTable } from "@/drizzle/schema/review";
import type { SearchQuery } from "../schemas/search";

const PAGE_SIZE = 20;

export async function searchProducts(params: SearchQuery) {
  const hasQuery = !!params.q?.trim();
  const tsQuery = sql`plainto_tsquery('english', ${params.q ?? ""})`;
  const rank = hasQuery
    ? sql<number>`ts_rank(${ProductTable.searchVector}, ${tsQuery})`
    : sql<number>`0`;
  const avgRating = avg(CourseReviewTable.rating);

  const conditions = [eq(ProductTable.status, "public")];

  if (hasQuery) {
    conditions.push(sql`${ProductTable.searchVector} @@ ${tsQuery}`);
  }
  if (params.categoryId) {
    conditions.push(eq(ProductTable.categoryId, params.categoryId));
  }
  if (params.minPrice !== undefined) {
    conditions.push(gte(ProductTable.priceInRupees, params.minPrice));
  }
  if (params.maxPrice !== undefined) {
    conditions.push(lte(ProductTable.priceInRupees, params.maxPrice));
  }

  const query = db
    .select({
      product: ProductTable,
      rank,
      avgRating,
      reviewCount: count(CourseReviewTable.id),
    })
    .from(ProductTable)
    .leftJoin(
      CourseProductTable,
      eq(CourseProductTable.productId, ProductTable.id),
    )
    .leftJoin(
      CourseReviewTable,
      eq(CourseReviewTable.courseId, CourseProductTable.courseId),
    )
    .where(and(...conditions))
    .groupBy(ProductTable.id)
    .limit(PAGE_SIZE)
    .offset((params.page - 1) * PAGE_SIZE);

  if (params.minRating !== undefined) {
    query.having(gte(avgRating, params.minRating));
  }

  const effectiveSort =
    params.sort === "relevance" && !hasQuery ? "newest" : params.sort;

  switch (effectiveSort) {
    case "rating":
      return query.orderBy(desc(avgRating));
    case "newest":
      return query.orderBy(desc(ProductTable.createdAt));
    case "price_asc":
      return query.orderBy(ProductTable.priceInRupees);
    case "price_desc":
      return query.orderBy(desc(ProductTable.priceInRupees));
    case "relevance":
    default:
      return query.orderBy(desc(rank));
  }
}
