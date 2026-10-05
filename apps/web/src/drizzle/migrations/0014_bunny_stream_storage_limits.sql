ALTER TYPE "public"."asset_status" ADD VALUE 'failed';--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN "storage_limit_bytes" bigint DEFAULT 5368709120 NOT NULL;--> statement-breakpoint
ALTER TABLE "storage_deletions" ADD COLUMN "provider" "asset_provider" DEFAULT 'r2' NOT NULL;