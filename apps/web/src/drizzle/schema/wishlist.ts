// Destination: apps/web/src/drizzle/schema/wishlist.ts
// After adding this file, add `export * from "./wishlist";` to your
// drizzle/schema.ts barrel (same place course.ts / product.ts etc. are exported).

import { pgTable, uuid, uniqueIndex, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { id, createdAt } from "../schemaHelpers";
import { UserTable } from "./user";
import { ProductTable } from "./product";

export const WishlistTable = pgTable(
  "wishlist_items",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    productId: uuid("product_id")
      .notNull()
      .references(() => ProductTable.id, { onDelete: "cascade" }),
    createdAt,
  },
  (t) => [
    // Same user can't wishlist the same product twice — lets us
    // insert-or-noop instead of check-then-insert.
    uniqueIndex("wishlist_items_user_id_product_id_unique").on(
      t.userId,
      t.productId,
    ),
    index("wishlist_items_product_id_idx").on(t.productId),
  ],
);

export const WishlistRelationships = relations(WishlistTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [WishlistTable.userId],
    references: [UserTable.id],
  }),
  product: one(ProductTable, {
    fields: [WishlistTable.productId],
    references: [ProductTable.id],
  }),
}));
