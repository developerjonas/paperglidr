CREATE TABLE "storage_deletions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_key" text NOT NULL,
	"reason" text NOT NULL,
	"delete_after" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "storage_deletions_delete_after_idx" ON "storage_deletions" USING btree ("delete_after");