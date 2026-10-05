import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { assetProviderEnum } from "./lessonAsset";
import { createdAt, id } from "../schemaHelpers";

/**
 * Stored files to delete later: R2 objects (private bucket; storage_key is
 * the object key) and Bunny Stream videos (storage_key is the video GUID).
 * A lesson file that was replaced or removed may still be playing through
 * a signed URL (up to 3 hours), so it's queued with a delay and deleted by
 * the cron (features/lessons/lib/uploadCleanup.ts) instead of in the request.
 */
export const StorageDeletionTable = pgTable(
  "storage_deletions",
  {
    id: id(),
    storageKey: text("storage_key").notNull(),
    provider: assetProviderEnum().notNull().default("r2"), // "r2" | "bunny"
    reason: text().notNull(), // "replaced" | "removed"
    deleteAfter: timestamp("delete_after", { withTimezone: true }).notNull(),
    createdAt,
  },
  table => [index("storage_deletions_delete_after_idx").on(table.deleteAfter)],
);
