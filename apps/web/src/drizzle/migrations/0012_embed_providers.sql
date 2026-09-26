ALTER TYPE "public"."asset_provider" ADD VALUE 'vimeo' BEFORE 'r2';--> statement-breakpoint
ALTER TYPE "public"."asset_type" ADD VALUE 'vimeo' BEFORE 'video_file';--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD COLUMN "startSeconds" integer;