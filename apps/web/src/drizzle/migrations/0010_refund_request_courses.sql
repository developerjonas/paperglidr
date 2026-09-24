CREATE TABLE "refund_request_courses" (
	"refund_request_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	CONSTRAINT "refund_request_courses_refund_request_id_course_id_pk" PRIMARY KEY("refund_request_id","course_id")
);
--> statement-breakpoint
ALTER TABLE "refund_request_courses" ADD CONSTRAINT "refund_request_courses_refund_request_id_refund_requests_id_fk" FOREIGN KEY ("refund_request_id") REFERENCES "public"."refund_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refund_request_courses" ADD CONSTRAINT "refund_request_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "refund_request_courses_course_idx" ON "refund_request_courses" USING btree ("course_id");--> statement-breakpoint
-- Hand-added backfill: existing requests get every course of their purchase's
-- product (plus the course they stored, in case the product has changed since).
INSERT INTO "refund_request_courses" ("refund_request_id", "course_id")
SELECT rr."id", cp."courseId"
FROM "refund_requests" rr
JOIN "purchases" p ON p."id" = rr."purchaseId"
JOIN "course_products" cp ON cp."productId" = p."productId"
UNION
SELECT rr."id", rr."courseId" FROM "refund_requests" rr
ON CONFLICT DO NOTHING;
