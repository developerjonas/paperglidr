import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createdAt, id } from "../schemaHelpers";

/**
 * R2 objects to delete later (private bucket). A lesson file that was
 * replaced or removed may still be playing through a signed URL (videos:
 * up to 3 hours), so it's queued with a delay and deleted by the cron
 * (features/lessons/lib/uploadCleanup.ts) instead of in the request.
 */
export const StorageDeletionTable = pgTable(
  "storage_deletions",
  {
    id: id(),
    storageKey: text("storage_key").notNull(),
    reason: text().notNull(), // "replaced" | "removed"
    deleteAfter: timestamp("delete_after", { withTimezone: true }).notNull(),
    createdAt,
  },
  table => [index("storage_deletions_delete_after_idx").on(table.deleteAfter)],
);
