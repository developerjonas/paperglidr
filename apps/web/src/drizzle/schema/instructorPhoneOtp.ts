import { pgTable, text, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createdAt, id } from "../schemaHelpers";
import { InstructorTable } from "./instructor";

// One row per OTP attempt, not one row per instructor — keeps a full
// history (useful if you ever need to debug "did the SMS actually send")
// and means resending doesn't require an update statement, just a fresh
// insert. Old/expired rows are never queried again after verification, no
// cleanup job needed since the table stays small at this scale.
export const InstructorPhoneOtpTable = pgTable("instructor_phone_otps", {
  id: id(),

  instructorId: uuid("instructor_id")
    .notNull()
    .references(() => InstructorTable.id, { onDelete: "cascade" }),

  // Snapshot of the number being verified — may differ from
  // InstructorTable.phoneNumber if they're mid-change. Only written to
  // phoneNumber once this exact row is successfully verified.
  phoneNumber: text("phone_number").notNull(),

  // SHA-256 of the 6-digit code, not the code itself — a DB read
  // shouldn't hand out live OTPs. Verification re-hashes the submitted
  // code and compares.
  codeHash: text("code_hash").notNull(),

  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  attempts: integer().notNull().default(0),
  consumedAt: timestamp("consumed_at", { withTimezone: true }),

  createdAt,
});

export const InstructorPhoneOtpRelationships = relations(
  InstructorPhoneOtpTable,
  ({ one }) => ({
    instructor: one(InstructorTable, {
      fields: [InstructorPhoneOtpTable.instructorId],
      references: [InstructorTable.id],
    }),
  }),
);
