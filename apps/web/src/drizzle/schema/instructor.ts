import { pgTable, text, uuid, boolean, timestamp, bigint } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createdAt, id, updatedAt } from "../schemaHelpers";
import { UserTable } from "./user";

export const DEFAULT_CREATOR_STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024; // 5 GB

export const InstructorTable = pgTable("instructors", {
  id: id(),
  userId: uuid()
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" })
    .unique(),
  handle: text().notNull().unique(),
  name: text().notNull(),
  bio: text().notNull(),
  profileImageUrl: text().notNull(),
  isVerified: boolean().notNull().default(false),

  // One instructor per number, enforced at the DB level via .unique()
  // below. Nullable because phone verification happens after profile
  // creation, not during — an instructor can exist unverified.
  phoneNumber: text("phone_number").unique(),
  phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),

  // When they agreed to the Creator Terms (including that they own the
  // rights to what they upload), and which version — CREATOR_TERMS_VERSION
  // in config/company.ts. Null until accepted; required to publish.
  creatorTermsAcceptedAt: timestamp("creator_terms_accepted_at", { withTimezone: true }),
  creatorTermsVersion: text("creator_terms_version"),

  // "Founding creator" badge, set by an admin (/admin/creators).
  isFounding: boolean("is_founding").notNull().default(false),
  // How much lesson content (video and files) the creator may upload, in
  // bytes. 5 GB by default; admins raise it per creator in /admin/users.
  storageLimitBytes: bigint("storage_limit_bytes", { mode: "number" })
    .notNull()
    .default(DEFAULT_CREATOR_STORAGE_LIMIT_BYTES),


  createdAt,
  updatedAt,
});

export const InstructorRelationships = relations(
  InstructorTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [InstructorTable.userId],
      references: [UserTable.id],
    }),
  }),
);
