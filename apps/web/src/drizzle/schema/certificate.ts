import {
  pgTable,
  text,
  integer,
  timestamp,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createdAt, id, updatedAt } from "../schemaHelpers";
import { UserTable } from "./user";
import { CourseTable } from "./course";

export const CertificateTable = pgTable(
  "certificates",
  {
    id,
    certificateCode: text().notNull().unique(), // e.g. CERT-8F2A9B11C4

    userId: uuid()
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    courseId: uuid()
      .notNull()
      .references(() => CourseTable.id, { onDelete: "cascade" }),

    // Frozen at issuance — certs stay valid even if the user renames or the course is edited later
    userNameSnapshot: text().notNull(),
    courseTitleSnapshot: text().notNull(),
    instructorNameSnapshot: text().notNull(),
    courseDurationMinutesSnapshot: integer().notNull(),
    issuedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),

    // Revocation — keeps the audit trail instead of deleting the row
    revokedAt: timestamp({ withTimezone: true }),
    revokedReason: text(),

    createdAt,
    updatedAt,
  },
  (t) => [uniqueIndex("user_course_unique_idx").on(t.userId, t.courseId)],
);

export const CertificateRelationships = relations(
  CertificateTable,
  ({ one }) => ({
    user: one(UserTable, {
      fields: [CertificateTable.userId],
      references: [UserTable.id],
    }),
    course: one(CourseTable, {
      fields: [CertificateTable.courseId],
      references: [CourseTable.id],
    }),
  }),
);
