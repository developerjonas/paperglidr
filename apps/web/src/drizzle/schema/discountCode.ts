import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  integer,
  pgEnum,
  uuid,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../schemaHelpers";
import { ProductTable } from "./product";
import { UserTable } from "./user";
import { DiscountRedemptionTable } from "./discountRedemption";

export const discountTypes = ["percentage", "fixed"] as const;
export type DiscountType = (typeof discountTypes)[number];
export const discountTypeEnum = pgEnum("discount_type", discountTypes);

export const discountScopes = ["product", "storewide"] as const;
export type DiscountScope = (typeof discountScopes)[number];
export const discountScopeEnum = pgEnum("discount_scope", discountScopes);

export const discountCodeStatuses = ["active", "disabled"] as const;
export type DiscountCodeStatus = (typeof discountCodeStatuses)[number];
export const discountCodeStatusEnum = pgEnum(
  "discount_code_status",
  discountCodeStatuses,
);

export const DiscountCodeTable = pgTable(
  "discount_codes",
  {
    id: id(),
    // Always stored uppercase — enforced in the zod schema, not here.
    code: text().notNull(),

    creatorId: uuid("creator_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),

    // scopeType "product" requires productId set; "storewide" requires it
    // null (meaning: any product owned by creatorId). Enforced in the zod
    // schema's .refine(), matching this schema's convention of not using
    // Postgres CHECK constraints elsewhere.
    scopeType: discountScopeEnum().notNull().default("storewide"),
    productId: uuid("product_id").references(() => ProductTable.id, {
      onDelete: "cascade",
    }),

    discountType: discountTypeEnum().notNull(),
    // percentage: 1-100. fixed: rupees, same unit as ProductTable.priceInRupees.
    amount: integer().notNull(),

    // null = unlimited
    maxRedemptions: integer("max_redemptions"),
    maxRedemptionsPerUser: integer("max_redemptions_per_user")
      .notNull()
      .default(1),

    // Denormalized running total, incremented inside the same transaction
    // that records a redemption. Avoids a count(*) over discount_redemptions
    // on every checkout eligibility check.
    redemptionCount: integer("redemption_count").notNull().default(0),

    // null = never expires
    expiresAt: timestamp("expires_at", { withTimezone: true }),

    status: discountCodeStatusEnum().notNull().default("active"),

    createdAt,
    updatedAt,
  },
  (table) => ({
    codeUniqueIndex: uniqueIndex("discount_codes_code_unique").on(table.code),
  }),
);

export const DiscountCodeRelationships = relations(
  DiscountCodeTable,
  ({ one, many }) => ({
    creator: one(UserTable, {
      fields: [DiscountCodeTable.creatorId],
      references: [UserTable.id],
    }),
    product: one(ProductTable, {
      fields: [DiscountCodeTable.productId],
      references: [ProductTable.id],
    }),
    redemptions: many(DiscountRedemptionTable),
  }),
);
