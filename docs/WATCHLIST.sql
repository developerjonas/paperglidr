-- Daily watchlist for the first 30 days (docs/GTM_PLAN.md §3.7).
-- Run against the production database with a read-only user. Every query
-- is read-only. Times are UTC (Nepal is UTC+5:45).
-- Money columns are in paisa (÷100 for NPR), except products."priceInRupees".


-- 1. Purchases stuck in "pending" for more than 1 hour.
--    Should be ~0: the reconciliation cron re-checks every 5 minutes.
--    Anything here means paid-but-no-access risk: open /admin/purchases
--    and use "Re-check payment".
SELECT p.id, p.gateway, p."pricePaidInPaisa" / 100.0 AS npr, p."createdAt",
       now() - p."createdAt" AS age, u.email
FROM purchases p
JOIN "user" u ON u.id = p."userId"
WHERE p.status = 'pending'
  AND p."createdAt" < now() - interval '1 hour'
ORDER BY p."createdAt";


-- 2. Disputed purchases (gateway said paid, but the amount didn't match, or
--    the transaction id was already used), count per gateway.
SELECT gateway, count(*) AS disputed, min("createdAt") AS oldest
FROM purchases
WHERE status = 'disputed'
GROUP BY gateway
ORDER BY disputed DESC;


-- 3. Initiated -> completed rate, per gateway per day (last 14 days).
--    Free enrollments (gateway 'free') are left out.
SELECT date_trunc('day', "createdAt")::date AS day, gateway,
       count(*) AS initiated,
       count(*) FILTER (WHERE status IN ('completed', 'refunded')) AS completed,
       round(100.0 * count(*) FILTER (WHERE status IN ('completed', 'refunded'))
             / nullif(count(*), 0), 1) AS completion_pct
FROM purchases
WHERE gateway <> 'free'
  AND "createdAt" >= now() - interval '14 days'
GROUP BY 1, 2
ORDER BY 1 DESC, 2;


-- 4. Verify-call errors per gateway per day (last 7 days).
--    Latency isn't stored in the database: see Sentry (area:payments,
--    payment_event:gateway_error / verify_error) — docs/OBSERVABILITY.md.
SELECT date_trunc('day', "createdAt")::date AS day, gateway, source,
       count(*) AS errors
FROM payment_events
WHERE outcome = 'error'
  AND "createdAt" >= now() - interval '7 days'
GROUP BY 1, 2, 3
ORDER BY 1 DESC, errors DESC;


-- 5. /deliver 4xx/5xx and video-related support tickets.
--    Delivery responses aren't stored in the database: 5xx are in Sentry
--    (area:deliver). This lists technical support tickets from the last
--    7 days that mention video/playback.
SELECT t.id, t.subject, t.status, t."createdAt", u.email
FROM support_tickets t
JOIN "user" u ON u.id = t.user_id
WHERE t.category = 'technical'
  AND t."createdAt" >= now() - interval '7 days'
  AND t.subject ~* '(video|play|buffer|load|lesson)'
ORDER BY t."createdAt" DESC;


-- 6a. Refund requests waiting for a decision, oldest first
--     (the refund window is 7 days, so answer these quickly).
SELECT r.id, r."createdAt", now() - r."createdAt" AS age,
       p."productDetails"->>'name' AS product, p.gateway,
       p."pricePaidInPaisa" / 100.0 AS npr, r."completionPercentAtRequest"
FROM refund_requests r
JOIN purchases p ON p.id = r."purchaseId"
WHERE r.status = 'pending'
ORDER BY r."createdAt";

-- 6b. Approved refunds whose money hasn't been marked returned yet.
SELECT r.id, r."reviewedAt", now() - r."reviewedAt" AS since_approved,
       p.gateway, p."gatewayTransactionId", p."pricePaidInPaisa" / 100.0 AS npr
FROM refund_requests r
JOIN purchases p ON p.id = r."purchaseId"
WHERE r.status = 'approved'
ORDER BY r."reviewedAt";

