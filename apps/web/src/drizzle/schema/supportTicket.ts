import {
  pgTable,
  text,
  uuid,
  timestamp,
  pgEnum,
  index,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { id, createdAt, updatedAt } from "../schemaHelpers";
import { UserTable } from "./user";

export const supportTicketCategories = [
  "account",
  "billing",
  "technical",
  "instructor",
  "other",
] as const;
export type SupportTicketCategory = (typeof supportTicketCategories)[number];
export const supportTicketCategoryEnum = pgEnum(
  "support_ticket_category",
  supportTicketCategories,
);

export const supportTicketStatuses = [
  "open",
  "in_progress",
  "resolved",
  "closed",
] as const;
export type SupportTicketStatus = (typeof supportTicketStatuses)[number];
export const supportTicketStatusEnum = pgEnum(
  "support_ticket_status",
  supportTicketStatuses,
);

export const SupportTicketTable = pgTable(
  "support_tickets",
  {
    id: id(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    category: supportTicketCategoryEnum().notNull().default("other"),
    status: supportTicketStatusEnum().notNull().default("open"),
    // Bumped on every new message so the admin queue can sort by
    // "most recently active" rather than "most recently created".
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("support_tickets_user_id_idx").on(t.userId),
    index("support_tickets_status_idx").on(t.status),
  ],
);

export const SupportTicketRelationships = relations(
  SupportTicketTable,
  ({ one, many }) => ({
    user: one(UserTable, {
      fields: [SupportTicketTable.userId],
      references: [UserTable.id],
    }),
    messages: many(SupportTicketMessageTable),
  }),
);

export const SupportTicketMessageTable = pgTable(
  "support_ticket_messages",
  {
    id: id(),
    ticketId: uuid("ticket_id")
      .notNull()
      .references(() => SupportTicketTable.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => UserTable.id, { onDelete: "cascade" }),
    isAdminReply: boolean("is_admin_reply").notNull().default(false),
    content: text("content").notNull(),
    createdAt,
  },
  (t) => [index("support_ticket_messages_ticket_id_idx").on(t.ticketId)],
);

export const SupportTicketMessageRelationships = relations(
  SupportTicketMessageTable,
  ({ one }) => ({
    ticket: one(SupportTicketTable, {
      fields: [SupportTicketMessageTable.ticketId],
      references: [SupportTicketTable.id],
    }),
    author: one(UserTable, {
      fields: [SupportTicketMessageTable.authorId],
      references: [UserTable.id],
    }),
  }),
);
