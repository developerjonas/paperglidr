import { relations } from "drizzle-orm";
import { pgTable, integer, uuid } from "drizzle-orm/pg-core";
import { createdAt, id } from "../schemaHelpers";
import { DiscountCodeTable } from "./discountCode";
import { UserTable } from "./user";
import { PurchaseTable } from "./purchase";

export const DiscountRedemptionTable = pgTable("discount_redemptions", {
  id: id(),

  discountCodeId: uuid("discount_code_id")
    .notNull()
    .references(() => DiscountCodeTable.id, { onDelete: "cascade" }),

  userId: uuid("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" }),

  // ASSUMPTION: a redemption is always tied to a completed purchase — this
  // table is only written to inside recordDiscountRedemption, which runs
  // alongside purchase creation. If you ever want to let someone "apply a
  // code" before checkout completes, this needs to become nullable.
  purchaseId: uuid("purchase_id")
    .notNull()
    .references(() => PurchaseTable.id, { onDelete: "cascade" }),

  // Snapshot of the actual rupee amount discounted at redemption time.
  // Keeps history accurate if the code's amount/type is edited or the code
  // is deleted later — same pattern as refund_requests' completionPercentAtRequest.
  amountDiscountedInPaisa: integer("amount_discounted_in_paisa").notNull(),
  createdAt,
});

export const DiscountRedemptionRelationships = relations(
  DiscountRedemptionTable,
  ({ one }) => ({
    discountCode: one(DiscountCodeTable, {
      fields: [DiscountRedemptionTable.discountCodeId],
      references: [DiscountCodeTable.id],
    }),
    user: one(UserTable, {
      fields: [DiscountRedemptionTable.userId],
      references: [UserTable.id],
    }),
    purchase: one(PurchaseTable, {
      fields: [DiscountRedemptionTable.purchaseId],
      references: [PurchaseTable.id],
    }),
  }),
);
