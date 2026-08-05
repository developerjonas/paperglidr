import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createdAt, updatedAt } from "../schemaHelpers";
import { UserTable } from "./user";

export const InstructorTable = pgTable("instructors", {
  id: uuid().primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => UserTable.id, { onDelete: "cascade" })
    .unique(),
  handle: text().notNull().unique(),
  name: text().notNull(),
  bio: text().notNull(),
  profileImageUrl: text().notNull(),
  isVerified: boolean().notNull().default(false),
  createdAt,
  updatedAt,
});

export const InstructorRelationships = relations(InstructorTable, ({ one }) => ({
  user: one(UserTable, {
    fields: [InstructorTable.userId],
    references: [UserTable.id],
  }),
}));
