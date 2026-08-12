import {
  pgTable,
  text,
  uuid,
  integer,
  pgEnum,
  bigint,
  boolean,
} from "drizzle-orm/pg-core";
import { createdAt, id, updatedAt } from "../schemaHelpers";
import { relations } from "drizzle-orm";
import { LessonTable } from "./lesson";

export const assetTypes = [
  "youtube",
  "video_file",
  "pdf",
  "image",
  "audio",
] as const;
export type AssetType = (typeof assetTypes)[number];
export const assetTypeEnum = pgEnum("asset_type", assetTypes);

// where it's physically stored / how it's delivered
export const assetProviders = ["youtube", "r2", "bunny"] as const;
export type AssetProvider = (typeof assetProviders)[number];
export const assetProviderEnum = pgEnum("asset_provider", assetProviders);

// primary = the lesson's main content (what renders in the player/viewer)
// attachment = a downloadable extra alongside the primary content (slides, worksheet, source files)
export const assetRoles = ["primary", "attachment"] as const;
export type AssetRole = (typeof assetRoles)[number];
export const assetRoleEnum = pgEnum("asset_role", assetRoles);

export const LessonAssetTable = pgTable("lesson_assets", {
  id: id(),
  lessonId: uuid()
    .notNull()
    .references(() => LessonTable.id, { onDelete: "cascade" }),
  type: assetTypeEnum().notNull(),
  provider: assetProviderEnum().notNull(),
  role: assetRoleEnum().notNull().default("primary"),

  // one of these two depending on provider
  externalId: text(), // youtube video id
  storageKey: text(), // r2/bunny object key (private — used to generate signed URLs)

  fileName: text(), // original filename, for download prompts
  mimeType: text(),
  fileSizeBytes: bigint({ mode: "number" }),

  downloadable: boolean().notNull().default(false),

  durationSeconds: integer(),

  order: integer().notNull().default(0), // ordering among attachments
  createdAt,
  updatedAt,
});

export const LessonAssetRelationships = relations(
  LessonAssetTable,
  ({ one }) => ({
    lesson: one(LessonTable, {
      fields: [LessonAssetTable.lessonId],
      references: [LessonTable.id],
    }),
  }),
);
