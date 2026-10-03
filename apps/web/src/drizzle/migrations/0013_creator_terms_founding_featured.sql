ALTER TABLE "products" ADD COLUMN "featured_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN "creator_terms_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN "creator_terms_version" text;--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN "is_founding" boolean DEFAULT false NOT NULL;