-- 6c. Refund rate by product (last 30 days). Flag anything over 10%.
SELECT pr.id, pr.name,
       count(*) FILTER (WHERE pu.status IN ('completed', 'refunded')) AS sales,
       count(*) FILTER (WHERE pu.status = 'refunded') AS refunded,
       round(100.0 * count(*) FILTER (WHERE pu.status = 'refunded')
             / nullif(count(*) FILTER (WHERE pu.status IN ('completed', 'refunded')), 0), 1) AS refund_pct
FROM purchases pu
JOIN products pr ON pr.id = pu."productId"
WHERE pu."createdAt" >= now() - interval '30 days'
  AND pu."pricePaidInPaisa" > 0
GROUP BY pr.id, pr.name
HAVING count(*) FILTER (WHERE pu.status IN ('completed', 'refunded')) > 0
ORDER BY refund_pct DESC NULLS LAST, sales DESC;


-- 7. Payout requests waiting, and their age.
SELECT po.id, u.name, u.email, po."amountPaisa" / 100.0 AS npr,
       po.payout_method, po."createdAt", now() - po."createdAt" AS age
FROM payouts po
JOIN "user" u ON u.id = po."instructorId"
WHERE po.status = 'requested'
ORDER BY po."createdAt";


-- 8. Products waiting in review, and their age.
SELECT pr.id, pr.name, u.email AS creator, pr.submitted_for_review_at,
       now() - pr.submitted_for_review_at AS waiting
FROM products pr
JOIN "user" u ON u.id = pr.author_id
WHERE pr.status = 'pending_review'
ORDER BY pr.submitted_for_review_at;


-- 9. New reports (last 24 hours), and everything still open.
SELECT rp.id, rp."targetType", rp."targetId", rp.reason, rp.status,
       rp."createdAt", (rp."createdAt" >= now() - interval '1 day') AS is_new
FROM reports rp
WHERE rp.status IN ('pending', 'reviewing')
ORDER BY rp."createdAt" DESC;


-- 10a. Signups -> first paid purchase (users who signed up in the last 30
--      days, by signup week).
SELECT date_trunc('week', u.created_at)::date AS signup_week,
       count(*) AS signups,
       count(*) FILTER (WHERE EXISTS (
         SELECT 1 FROM purchases p
         WHERE p."userId" = u.id AND p.status = 'completed' AND p."pricePaidInPaisa" > 0
       )) AS bought,
       round(100.0 * count(*) FILTER (WHERE EXISTS (
         SELECT 1 FROM purchases p
         WHERE p."userId" = u.id AND p.status = 'completed' AND p."pricePaidInPaisa" > 0
       )) / nullif(count(*), 0), 1) AS conversion_pct
FROM "user" u
WHERE u.created_at >= now() - interval '30 days'
GROUP BY 1
ORDER BY 1 DESC;

-- 10b. Share of paid purchases that came through a creator's ?ref= link
--      (last 30 days).
SELECT count(*) AS paid_purchases,
       count(*) FILTER (WHERE "referredByInstructorId" IS NOT NULL) AS via_ref,
       round(100.0 * count(*) FILTER (WHERE "referredByInstructorId" IS NOT NULL)
             / nullif(count(*), 0), 1) AS via_ref_pct
FROM purchases
WHERE status = 'completed'
  AND "pricePaidInPaisa" > 0
  AND "createdAt" >= now() - interval '30 days';


-- 11a. Top-selling creators (last 30 days), by their share of sales.
SELECT u.id, u.name, u.email,
       count(DISTINCT le."purchaseId") AS sales,
       sum(le."creatorEarningsPaisa") / 100.0 AS earnings_npr
FROM ledger_entries le
JOIN "user" u ON u.id = le."instructorId"
WHERE le."createdAt" >= now() - interval '30 days'
GROUP BY u.id, u.name, u.email
ORDER BY earnings_npr DESC
LIMIT 20;

-- 11b. Creators with a live product and zero sales ever (give them a
--      check-in call).
SELECT u.id, u.name, u.email, count(pr.id) AS live_products,
       min(pr."createdAt") AS first_product
FROM products pr
JOIN "user" u ON u.id = pr.author_id
WHERE pr.status = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM ledger_entries le
    WHERE le."instructorId" = u.id AND le."entryType" = 'sale'
  )
GROUP BY u.id, u.name, u.email
ORDER BY first_product;
