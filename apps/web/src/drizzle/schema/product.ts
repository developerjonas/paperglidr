import { relations, sql, type SQL } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  pgEnum,
  uuid,
  customType,
  index,
  timestamp,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../schemaHelpers";
import { CourseProductTable } from "./courseProduct";
import { UserTable } from "./user";
import { CategoryTable } from "./category";
import { ProductTagTable } from "./tag";

// pending_review: the creator asked to publish; an admin approves (-> public)
// or rejects (-> private, with reviewNote) at /admin/products.
export const productStatuses = ["public", "private", "pending_review"] as const;
export type ProductStatus = (typeof productStatuses)[number];
export const productStatusEnum = pgEnum("product_status", productStatuses);

// Drizzle has no built-in tsvector type yet, so this defines one
const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const ProductTable = pgTable("products", {
  id: id(),
  name: text().notNull(),
  description: text().notNull(),
  imageUrl: text().notNull(),
  priceInRupees: integer().notNull(),
  status: productStatusEnum().notNull().default("private"),
  categoryId: uuid("category_id").references(() => CategoryTable.id, {
    onDelete: "set null",
  }),
  authorId: uuid("author_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),
  // Moderation (task 18). reviewNote is the rejection reason shown to the
  // creator; cleared when they submit again.
  submittedForReviewAt: timestamp("submitted_for_review_at", { withTimezone: true }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewedBy: uuid("reviewed_by").references(() => UserTable.id, { onDelete: "set null" }),
  reviewNote: text("review_note"),
  searchVector: tsvector("search_vector").generatedAlwaysAs(
    (): SQL =>
      sql`setweight(to_tsvector('english', coalesce(${ProductTable.name}, '')), 'A') || setweight(to_tsvector('english', coalesce(${ProductTable.description}, '')), 'B')`,
  ),
  createdAt,
  updatedAt,
}, table => [
  // Full-text search (features/search) matches on search_vector with @@.
  index("products_search_vector_idx").using("gin", table.searchVector),
]);

export const ProductRelationships = relations(
  ProductTable,
  ({ one, many }) => ({
    author: one(UserTable, {
      fields: [ProductTable.authorId],
      references: [UserTable.id],
    }),
    category: one(CategoryTable, {
      fields: [ProductTable.categoryId],
      references: [CategoryTable.id],
    }),
    courseProducts: many(CourseProductTable),
    productTags: many(ProductTagTable),
  }),
);
