-- Adds pending_review without touching existing rows: products that are public stay public.
ALTER TYPE "public"."product_status" ADD VALUE 'pending_review';--> statement-breakpoint
ALTER TYPE "public"."report_target_type" ADD VALUE 'product';--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "submitted_for_review_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "reviewed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "reviewed_by" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "review_note" text;--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN "product_id" uuid;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;