import { relations } from "drizzle-orm";
import { pgTable, text, uuid, primaryKey } from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../schemaHelpers";
import { ProductTable } from "./product";

export const TagTable = pgTable("tags", {
  id: id(),
  name: text().notNull(),
  slug: text().notNull().unique(),
  createdAt,
  updatedAt,
});

export const ProductTagTable = pgTable(
  "product_tags",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => ProductTable.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => TagTable.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.productId, table.tagId] })]
);

export const TagRelationships = relations(TagTable, ({ many }) => ({
  productTags: many(ProductTagTable),
}));

export const ProductTagRelationships = relations(ProductTagTable, ({ one }) => ({
  product: one(ProductTable, {
    fields: [ProductTagTable.productId],
    references: [ProductTable.id],
  }),
  tag: one(TagTable, {
    fields: [ProductTagTable.tagId],
    references: [TagTable.id],
  }),
}));
