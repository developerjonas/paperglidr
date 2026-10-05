-- Chiyali database schema: the whole schema in one migration.
--
-- Safe to run on any database, any number of times: every statement only
-- creates what's missing (types and their values, tables and every column,
-- constraints, indexes). An empty database gets the full schema; an older
-- one is brought up to date; an up-to-date one is left as it is.
-- It replaces migrations 0000-0014 (squashed on 2026-10-05). New schema
-- changes go in new migrations after this one (pnpm db:generate).
--
-- Generated from src/drizzle/schema (drizzle-kit export), made re-runnable.
DO $$ BEGIN
  CREATE TYPE "public"."course_section_status" AS ENUM('public', 'private');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."course_section_status" ADD VALUE IF NOT EXISTS 'public';
--> statement-breakpoint
ALTER TYPE "public"."course_section_status" ADD VALUE IF NOT EXISTS 'private';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."lesson_status" AS ENUM('public', 'private', 'preview');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."lesson_status" ADD VALUE IF NOT EXISTS 'public';
--> statement-breakpoint
ALTER TYPE "public"."lesson_status" ADD VALUE IF NOT EXISTS 'private';
--> statement-breakpoint
ALTER TYPE "public"."lesson_status" ADD VALUE IF NOT EXISTS 'preview';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."product_status" AS ENUM('public', 'private', 'pending_review');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."product_status" ADD VALUE IF NOT EXISTS 'public';
--> statement-breakpoint
ALTER TYPE "public"."product_status" ADD VALUE IF NOT EXISTS 'private';
--> statement-breakpoint
ALTER TYPE "public"."product_status" ADD VALUE IF NOT EXISTS 'pending_review';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."purchase_gateway" AS ENUM('esewa', 'khalti', 'fonepay', 'bank', 'free');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."purchase_gateway" ADD VALUE IF NOT EXISTS 'esewa';
--> statement-breakpoint
ALTER TYPE "public"."purchase_gateway" ADD VALUE IF NOT EXISTS 'khalti';
--> statement-breakpoint
ALTER TYPE "public"."purchase_gateway" ADD VALUE IF NOT EXISTS 'fonepay';
--> statement-breakpoint
ALTER TYPE "public"."purchase_gateway" ADD VALUE IF NOT EXISTS 'bank';
--> statement-breakpoint
ALTER TYPE "public"."purchase_gateway" ADD VALUE IF NOT EXISTS 'free';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."purchase_status" AS ENUM('pending', 'completed', 'failed', 'refunded', 'disputed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."purchase_status" ADD VALUE IF NOT EXISTS 'pending';
--> statement-breakpoint
ALTER TYPE "public"."purchase_status" ADD VALUE IF NOT EXISTS 'completed';
--> statement-breakpoint
ALTER TYPE "public"."purchase_status" ADD VALUE IF NOT EXISTS 'failed';
--> statement-breakpoint
ALTER TYPE "public"."purchase_status" ADD VALUE IF NOT EXISTS 'refunded';
--> statement-breakpoint
ALTER TYPE "public"."purchase_status" ADD VALUE IF NOT EXISTS 'disputed';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'user';
--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE IF NOT EXISTS 'admin';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."payout_method" AS ENUM('bank', 'esewa', 'khalti');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."payout_method" ADD VALUE IF NOT EXISTS 'bank';
--> statement-breakpoint
ALTER TYPE "public"."payout_method" ADD VALUE IF NOT EXISTS 'esewa';
--> statement-breakpoint
ALTER TYPE "public"."payout_method" ADD VALUE IF NOT EXISTS 'khalti';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."payout_status" AS ENUM('requested', 'paid', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."payout_status" ADD VALUE IF NOT EXISTS 'requested';
--> statement-breakpoint
ALTER TYPE "public"."payout_status" ADD VALUE IF NOT EXISTS 'paid';
--> statement-breakpoint
ALTER TYPE "public"."payout_status" ADD VALUE IF NOT EXISTS 'rejected';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."ledger_entry_type" AS ENUM('sale', 'refund');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."ledger_entry_type" ADD VALUE IF NOT EXISTS 'sale';
--> statement-breakpoint
ALTER TYPE "public"."ledger_entry_type" ADD VALUE IF NOT EXISTS 'refund';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."revenue_source" AS ENUM('instructor_link', 'platform');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."revenue_source" ADD VALUE IF NOT EXISTS 'instructor_link';
--> statement-breakpoint
ALTER TYPE "public"."revenue_source" ADD VALUE IF NOT EXISTS 'platform';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."asset_provider" AS ENUM('youtube', 'vimeo', 'r2', 'bunny');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."asset_provider" ADD VALUE IF NOT EXISTS 'youtube';
--> statement-breakpoint
ALTER TYPE "public"."asset_provider" ADD VALUE IF NOT EXISTS 'vimeo';
--> statement-breakpoint
ALTER TYPE "public"."asset_provider" ADD VALUE IF NOT EXISTS 'r2';
--> statement-breakpoint
ALTER TYPE "public"."asset_provider" ADD VALUE IF NOT EXISTS 'bunny';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."asset_role" AS ENUM('primary', 'attachment');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."asset_role" ADD VALUE IF NOT EXISTS 'primary';
--> statement-breakpoint
ALTER TYPE "public"."asset_role" ADD VALUE IF NOT EXISTS 'attachment';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."asset_status" AS ENUM('pending', 'ready', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."asset_status" ADD VALUE IF NOT EXISTS 'pending';
--> statement-breakpoint
ALTER TYPE "public"."asset_status" ADD VALUE IF NOT EXISTS 'ready';
--> statement-breakpoint
ALTER TYPE "public"."asset_status" ADD VALUE IF NOT EXISTS 'failed';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."asset_type" AS ENUM('youtube', 'vimeo', 'video_file', 'pdf', 'image', 'audio');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."asset_type" ADD VALUE IF NOT EXISTS 'youtube';
--> statement-breakpoint
ALTER TYPE "public"."asset_type" ADD VALUE IF NOT EXISTS 'vimeo';
--> statement-breakpoint
ALTER TYPE "public"."asset_type" ADD VALUE IF NOT EXISTS 'video_file';
--> statement-breakpoint
ALTER TYPE "public"."asset_type" ADD VALUE IF NOT EXISTS 'pdf';
--> statement-breakpoint
ALTER TYPE "public"."asset_type" ADD VALUE IF NOT EXISTS 'image';
--> statement-breakpoint
ALTER TYPE "public"."asset_type" ADD VALUE IF NOT EXISTS 'audio';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."invoice_status" AS ENUM('issued', 'void');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."invoice_status" ADD VALUE IF NOT EXISTS 'issued';
--> statement-breakpoint
ALTER TYPE "public"."invoice_status" ADD VALUE IF NOT EXISTS 'void';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."report_reason" AS ENUM('scam', 'piracy', 'misleading', 'inappropriate', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."report_reason" ADD VALUE IF NOT EXISTS 'scam';
--> statement-breakpoint
ALTER TYPE "public"."report_reason" ADD VALUE IF NOT EXISTS 'piracy';
--> statement-breakpoint
ALTER TYPE "public"."report_reason" ADD VALUE IF NOT EXISTS 'misleading';
--> statement-breakpoint
ALTER TYPE "public"."report_reason" ADD VALUE IF NOT EXISTS 'inappropriate';
--> statement-breakpoint
ALTER TYPE "public"."report_reason" ADD VALUE IF NOT EXISTS 'other';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."report_status" AS ENUM('pending', 'reviewing', 'dismissed', 'action_taken');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."report_status" ADD VALUE IF NOT EXISTS 'pending';
--> statement-breakpoint
ALTER TYPE "public"."report_status" ADD VALUE IF NOT EXISTS 'reviewing';
--> statement-breakpoint
ALTER TYPE "public"."report_status" ADD VALUE IF NOT EXISTS 'dismissed';
--> statement-breakpoint
ALTER TYPE "public"."report_status" ADD VALUE IF NOT EXISTS 'action_taken';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."report_target_type" AS ENUM('course', 'instructor', 'lesson', 'product');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."report_target_type" ADD VALUE IF NOT EXISTS 'course';
--> statement-breakpoint
ALTER TYPE "public"."report_target_type" ADD VALUE IF NOT EXISTS 'instructor';
--> statement-breakpoint
ALTER TYPE "public"."report_target_type" ADD VALUE IF NOT EXISTS 'lesson';
--> statement-breakpoint
ALTER TYPE "public"."report_target_type" ADD VALUE IF NOT EXISTS 'product';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."refund_request_status" AS ENUM('pending', 'approved', 'denied', 'processed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."refund_request_status" ADD VALUE IF NOT EXISTS 'pending';
--> statement-breakpoint
ALTER TYPE "public"."refund_request_status" ADD VALUE IF NOT EXISTS 'approved';
--> statement-breakpoint
ALTER TYPE "public"."refund_request_status" ADD VALUE IF NOT EXISTS 'denied';
--> statement-breakpoint
ALTER TYPE "public"."refund_request_status" ADD VALUE IF NOT EXISTS 'processed';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."discount_code_status" AS ENUM('active', 'disabled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."discount_code_status" ADD VALUE IF NOT EXISTS 'active';
--> statement-breakpoint
ALTER TYPE "public"."discount_code_status" ADD VALUE IF NOT EXISTS 'disabled';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."discount_scope" AS ENUM('product', 'storewide');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."discount_scope" ADD VALUE IF NOT EXISTS 'product';
--> statement-breakpoint
ALTER TYPE "public"."discount_scope" ADD VALUE IF NOT EXISTS 'storewide';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."discount_type" AS ENUM('percentage', 'fixed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."discount_type" ADD VALUE IF NOT EXISTS 'percentage';
--> statement-breakpoint
ALTER TYPE "public"."discount_type" ADD VALUE IF NOT EXISTS 'fixed';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."support_ticket_category" AS ENUM('account', 'billing', 'technical', 'instructor', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."support_ticket_category" ADD VALUE IF NOT EXISTS 'account';
--> statement-breakpoint
ALTER TYPE "public"."support_ticket_category" ADD VALUE IF NOT EXISTS 'billing';
--> statement-breakpoint
ALTER TYPE "public"."support_ticket_category" ADD VALUE IF NOT EXISTS 'technical';
--> statement-breakpoint
ALTER TYPE "public"."support_ticket_category" ADD VALUE IF NOT EXISTS 'instructor';
--> statement-breakpoint
ALTER TYPE "public"."support_ticket_category" ADD VALUE IF NOT EXISTS 'other';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."support_ticket_status" AS ENUM('open', 'in_progress', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."support_ticket_status" ADD VALUE IF NOT EXISTS 'open';
--> statement-breakpoint
ALTER TYPE "public"."support_ticket_status" ADD VALUE IF NOT EXISTS 'in_progress';
--> statement-breakpoint
ALTER TYPE "public"."support_ticket_status" ADD VALUE IF NOT EXISTS 'resolved';
--> statement-breakpoint
ALTER TYPE "public"."support_ticket_status" ADD VALUE IF NOT EXISTS 'closed';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."payment_event_outcome" AS ENUM('initiated', 'completed', 'already_completed', 'pending', 'failed', 'disputed', 'expired', 'error');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."payment_event_outcome" ADD VALUE IF NOT EXISTS 'initiated';
--> statement-breakpoint
ALTER TYPE "public"."payment_event_outcome" ADD VALUE IF NOT EXISTS 'completed';
--> statement-breakpoint
ALTER TYPE "public"."payment_event_outcome" ADD VALUE IF NOT EXISTS 'already_completed';
--> statement-breakpoint
ALTER TYPE "public"."payment_event_outcome" ADD VALUE IF NOT EXISTS 'pending';
--> statement-breakpoint
ALTER TYPE "public"."payment_event_outcome" ADD VALUE IF NOT EXISTS 'failed';
--> statement-breakpoint
ALTER TYPE "public"."payment_event_outcome" ADD VALUE IF NOT EXISTS 'disputed';
--> statement-breakpoint
ALTER TYPE "public"."payment_event_outcome" ADD VALUE IF NOT EXISTS 'expired';
--> statement-breakpoint
ALTER TYPE "public"."payment_event_outcome" ADD VALUE IF NOT EXISTS 'error';
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."payment_event_source" AS ENUM('initiate', 'return', 'poll', 'success_page', 'cron', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TYPE "public"."payment_event_source" ADD VALUE IF NOT EXISTS 'initiate';
--> statement-breakpoint
ALTER TYPE "public"."payment_event_source" ADD VALUE IF NOT EXISTS 'return';
--> statement-breakpoint
ALTER TYPE "public"."payment_event_source" ADD VALUE IF NOT EXISTS 'poll';
--> statement-breakpoint
ALTER TYPE "public"."payment_event_source" ADD VALUE IF NOT EXISTS 'success_page';
--> statement-breakpoint
ALTER TYPE "public"."payment_event_source" ADD VALUE IF NOT EXISTS 'cron';
--> statement-breakpoint
ALTER TYPE "public"."payment_event_source" ADD VALUE IF NOT EXISTS 'admin';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"author_id" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "description" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "author_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_products" (
	"courseId" uuid NOT NULL,
	"productId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_products_courseId_productId_pk" PRIMARY KEY("courseId","productId")
);
--> statement-breakpoint
ALTER TABLE "course_products" ADD COLUMN IF NOT EXISTS "courseId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "course_products" ADD COLUMN IF NOT EXISTS "productId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "course_products" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "course_products" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" "course_section_status" DEFAULT 'private' NOT NULL,
	"order" integer NOT NULL,
	"courseId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_sections" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "course_sections" ADD COLUMN IF NOT EXISTS "name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "course_sections" ADD COLUMN IF NOT EXISTS "status" "course_section_status" DEFAULT 'private' NOT NULL;
--> statement-breakpoint
ALTER TABLE "course_sections" ADD COLUMN IF NOT EXISTS "order" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "course_sections" ADD COLUMN IF NOT EXISTS "courseId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "course_sections" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "course_sections" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"order" integer NOT NULL,
	"status" "lesson_status" DEFAULT 'private' NOT NULL,
	"sectionId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "description" text;
--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "order" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "status" "lesson_status" DEFAULT 'private' NOT NULL;
--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "sectionId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "lessons" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"imageUrl" text NOT NULL,
	"priceInRupees" integer NOT NULL,
	"status" "product_status" DEFAULT 'private' NOT NULL,
	"category_id" uuid,
	"author_id" uuid NOT NULL,
	"submitted_for_review_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" uuid,
	"review_note" text,
	"featured_at" timestamp with time zone,
	"search_vector" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce("products"."name", '')), 'A') || setweight(to_tsvector('english', coalesce("products"."description", '')), 'B')) STORED,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "description" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "imageUrl" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "priceInRupees" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "status" "product_status" DEFAULT 'private' NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "category_id" uuid;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "author_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "submitted_for_review_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "reviewed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "reviewed_by" uuid;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "review_note" text;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "featured_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "search_vector" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce("products"."name", '')), 'A') || setweight(to_tsvector('english', coalesce("products"."description", '')), 'B')) STORED;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pricePaidInPaisa" integer NOT NULL,
	"productDetails" jsonb NOT NULL,
	"userId" uuid NOT NULL,
	"productId" uuid NOT NULL,
	"gateway" "purchase_gateway" NOT NULL,
	"status" "purchase_status" DEFAULT 'pending' NOT NULL,
	"gatewayCheckoutId" text NOT NULL,
	"gatewayTransactionId" text,
	"rawGatewayResponse" jsonb,
	"expiresAt" timestamp with time zone,
	"referredByInstructorId" uuid,
	"discount_code_id" uuid,
	"discount_amount_paisa" integer DEFAULT 0 NOT NULL,
	"idempotencyKey" text NOT NULL,
	"refundedAt" timestamp with time zone,
	"refundReason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "purchases_idempotencyKey_unique" UNIQUE("idempotencyKey")
);
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "pricePaidInPaisa" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "productDetails" jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "userId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "productId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "gateway" "purchase_gateway" NOT NULL;
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "status" "purchase_status" DEFAULT 'pending' NOT NULL;
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "gatewayCheckoutId" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "gatewayTransactionId" text;
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "rawGatewayResponse" jsonb;
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "expiresAt" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "referredByInstructorId" uuid;
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "discount_code_id" uuid;
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "discount_amount_paisa" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "idempotencyKey" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "refundedAt" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "refundReason" text;
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "account_id" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "provider_id" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "user_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "access_token" text;
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "refresh_token" text;
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "id_token" text;
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "access_token_expires_at" timestamp;
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "refresh_token_expires_at" timestamp;
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "scope" text;
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "password" text;
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "expires_at" timestamp NOT NULL;
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "token" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "ip_address" text;
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "user_agent" text;
--> statement-breakpoint
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "user_id" uuid NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"username" text,
	"display_username" text,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "email" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "username" text;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "display_username" text;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "email_verified" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "image" text;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" "user_role" DEFAULT 'user' NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "deleted_at" timestamp;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "identifier" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "value" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "expires_at" timestamp NOT NULL;
--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "verification" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_course_access" (
	"userId" uuid NOT NULL,
	"courseId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_course_access_userId_courseId_pk" PRIMARY KEY("userId","courseId")
);
--> statement-breakpoint
ALTER TABLE "user_course_access" ADD COLUMN IF NOT EXISTS "userId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_course_access" ADD COLUMN IF NOT EXISTS "courseId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_course_access" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_course_access" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user_lesson_complete" (
	"userId" uuid NOT NULL,
	"lessonId" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_lesson_complete_userId_lessonId_pk" PRIMARY KEY("userId","lessonId")
);
--> statement-breakpoint
ALTER TABLE "user_lesson_complete" ADD COLUMN IF NOT EXISTS "userId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_lesson_complete" ADD COLUMN IF NOT EXISTS "lessonId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_lesson_complete" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "user_lesson_complete" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "instructors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"handle" text NOT NULL,
	"name" text NOT NULL,
	"bio" text NOT NULL,
	"profileImageUrl" text NOT NULL,
	"isVerified" boolean DEFAULT false NOT NULL,
	"phone_number" text,
	"phone_verified_at" timestamp with time zone,
	"creator_terms_accepted_at" timestamp with time zone,
	"creator_terms_version" text,
	"is_founding" boolean DEFAULT false NOT NULL,
	"storage_limit_bytes" bigint DEFAULT 5368709120 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "instructors_userId_unique" UNIQUE("userId"),
	CONSTRAINT "instructors_handle_unique" UNIQUE("handle"),
	CONSTRAINT "instructors_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN IF NOT EXISTS "userId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN IF NOT EXISTS "handle" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN IF NOT EXISTS "name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN IF NOT EXISTS "bio" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN IF NOT EXISTS "profileImageUrl" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN IF NOT EXISTS "isVerified" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN IF NOT EXISTS "phone_number" text;
--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN IF NOT EXISTS "phone_verified_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN IF NOT EXISTS "creator_terms_accepted_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN IF NOT EXISTS "creator_terms_version" text;
--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN IF NOT EXISTS "is_founding" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN IF NOT EXISTS "storage_limit_bytes" bigint DEFAULT 5368709120 NOT NULL;
--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "instructors" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"certificateCode" text NOT NULL,
	"userId" uuid NOT NULL,
	"courseId" uuid NOT NULL,
	"userNameSnapshot" text NOT NULL,
	"courseTitleSnapshot" text NOT NULL,
	"instructorNameSnapshot" text NOT NULL,
	"courseDurationMinutesSnapshot" integer NOT NULL,
	"issuedAt" timestamp with time zone DEFAULT now() NOT NULL,
	"revokedAt" timestamp with time zone,
	"revokedReason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "certificates_certificateCode_unique" UNIQUE("certificateCode")
);
--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "certificateCode" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "userId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "courseId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "userNameSnapshot" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "courseTitleSnapshot" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "instructorNameSnapshot" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "courseDurationMinutesSnapshot" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "issuedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "revokedAt" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "revokedReason" text;
--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "certificates" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instructorId" uuid NOT NULL,
	"amountPaisa" integer NOT NULL,
	"status" "payout_status" DEFAULT 'requested' NOT NULL,
	"bankDetailsSnapshot" text NOT NULL,
	"payout_method" "payout_method",
	"payout_details" jsonb,
	"paidAt" timestamp with time zone,
	"rejectedReason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "instructorId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "amountPaisa" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "status" "payout_status" DEFAULT 'requested' NOT NULL;
--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "bankDetailsSnapshot" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "payout_method" "payout_method";
--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "payout_details" jsonb;
--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "paidAt" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "rejectedReason" text;
--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "payouts" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchaseId" uuid NOT NULL,
	"courseId" uuid NOT NULL,
	"instructorId" uuid NOT NULL,
	"entryType" "ledger_entry_type" DEFAULT 'sale' NOT NULL,
	"revenueSource" "revenue_source" NOT NULL,
	"platformFeeRateBps" integer NOT NULL,
	"grossAmountPaisa" integer NOT NULL,
	"platformFeePaisa" integer NOT NULL,
	"creatorEarningsPaisa" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "purchaseId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "courseId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "instructorId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "entryType" "ledger_entry_type" DEFAULT 'sale' NOT NULL;
--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "revenueSource" "revenue_source" NOT NULL;
--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "platformFeeRateBps" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "grossAmountPaisa" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "platformFeePaisa" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "creatorEarningsPaisa" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lesson_assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lessonId" uuid NOT NULL,
	"type" "asset_type" NOT NULL,
	"provider" "asset_provider" NOT NULL,
	"role" "asset_role" DEFAULT 'primary' NOT NULL,
	"status" "asset_status" DEFAULT 'pending' NOT NULL,
	"externalId" text,
	"storageKey" text,
	"fileName" text,
	"mimeType" text,
	"fileSizeBytes" bigint,
	"downloadable" boolean DEFAULT false NOT NULL,
	"durationSeconds" integer,
	"startSeconds" integer,
	"order" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD COLUMN IF NOT EXISTS "lessonId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD COLUMN IF NOT EXISTS "type" "asset_type" NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD COLUMN IF NOT EXISTS "provider" "asset_provider" NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD COLUMN IF NOT EXISTS "role" "asset_role" DEFAULT 'primary' NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD COLUMN IF NOT EXISTS "status" "asset_status" DEFAULT 'pending' NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD COLUMN IF NOT EXISTS "externalId" text;
--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD COLUMN IF NOT EXISTS "storageKey" text;
--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD COLUMN IF NOT EXISTS "fileName" text;
--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD COLUMN IF NOT EXISTS "mimeType" text;
--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD COLUMN IF NOT EXISTS "fileSizeBytes" bigint;
--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD COLUMN IF NOT EXISTS "downloadable" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD COLUMN IF NOT EXISTS "durationSeconds" integer;
--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD COLUMN IF NOT EXISTS "startSeconds" integer;
--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD COLUMN IF NOT EXISTS "order" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_assets" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoice_sequences" (
	"fiscalYear" text PRIMARY KEY NOT NULL,
	"lastNumber" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoice_sequences" ADD COLUMN IF NOT EXISTS "fiscalYear" text PRIMARY KEY NOT NULL;
--> statement-breakpoint
ALTER TABLE "invoice_sequences" ADD COLUMN IF NOT EXISTS "lastNumber" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoiceNumber" text NOT NULL,
	"fiscalYear" text NOT NULL,
	"purchaseId" uuid NOT NULL,
	"buyerUserId" uuid NOT NULL,
	"buyerName" text NOT NULL,
	"buyerEmail" text NOT NULL,
	"buyerPan" text,
	"sellerName" text NOT NULL,
	"sellerPan" text,
	"lineItems" jsonb NOT NULL,
	"subtotalPaisa" integer NOT NULL,
	"vatRatePercent" integer,
	"vatAmountPaisa" integer,
	"totalPaisa" integer NOT NULL,
	"status" "invoice_status" DEFAULT 'issued' NOT NULL,
	"pdfR2Key" text,
	"emailedAt" timestamp with time zone,
	"delivery_attempts" integer DEFAULT 0 NOT NULL,
	"last_delivery_attempt_at" timestamp with time zone,
	"last_delivery_error" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoiceNumber_unique" UNIQUE("invoiceNumber"),
	CONSTRAINT "invoices_purchaseId_unique" UNIQUE("purchaseId")
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "invoiceNumber" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "fiscalYear" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "purchaseId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "buyerUserId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "buyerName" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "buyerEmail" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "buyerPan" text;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "sellerName" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "sellerPan" text;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "lineItems" jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "subtotalPaisa" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "vatRatePercent" integer;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "vatAmountPaisa" integer;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "totalPaisa" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "status" "invoice_status" DEFAULT 'issued' NOT NULL;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "pdfR2Key" text;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "emailedAt" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "delivery_attempts" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "last_delivery_attempt_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "last_delivery_error" text;
--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporterId" uuid NOT NULL,
	"targetType" "report_target_type" DEFAULT 'course' NOT NULL,
	"targetId" uuid NOT NULL,
	"courseId" uuid,
	"product_id" uuid,
	"reason" "report_reason" NOT NULL,
	"details" text,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"reviewedBy" uuid,
	"reviewedAt" timestamp with time zone,
	"adminNote" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "reporterId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "targetType" "report_target_type" DEFAULT 'course' NOT NULL;
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "targetId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "courseId" uuid;
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "product_id" uuid;
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "reason" "report_reason" NOT NULL;
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "details" text;
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "status" "report_status" DEFAULT 'pending' NOT NULL;
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "reviewedBy" uuid;
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "reviewedAt" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "adminNote" text;
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "reports" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refund_request_courses" (
	"refund_request_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	CONSTRAINT "refund_request_courses_refund_request_id_course_id_pk" PRIMARY KEY("refund_request_id","course_id")
);
--> statement-breakpoint
ALTER TABLE "refund_request_courses" ADD COLUMN IF NOT EXISTS "refund_request_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "refund_request_courses" ADD COLUMN IF NOT EXISTS "course_id" uuid NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "refund_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchaseId" uuid NOT NULL,
	"userId" uuid NOT NULL,
	"courseId" uuid NOT NULL,
	"reason" text,
	"completionPercentAtRequest" integer NOT NULL,
	"withinWindowAtRequest" boolean NOT NULL,
	"eligible" boolean NOT NULL,
	"status" "refund_request_status" DEFAULT 'pending' NOT NULL,
	"reviewedBy" uuid,
	"reviewedAt" timestamp with time zone,
	"adminNote" text,
	"processed_by" uuid,
	"processed_at" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "refund_requests" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "refund_requests" ADD COLUMN IF NOT EXISTS "purchaseId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "refund_requests" ADD COLUMN IF NOT EXISTS "userId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "refund_requests" ADD COLUMN IF NOT EXISTS "courseId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "refund_requests" ADD COLUMN IF NOT EXISTS "reason" text;
--> statement-breakpoint
ALTER TABLE "refund_requests" ADD COLUMN IF NOT EXISTS "completionPercentAtRequest" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "refund_requests" ADD COLUMN IF NOT EXISTS "withinWindowAtRequest" boolean NOT NULL;
--> statement-breakpoint
ALTER TABLE "refund_requests" ADD COLUMN IF NOT EXISTS "eligible" boolean NOT NULL;
--> statement-breakpoint
ALTER TABLE "refund_requests" ADD COLUMN IF NOT EXISTS "status" "refund_request_status" DEFAULT 'pending' NOT NULL;
--> statement-breakpoint
ALTER TABLE "refund_requests" ADD COLUMN IF NOT EXISTS "reviewedBy" uuid;
--> statement-breakpoint
ALTER TABLE "refund_requests" ADD COLUMN IF NOT EXISTS "reviewedAt" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "refund_requests" ADD COLUMN IF NOT EXISTS "adminNote" text;
--> statement-breakpoint
ALTER TABLE "refund_requests" ADD COLUMN IF NOT EXISTS "processed_by" uuid;
--> statement-breakpoint
ALTER TABLE "refund_requests" ADD COLUMN IF NOT EXISTS "processed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "refund_requests" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "refund_requests" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "discount_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"creator_id" uuid NOT NULL,
	"scopeType" "discount_scope" DEFAULT 'storewide' NOT NULL,
	"product_id" uuid,
	"discountType" "discount_type" NOT NULL,
	"amount" integer NOT NULL,
	"max_redemptions" integer,
	"max_redemptions_per_user" integer DEFAULT 1 NOT NULL,
	"redemption_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone,
	"status" "discount_code_status" DEFAULT 'active' NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "discount_codes" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "discount_codes" ADD COLUMN IF NOT EXISTS "code" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "discount_codes" ADD COLUMN IF NOT EXISTS "creator_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "discount_codes" ADD COLUMN IF NOT EXISTS "scopeType" "discount_scope" DEFAULT 'storewide' NOT NULL;
--> statement-breakpoint
ALTER TABLE "discount_codes" ADD COLUMN IF NOT EXISTS "product_id" uuid;
--> statement-breakpoint
ALTER TABLE "discount_codes" ADD COLUMN IF NOT EXISTS "discountType" "discount_type" NOT NULL;
--> statement-breakpoint
ALTER TABLE "discount_codes" ADD COLUMN IF NOT EXISTS "amount" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "discount_codes" ADD COLUMN IF NOT EXISTS "max_redemptions" integer;
--> statement-breakpoint
ALTER TABLE "discount_codes" ADD COLUMN IF NOT EXISTS "max_redemptions_per_user" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
ALTER TABLE "discount_codes" ADD COLUMN IF NOT EXISTS "redemption_count" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "discount_codes" ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "discount_codes" ADD COLUMN IF NOT EXISTS "status" "discount_code_status" DEFAULT 'active' NOT NULL;
--> statement-breakpoint
ALTER TABLE "discount_codes" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "discount_codes" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "discount_redemptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"discount_code_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"purchase_id" uuid NOT NULL,
	"amount_discounted_in_paisa" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "discount_redemptions" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "discount_redemptions" ADD COLUMN IF NOT EXISTS "discount_code_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "discount_redemptions" ADD COLUMN IF NOT EXISTS "user_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "discount_redemptions" ADD COLUMN IF NOT EXISTS "purchase_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "discount_redemptions" ADD COLUMN IF NOT EXISTS "amount_discounted_in_paisa" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "discount_redemptions" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "instructor_phone_otps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"instructor_id" uuid NOT NULL,
	"phone_number" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"consumed_at" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "instructor_phone_otps" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "instructor_phone_otps" ADD COLUMN IF NOT EXISTS "instructor_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "instructor_phone_otps" ADD COLUMN IF NOT EXISTS "phone_number" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "instructor_phone_otps" ADD COLUMN IF NOT EXISTS "code_hash" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "instructor_phone_otps" ADD COLUMN IF NOT EXISTS "expires_at" timestamp with time zone NOT NULL;
--> statement-breakpoint
ALTER TABLE "instructor_phone_otps" ADD COLUMN IF NOT EXISTS "attempts" integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE "instructor_phone_otps" ADD COLUMN IF NOT EXISTS "consumed_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "instructor_phone_otps" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lesson_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_questions" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_questions" ADD COLUMN IF NOT EXISTS "lesson_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_questions" ADD COLUMN IF NOT EXISTS "user_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_questions" ADD COLUMN IF NOT EXISTS "body" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_questions" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_questions" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lesson_question_replies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lesson_question_replies" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_question_replies" ADD COLUMN IF NOT EXISTS "question_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_question_replies" ADD COLUMN IF NOT EXISTS "user_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_question_replies" ADD COLUMN IF NOT EXISTS "body" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_question_replies" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "lesson_question_replies" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "product_tags" (
	"product_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "product_tags_product_id_tag_id_pk" PRIMARY KEY("product_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "product_tags" ADD COLUMN IF NOT EXISTS "product_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "product_tags" ADD COLUMN IF NOT EXISTS "tag_id" uuid NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "slug" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "tags" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "name" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "slug" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"rating" integer NOT NULL,
	"content" text,
	"user_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"is_hidden" boolean DEFAULT false NOT NULL,
	"instructor_reply" text,
	"instructor_reply_at" timestamp with time zone,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "course_reviews_user_id_course_id_unique" UNIQUE("user_id","course_id")
);
--> statement-breakpoint
ALTER TABLE "course_reviews" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "course_reviews" ADD COLUMN IF NOT EXISTS "rating" integer NOT NULL;
--> statement-breakpoint
ALTER TABLE "course_reviews" ADD COLUMN IF NOT EXISTS "content" text;
--> statement-breakpoint
ALTER TABLE "course_reviews" ADD COLUMN IF NOT EXISTS "user_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "course_reviews" ADD COLUMN IF NOT EXISTS "course_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "course_reviews" ADD COLUMN IF NOT EXISTS "is_hidden" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "course_reviews" ADD COLUMN IF NOT EXISTS "instructor_reply" text;
--> statement-breakpoint
ALTER TABLE "course_reviews" ADD COLUMN IF NOT EXISTS "instructor_reply_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "course_reviews" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "course_reviews" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "wishlist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD COLUMN IF NOT EXISTS "user_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD COLUMN IF NOT EXISTS "product_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "wishlist_items" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "support_ticket_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"is_admin_reply" boolean DEFAULT false NOT NULL,
	"content" text NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD COLUMN IF NOT EXISTS "ticket_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD COLUMN IF NOT EXISTS "author_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD COLUMN IF NOT EXISTS "is_admin_reply" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD COLUMN IF NOT EXISTS "content" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "support_ticket_messages" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "support_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"subject" text NOT NULL,
	"category" "support_ticket_category" DEFAULT 'other' NOT NULL,
	"status" "support_ticket_status" DEFAULT 'open' NOT NULL,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "user_id" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "subject" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "category" "support_ticket_category" DEFAULT 'other' NOT NULL;
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "status" "support_ticket_status" DEFAULT 'open' NOT NULL;
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "last_message_at" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "updatedAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "payment_events" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "payment_events" ADD COLUMN IF NOT EXISTS "purchaseId" uuid NOT NULL;
--> statement-breakpoint
ALTER TABLE "payment_events" ADD COLUMN IF NOT EXISTS "source" "payment_event_source" NOT NULL;
--> statement-breakpoint
ALTER TABLE "payment_events" ADD COLUMN IF NOT EXISTS "gateway" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "payment_events" ADD COLUMN IF NOT EXISTS "outcome" "payment_event_outcome" NOT NULL;
--> statement-breakpoint
ALTER TABLE "payment_events" ADD COLUMN IF NOT EXISTS "gatewayStatus" text;
--> statement-breakpoint
ALTER TABLE "payment_events" ADD COLUMN IF NOT EXISTS "amountInPaisa" integer;
--> statement-breakpoint
ALTER TABLE "payment_events" ADD COLUMN IF NOT EXISTS "detail" jsonb;
--> statement-breakpoint
ALTER TABLE "payment_events" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "storage_deletions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_key" text NOT NULL,
	"provider" "asset_provider" DEFAULT 'r2' NOT NULL,
	"reason" text NOT NULL,
	"delete_after" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "storage_deletions" ADD COLUMN IF NOT EXISTS "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL;
--> statement-breakpoint
ALTER TABLE "storage_deletions" ADD COLUMN IF NOT EXISTS "storage_key" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "storage_deletions" ADD COLUMN IF NOT EXISTS "provider" "asset_provider" DEFAULT 'r2' NOT NULL;
--> statement-breakpoint
ALTER TABLE "storage_deletions" ADD COLUMN IF NOT EXISTS "reason" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "storage_deletions" ADD COLUMN IF NOT EXISTS "delete_after" timestamp with time zone NOT NULL;
--> statement-breakpoint
ALTER TABLE "storage_deletions" ADD COLUMN IF NOT EXISTS "createdAt" timestamp with time zone DEFAULT now() NOT NULL;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_products_courseId_productId_pk' AND conrelid = '"public"."course_products"'::regclass) THEN
    ALTER TABLE "course_products" ADD CONSTRAINT "course_products_courseId_productId_pk" PRIMARY KEY("courseId","productId");
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchases_idempotencyKey_unique' AND conrelid = '"public"."purchases"'::regclass) THEN
    ALTER TABLE "purchases" ADD CONSTRAINT "purchases_idempotencyKey_unique" UNIQUE("idempotencyKey");
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_token_unique' AND conrelid = '"public"."session"'::regclass) THEN
    ALTER TABLE "session" ADD CONSTRAINT "session_token_unique" UNIQUE("token");
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_email_unique' AND conrelid = '"public"."user"'::regclass) THEN
    ALTER TABLE "user" ADD CONSTRAINT "user_email_unique" UNIQUE("email");
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_username_unique' AND conrelid = '"public"."user"'::regclass) THEN
    ALTER TABLE "user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_course_access_userId_courseId_pk' AND conrelid = '"public"."user_course_access"'::regclass) THEN
    ALTER TABLE "user_course_access" ADD CONSTRAINT "user_course_access_userId_courseId_pk" PRIMARY KEY("userId","courseId");
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_lesson_complete_userId_lessonId_pk' AND conrelid = '"public"."user_lesson_complete"'::regclass) THEN
    ALTER TABLE "user_lesson_complete" ADD CONSTRAINT "user_lesson_complete_userId_lessonId_pk" PRIMARY KEY("userId","lessonId");
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'instructors_userId_unique' AND conrelid = '"public"."instructors"'::regclass) THEN
    ALTER TABLE "instructors" ADD CONSTRAINT "instructors_userId_unique" UNIQUE("userId");
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'instructors_handle_unique' AND conrelid = '"public"."instructors"'::regclass) THEN
    ALTER TABLE "instructors" ADD CONSTRAINT "instructors_handle_unique" UNIQUE("handle");
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'instructors_phone_number_unique' AND conrelid = '"public"."instructors"'::regclass) THEN
    ALTER TABLE "instructors" ADD CONSTRAINT "instructors_phone_number_unique" UNIQUE("phone_number");
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'certificates_certificateCode_unique' AND conrelid = '"public"."certificates"'::regclass) THEN
    ALTER TABLE "certificates" ADD CONSTRAINT "certificates_certificateCode_unique" UNIQUE("certificateCode");
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_invoiceNumber_unique' AND conrelid = '"public"."invoices"'::regclass) THEN
    ALTER TABLE "invoices" ADD CONSTRAINT "invoices_invoiceNumber_unique" UNIQUE("invoiceNumber");
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_purchaseId_unique' AND conrelid = '"public"."invoices"'::regclass) THEN
    ALTER TABLE "invoices" ADD CONSTRAINT "invoices_purchaseId_unique" UNIQUE("purchaseId");
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refund_request_courses_refund_request_id_course_id_pk' AND conrelid = '"public"."refund_request_courses"'::regclass) THEN
    ALTER TABLE "refund_request_courses" ADD CONSTRAINT "refund_request_courses_refund_request_id_course_id_pk" PRIMARY KEY("refund_request_id","course_id");
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_tags_product_id_tag_id_pk' AND conrelid = '"public"."product_tags"'::regclass) THEN
    ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_tag_id_pk" PRIMARY KEY("product_id","tag_id");
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tags_slug_unique' AND conrelid = '"public"."tags"'::regclass) THEN
    ALTER TABLE "tags" ADD CONSTRAINT "tags_slug_unique" UNIQUE("slug");
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'categories_slug_unique' AND conrelid = '"public"."categories"'::regclass) THEN
    ALTER TABLE "categories" ADD CONSTRAINT "categories_slug_unique" UNIQUE("slug");
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_reviews_user_id_course_id_unique' AND conrelid = '"public"."course_reviews"'::regclass) THEN
    ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_user_id_course_id_unique" UNIQUE("user_id","course_id");
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'courses_author_id_user_id_fk' AND conrelid = '"public"."courses"'::regclass) THEN
    ALTER TABLE "courses" ADD CONSTRAINT "courses_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_products_courseId_courses_id_fk' AND conrelid = '"public"."course_products"'::regclass) THEN
    ALTER TABLE "course_products" ADD CONSTRAINT "course_products_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_products_productId_products_id_fk' AND conrelid = '"public"."course_products"'::regclass) THEN
    ALTER TABLE "course_products" ADD CONSTRAINT "course_products_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_sections_courseId_courses_id_fk' AND conrelid = '"public"."course_sections"'::regclass) THEN
    ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lessons_sectionId_course_sections_id_fk' AND conrelid = '"public"."lessons"'::regclass) THEN
    ALTER TABLE "lessons" ADD CONSTRAINT "lessons_sectionId_course_sections_id_fk" FOREIGN KEY ("sectionId") REFERENCES "public"."course_sections"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_category_id_categories_id_fk' AND conrelid = '"public"."products"'::regclass) THEN
    ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_author_id_user_id_fk' AND conrelid = '"public"."products"'::regclass) THEN
    ALTER TABLE "products" ADD CONSTRAINT "products_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_reviewed_by_user_id_fk' AND conrelid = '"public"."products"'::regclass) THEN
    ALTER TABLE "products" ADD CONSTRAINT "products_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchases_userId_user_id_fk' AND conrelid = '"public"."purchases"'::regclass) THEN
    ALTER TABLE "purchases" ADD CONSTRAINT "purchases_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchases_productId_products_id_fk' AND conrelid = '"public"."purchases"'::regclass) THEN
    ALTER TABLE "purchases" ADD CONSTRAINT "purchases_productId_products_id_fk" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchases_referredByInstructorId_user_id_fk' AND conrelid = '"public"."purchases"'::regclass) THEN
    ALTER TABLE "purchases" ADD CONSTRAINT "purchases_referredByInstructorId_user_id_fk" FOREIGN KEY ("referredByInstructorId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'purchases_discount_code_id_discount_codes_id_fk' AND conrelid = '"public"."purchases"'::regclass) THEN
    ALTER TABLE "purchases" ADD CONSTRAINT "purchases_discount_code_id_discount_codes_id_fk" FOREIGN KEY ("discount_code_id") REFERENCES "public"."discount_codes"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'account_user_id_user_id_fk' AND conrelid = '"public"."account"'::regclass) THEN
    ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'session_user_id_user_id_fk' AND conrelid = '"public"."session"'::regclass) THEN
    ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_course_access_userId_user_id_fk' AND conrelid = '"public"."user_course_access"'::regclass) THEN
    ALTER TABLE "user_course_access" ADD CONSTRAINT "user_course_access_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_course_access_courseId_courses_id_fk' AND conrelid = '"public"."user_course_access"'::regclass) THEN
    ALTER TABLE "user_course_access" ADD CONSTRAINT "user_course_access_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_lesson_complete_userId_user_id_fk' AND conrelid = '"public"."user_lesson_complete"'::regclass) THEN
    ALTER TABLE "user_lesson_complete" ADD CONSTRAINT "user_lesson_complete_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_lesson_complete_lessonId_lessons_id_fk' AND conrelid = '"public"."user_lesson_complete"'::regclass) THEN
    ALTER TABLE "user_lesson_complete" ADD CONSTRAINT "user_lesson_complete_lessonId_lessons_id_fk" FOREIGN KEY ("lessonId") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'instructors_userId_user_id_fk' AND conrelid = '"public"."instructors"'::regclass) THEN
    ALTER TABLE "instructors" ADD CONSTRAINT "instructors_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'certificates_userId_user_id_fk' AND conrelid = '"public"."certificates"'::regclass) THEN
    ALTER TABLE "certificates" ADD CONSTRAINT "certificates_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'certificates_courseId_courses_id_fk' AND conrelid = '"public"."certificates"'::regclass) THEN
    ALTER TABLE "certificates" ADD CONSTRAINT "certificates_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payouts_instructorId_user_id_fk' AND conrelid = '"public"."payouts"'::regclass) THEN
    ALTER TABLE "payouts" ADD CONSTRAINT "payouts_instructorId_user_id_fk" FOREIGN KEY ("instructorId") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ledger_entries_purchaseId_purchases_id_fk' AND conrelid = '"public"."ledger_entries"'::regclass) THEN
    ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_purchaseId_purchases_id_fk" FOREIGN KEY ("purchaseId") REFERENCES "public"."purchases"("id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ledger_entries_courseId_courses_id_fk' AND conrelid = '"public"."ledger_entries"'::regclass) THEN
    ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ledger_entries_instructorId_user_id_fk' AND conrelid = '"public"."ledger_entries"'::regclass) THEN
    ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_instructorId_user_id_fk" FOREIGN KEY ("instructorId") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lesson_assets_lessonId_lessons_id_fk' AND conrelid = '"public"."lesson_assets"'::regclass) THEN
    ALTER TABLE "lesson_assets" ADD CONSTRAINT "lesson_assets_lessonId_lessons_id_fk" FOREIGN KEY ("lessonId") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_purchaseId_purchases_id_fk' AND conrelid = '"public"."invoices"'::regclass) THEN
    ALTER TABLE "invoices" ADD CONSTRAINT "invoices_purchaseId_purchases_id_fk" FOREIGN KEY ("purchaseId") REFERENCES "public"."purchases"("id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invoices_buyerUserId_user_id_fk' AND conrelid = '"public"."invoices"'::regclass) THEN
    ALTER TABLE "invoices" ADD CONSTRAINT "invoices_buyerUserId_user_id_fk" FOREIGN KEY ("buyerUserId") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reports_reporterId_user_id_fk' AND conrelid = '"public"."reports"'::regclass) THEN
    ALTER TABLE "reports" ADD CONSTRAINT "reports_reporterId_user_id_fk" FOREIGN KEY ("reporterId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reports_courseId_courses_id_fk' AND conrelid = '"public"."reports"'::regclass) THEN
    ALTER TABLE "reports" ADD CONSTRAINT "reports_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reports_product_id_products_id_fk' AND conrelid = '"public"."reports"'::regclass) THEN
    ALTER TABLE "reports" ADD CONSTRAINT "reports_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reports_reviewedBy_user_id_fk' AND conrelid = '"public"."reports"'::regclass) THEN
    ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewedBy_user_id_fk" FOREIGN KEY ("reviewedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refund_request_courses_refund_request_id_refund_requests_id_fk' AND conrelid = '"public"."refund_request_courses"'::regclass) THEN
    ALTER TABLE "refund_request_courses" ADD CONSTRAINT "refund_request_courses_refund_request_id_refund_requests_id_fk" FOREIGN KEY ("refund_request_id") REFERENCES "public"."refund_requests"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refund_request_courses_course_id_courses_id_fk' AND conrelid = '"public"."refund_request_courses"'::regclass) THEN
    ALTER TABLE "refund_request_courses" ADD CONSTRAINT "refund_request_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refund_requests_purchaseId_purchases_id_fk' AND conrelid = '"public"."refund_requests"'::regclass) THEN
    ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_purchaseId_purchases_id_fk" FOREIGN KEY ("purchaseId") REFERENCES "public"."purchases"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refund_requests_userId_user_id_fk' AND conrelid = '"public"."refund_requests"'::regclass) THEN
    ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refund_requests_courseId_courses_id_fk' AND conrelid = '"public"."refund_requests"'::regclass) THEN
    ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_courseId_courses_id_fk" FOREIGN KEY ("courseId") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refund_requests_reviewedBy_user_id_fk' AND conrelid = '"public"."refund_requests"'::regclass) THEN
    ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_reviewedBy_user_id_fk" FOREIGN KEY ("reviewedBy") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'refund_requests_processed_by_user_id_fk' AND conrelid = '"public"."refund_requests"'::regclass) THEN
    ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_processed_by_user_id_fk" FOREIGN KEY ("processed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'discount_codes_creator_id_user_id_fk' AND conrelid = '"public"."discount_codes"'::regclass) THEN
    ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_creator_id_user_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'discount_codes_product_id_products_id_fk' AND conrelid = '"public"."discount_codes"'::regclass) THEN
    ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'discount_redemptions_discount_code_id_discount_codes_id_fk' AND conrelid = '"public"."discount_redemptions"'::regclass) THEN
    ALTER TABLE "discount_redemptions" ADD CONSTRAINT "discount_redemptions_discount_code_id_discount_codes_id_fk" FOREIGN KEY ("discount_code_id") REFERENCES "public"."discount_codes"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'discount_redemptions_user_id_user_id_fk' AND conrelid = '"public"."discount_redemptions"'::regclass) THEN
    ALTER TABLE "discount_redemptions" ADD CONSTRAINT "discount_redemptions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'discount_redemptions_purchase_id_purchases_id_fk' AND conrelid = '"public"."discount_redemptions"'::regclass) THEN
    ALTER TABLE "discount_redemptions" ADD CONSTRAINT "discount_redemptions_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'instructor_phone_otps_instructor_id_instructors_id_fk' AND conrelid = '"public"."instructor_phone_otps"'::regclass) THEN
    ALTER TABLE "instructor_phone_otps" ADD CONSTRAINT "instructor_phone_otps_instructor_id_instructors_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."instructors"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lesson_questions_lesson_id_lessons_id_fk' AND conrelid = '"public"."lesson_questions"'::regclass) THEN
    ALTER TABLE "lesson_questions" ADD CONSTRAINT "lesson_questions_lesson_id_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lesson_questions_user_id_user_id_fk' AND conrelid = '"public"."lesson_questions"'::regclass) THEN
    ALTER TABLE "lesson_questions" ADD CONSTRAINT "lesson_questions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lesson_question_replies_question_id_lesson_questions_id_fk' AND conrelid = '"public"."lesson_question_replies"'::regclass) THEN
    ALTER TABLE "lesson_question_replies" ADD CONSTRAINT "lesson_question_replies_question_id_lesson_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."lesson_questions"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lesson_question_replies_user_id_user_id_fk' AND conrelid = '"public"."lesson_question_replies"'::regclass) THEN
    ALTER TABLE "lesson_question_replies" ADD CONSTRAINT "lesson_question_replies_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_tags_product_id_products_id_fk' AND conrelid = '"public"."product_tags"'::regclass) THEN
    ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_tags_tag_id_tags_id_fk' AND conrelid = '"public"."product_tags"'::regclass) THEN
    ALTER TABLE "product_tags" ADD CONSTRAINT "product_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_reviews_user_id_user_id_fk' AND conrelid = '"public"."course_reviews"'::regclass) THEN
    ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'course_reviews_course_id_courses_id_fk' AND conrelid = '"public"."course_reviews"'::regclass) THEN
    ALTER TABLE "course_reviews" ADD CONSTRAINT "course_reviews_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wishlist_items_user_id_user_id_fk' AND conrelid = '"public"."wishlist_items"'::regclass) THEN
    ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'wishlist_items_product_id_products_id_fk' AND conrelid = '"public"."wishlist_items"'::regclass) THEN
    ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_ticket_messages_ticket_id_support_tickets_id_fk' AND conrelid = '"public"."support_ticket_messages"'::regclass) THEN
    ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_ticket_id_support_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_ticket_messages_author_id_user_id_fk' AND conrelid = '"public"."support_ticket_messages"'::regclass) THEN
    ALTER TABLE "support_ticket_messages" ADD CONSTRAINT "support_ticket_messages_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_user_id_user_id_fk' AND conrelid = '"public"."support_tickets"'::regclass) THEN
    ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'payment_events_purchaseId_purchases_id_fk' AND conrelid = '"public"."payment_events"'::regclass) THEN
    ALTER TABLE "payment_events" ADD CONSTRAINT "payment_events_purchaseId_purchases_id_fk" FOREIGN KEY ("purchaseId") REFERENCES "public"."purchases"("id") ON DELETE restrict ON UPDATE no action;
  END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_search_vector_idx" ON "products" USING gin ("search_vector");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "gateway_transaction_unique_idx" ON "purchases" USING btree ("gateway","gatewayTransactionId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "purchases_status_created_at_idx" ON "purchases" USING btree ("status","createdAt");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "user_course_unique_idx" ON "certificates" USING btree ("userId","courseId");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "purchase_course_entry_type_unique_idx" ON "ledger_entries" USING btree ("purchaseId","courseId","entryType");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "refund_request_courses_course_idx" ON "refund_request_courses" USING btree ("course_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "refund_requests_open_purchase_idx" ON "refund_requests" USING btree ("purchaseId") WHERE "refund_requests"."status" in ('pending', 'approved', 'processed');
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "discount_codes_code_unique" ON "discount_codes" USING btree ("code");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "course_reviews_course_id_idx" ON "course_reviews" USING btree ("course_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "wishlist_items_user_id_product_id_unique" ON "wishlist_items" USING btree ("user_id","product_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wishlist_items_product_id_idx" ON "wishlist_items" USING btree ("product_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "support_ticket_messages_ticket_id_idx" ON "support_ticket_messages" USING btree ("ticket_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "support_tickets_user_id_idx" ON "support_tickets" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "support_tickets_status_idx" ON "support_tickets" USING btree ("status");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "payment_events_purchase_id_idx" ON "payment_events" USING btree ("purchaseId");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "storage_deletions_delete_after_idx" ON "storage_deletions" USING btree ("delete_after");
