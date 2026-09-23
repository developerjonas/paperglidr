CREATE TYPE "public"."payment_event_outcome" AS ENUM('initiated', 'completed', 'already_completed', 'pending', 'failed', 'disputed', 'expired', 'error');--> statement-breakpoint
CREATE TYPE "public"."payment_event_source" AS ENUM('initiate', 'return', 'poll', 'success_page', 'cron', 'admin');--> statement-breakpoint
CREATE TABLE "payment_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchaseId" uuid NOT NULL,
	"source" "payment_event_source" NOT NULL,
	"gateway" text NOT NULL,
	"outcome" "payment_event_outcome" NOT NULL,
	"gatewayStatus" text,
	"amountInPaisa" integer,
	"detail" jsonb,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_purchaseId_purchases_id_fk" FOREIGN KEY ("purchaseId") REFERENCES "public"."purchases"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payment_events_purchase_id_idx" ON "payment_events" USING btree ("purchaseId");--> statement-breakpoint
CREATE INDEX "purchases_status_created_at_idx" ON "purchases" USING btree ("status","createdAt");