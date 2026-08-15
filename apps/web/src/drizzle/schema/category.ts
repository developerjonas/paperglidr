import { relations } from "drizzle-orm";
import { pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../schemaHelpers";
import { ProductTable } from "./product";

export const CategoryTable = pgTable("categories", {
  id: id(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  createdAt,
  updatedAt,
});

export const CategoryRelationships = relations(CategoryTable, ({ many }) => ({
  products: many(ProductTable),
}));
