import { relations } from "drizzle-orm";
import { pgTable, text, integer, pgEnum, uuid } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../schemaHelpers";
import { CourseProductTable } from "./courseProduct";
import { UserTable } from "./user"; // Make sure this import points to your user schema

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

  // Links product to the user who created it
  authorId: uuid("author_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),

  createdAt,
  updatedAt,
});

export const ProductRelationships = relations(
  ProductTable,
  ({ one, many }) => ({
    // Relates product back to its author/creator
    author: one(UserTable, {
      fields: [ProductTable.authorId],
      references: [UserTable.id],
    }),
    courseProducts: many(CourseProductTable),
  }),
);
