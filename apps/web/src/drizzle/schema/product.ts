import { relations } from "drizzle-orm";
import { pgTable, text, integer, pgEnum, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../schemaHelpers";
import { CourseProductTable } from "./courseProduct";
import { UserTable } from "./user";
import { CategoryTable } from "./category";
import { ProductTagTable } from "./tag";

export const productStatuses = ["public", "private"] as const;
export type ProductStatus = (typeof productStatuses)[number];
export const productStatusEnum = pgEnum("product_status", productStatuses);

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
  createdAt,
  updatedAt,
});

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
