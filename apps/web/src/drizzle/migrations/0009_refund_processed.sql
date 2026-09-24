ALTER TABLE "refund_requests" ADD COLUMN "processed_by" uuid;--> statement-breakpoint
ALTER TABLE "refund_requests" ADD COLUMN "processed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_processed_by_user_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;