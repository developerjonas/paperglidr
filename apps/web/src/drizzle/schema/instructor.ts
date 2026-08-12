import { pgTable, text, uuid, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createdAt, id, updatedAt } from "../schemaHelpers";
import { UserTable } from "./user";

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
