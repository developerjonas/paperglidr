-- Brings a database that has only the baseline (0000) up to migration 0012,
-- without drizzle-kit. Paste into the Neon SQL Editor on the production
-- branch/database. Safe to run more than once: every step checks first,
-- so it skips whatever the database already has, and the two one-time data
-- backfills (0002, 0010) run only when their column/table is newly created.
-- It only adds; it never drops or deletes.

-- ---------- 0001 payment events ----------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_event_outcome' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE "public"."payment_event_outcome" AS ENUM('initiated', 'completed', 'already_completed', 'pending', 'failed', 'disputed', 'expired', 'error');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_event_source' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE "public"."payment_event_source" AS ENUM('initiate', 'return', 'poll', 'success_page', 'cron', 'admin');
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS "payment_events" (
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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_events_purchaseId_purchases_id_fk' AND connamespace = 'public'::regnamespace) THEN
    ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_purchaseId_purchases_id_fk" FOREIGN KEY ("purchaseId") REFERENCES "public"."purchases"("id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS "payment_events_purchase_id_idx" ON "payment_events" USING btree ("purchaseId");
CREATE INDEX IF NOT EXISTS "purchases_status_created_at_idx" ON "purchases" USING btree ("status","createdAt");

-- ---------- 0002 lesson asset status ----------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_status' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE "public"."asset_status" AS ENUM('pending', 'ready');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'lesson_assets' AND column_name = 'status') THEN
    ALTER TABLE "lesson_assets" ADD COLUMN "status" "asset_status" DEFAULT 'pending' NOT NULL;
    -- One-time: assets that existed before were already live.
    UPDATE "lesson_assets" SET "status" = 'ready';
  END IF;
END $$;

-- ---------- 0003 product search index ----------
CREATE INDEX IF NOT EXISTS "products_search_vector_idx" ON "products" USING gin ("search_vector");

-- ---------- 0004 one open refund request per purchase ----------
CREATE UNIQUE INDEX IF NOT EXISTS "refund_requests_open_purchase_idx" ON "refund_requests" USING btree ("purchaseId") WHERE "refund_requests"."status" in ('pending', 'approved', 'processed');

-- ---------- 0005 payout details ----------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_method' AND typnamespace = 'public'::regnamespace) THEN
    CREATE TYPE "public"."payout_method" AS ENUM('bank', 'esewa', 'khalti');
  END IF;
END $$;
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "payout_method" "payout_method";
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "payout_details" jsonb;

-- ---------- 0006 product moderation ----------
ALTER TYPE "public"."product_status" ADD VALUE IF NOT EXISTS 'pending_review';
ALTER TYPE "public"."report_target_type" ADD VALUE IF NOT EXISTS 'product';
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "submitted_for_review_at" timestamp with time zone;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp with time zone;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "reviewed_by" uuid;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "review_note" text;
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "product_id" uuid;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_reviewed_by_user_id_fk' AND connamespace = 'public'::regnamespace) THEN
    ALTER TABLE "products" ADD CONSTRAINT "products_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reports_product_id_products_id_fk' AND connamespace = 'public'::regnamespace) THEN
    ALTER TABLE "reports" ADD CONSTRAINT "reports_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;

-- ---------- 0007 invoice delivery retries ----------
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "delivery_attempts" integer DEFAULT 0 NOT NULL;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "last_delivery_attempt_at" timestamp with time zone;
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "last_delivery_error" text;

-- ---------- 0008 storage deletions ----------
CREATE TABLE IF NOT EXISTS "storage_deletions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "storage_key" text NOT NULL,
  "reason" text NOT NULL,
  "delete_after" timestamp with time zone NOT NULL,
  "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "storage_deletions_delete_after_idx" ON "storage_deletions" USING btree ("delete_after");

-- ---------- 0009 refund processed ----------
ALTER TABLE "refund_requests" ADD COLUMN IF NOT EXISTS "processed_by" uuid;
ALTER TABLE "refund_requests" ADD COLUMN IF NOT EXISTS "processed_at" timestamp with time zone;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refund_requests_processed_by_user_id_fk' AND connamespace = 'public'::regnamespace) THEN
    ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_processed_by_user_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;

-- ---------- 0010 refund request courses ----------
DO $$ BEGIN
  IF to_regclass('public.refund_request_courses') IS NULL THEN
    CREATE TABLE "refund_request_courses" (
      "refund_request_id" uuid NOT NULL,
      "course_id" uuid NOT NULL,
      CONSTRAINT "refund_request_courses_refund_request_id_course_id_pk" PRIMARY KEY("refund_request_id","course_id")
    );
    ALTER TABLE "refund_request_courses" ADD CONSTRAINT "refund_request_courses_refund_request_id_refund_requests_id_fk" FOREIGN KEY ("refund_request_id") REFERENCES "public"."refund_requests"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "refund_request_courses" ADD CONSTRAINT "refund_request_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "refund_request_courses_course_idx" ON "refund_request_courses" USING btree ("course_id");
    -- One-time backfill: existing requests get every course of their
    -- purchase's product, plus the course they stored.
    INSERT INTO "refund_request_courses" ("refund_request_id", "course_id")
    SELECT rr."id", cp."courseId"
    FROM "refund_requests" rr
    JOIN "purchases" p ON p."id" = rr."purchaseId"
    JOIN "course_products" cp ON cp."productId" = p."productId"
    UNION
    SELECT rr."id", rr."courseId" FROM "refund_requests" rr
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ---------- 0011 username ----------
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "username" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "display_username" text;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_username_unique' AND connamespace = 'public'::regnamespace) THEN
    ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE ("username");
  END IF;
END $$;

-- ---------- 0012 Vimeo embeds + start time ----------
ALTER TYPE "public"."asset_provider" ADD VALUE IF NOT EXISTS 'vimeo' BEFORE 'r2';
ALTER TYPE "public"."asset_type" ADD VALUE IF NOT EXISTS 'vimeo' BEFORE 'video_file';
ALTER TABLE "lesson_assets" ADD COLUMN IF NOT EXISTS "startSeconds" integer;
