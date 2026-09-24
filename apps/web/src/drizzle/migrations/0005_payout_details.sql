CREATE TYPE "public"."payout_method" AS ENUM('bank', 'esewa', 'khalti');--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN "payout_method" "payout_method";--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN "payout_details" jsonb;