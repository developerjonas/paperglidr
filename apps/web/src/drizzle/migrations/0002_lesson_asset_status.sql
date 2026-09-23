CREATE TYPE "public"."asset_status" AS ENUM('pending', 'ready');--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD COLUMN "status" "asset_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
-- Hand-added: assets that existed before this migration were already live; only new uploads start as pending.
UPDATE "lesson_assets" SET "status" = 'ready';
