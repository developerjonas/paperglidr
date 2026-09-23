# PaperGlidr Repo Audit

_Audited 2026-09-23 at commit `7d54455` (branch `main`). Every finding below comes from reading the code. Folder names alone were not trusted. Paths are relative to the repo root unless they start with `src/`, which means `apps/web/src/`._

## TL;DR

The product surface is big: courses, bundles, lesson assets, Q&A, reviews, wishlist, discounts, certificates, support tickets, invoices, ledger and payouts are all written. Most of the domain logic is careful: an append-only ledger, status-guarded state transitions, idempotency keys and snapshot fields.

**It is not launchable yet.** The blockers are concentrated in a few places:

1. **The admin area has no authorization.** Any signed-in user can open `/admin/*`, including payouts with instructors' bank details.
2. **Payments only confirm if the buyer's browser comes back.** There are no callback routes and no reconciliation, sandbox URLs are hardcoded fallbacks, Khalti has no amount check, and the 100%-discount path is broken.
3. **The migrations are from the Stripe era.** They cover 12 of about 32 tables, so a fresh production DB cannot be created from them.
4. **R2 env var mismatch.** `R2_BUCKET` vs `R2_BUCKET_NAME` breaks every upload, video/PDF delivery and invoice PDF.
5. **Uploaded preview lessons don't play for non-buyers**, and authors can't play their own uploads.
6. **The build does not pass.** The web ESLint config is invalid, landing has 23 lint errors, turbo strips env vars, and the build needs a live DB.
7. **Legal pages are incomplete.** There's no privacy or refund policy, and the existing pages contain placeholders and mangled emails.

## Scorecard

| Area | Status | One-line reason |
|---|---|---|
| Auth (Better Auth) | PARTIAL | Works for Google/GitHub; no email UI; post-login redirect ignored; config not env-validated |
| Authorization / admin | **MISSING** | `/admin/**` has no role check; `revokeAccess` callable by any user |
| Courses / sections | DONE | CRUD + ownership permissions + creation cap |
| Lessons + assets | PARTIAL | R2 upload works (once env fixed); preview/author playback broken; no upload confirmation |
| Products / publishing | DONE | Publish gate (description, preview video, live cap by phone verification) |
| Purchases / payments | PARTIAL | Gateway clients exist; no callbacks, reconciliation, mode flag or gateway hiding |
| Ledger / commission | PARTIAL | Correct append-only sales; refund reversal never called |
| Payouts | PARTIAL | Manual request → admin marks paid; no refund-window hold; race on balance |
| Refunds | **MISSING (in practice)** | UI never rendered; eligibility uses wrong ID; no admin queue |
| Reports / moderation | **MISSING (in practice)** | `ReportButton` never rendered; no admin page; no review state |
| Certificates + QR verify | DONE | Auto-issue on completion, public `/verify/[code]`, revocation |
| Instructor onboarding | DONE | Profile, handle, SMS OTP phone verification, `/teach` gate |
| Student flow | PARTIAL | Browse/buy/watch/progress work; product page has hardcoded instructor + fake discount |
| Drizzle migrations | **MISSING** | Single Stripe-era migration; schema drifted (built with `db:push`) |
| Legal pages | PARTIAL | ToS/DMCA/Content exist with placeholders; privacy & refund policy missing |
| Env / config | PARTIAL | No `.env.example`; ~25 vars unvalidated; turbo strict env drops most |
| Build / lint / typecheck | **FAILING** | See [Build & lint results](#build--lint--typecheck-results) |

---

## 1. Auth (Better Auth): PARTIAL

**What works**
- The server config is in `src/lib/auth.ts`: a Drizzle adapter, UUID IDs, Google and GitHub social providers, the `bearer()` plugin for the mobile API, a `role` additional field with `input: false` so users can't set it, and rate limiting.
- The handler lives at `src/app/api/auth/[...better-auth]/route.ts`. The client is `src/lib/auth-client.ts`.
- `src/services/auth.ts` (the renamed `clerk.ts`) holds `getCurrentUser()`, which reads the session and loads the DB user through a cached `getUser()`. This is the real auth layer used by pages and actions.
- `src/middleware.ts` does a cookie-presence gate on `/account`, `/certificates`, `/purchases`, `/teach` and `/admin`, plus `?ref=` referral cookie capture.
- The Better Auth tables (`user`, `session`, `account`, `verification`) are in `src/drizzle/schema/user.ts`.

**Gaps**
- The sign-in and sign-up pages (`src/app/(auth)/sign-in/[[...sign-in]]/page.tsx`, `sign-up/...`) only call `signIn.social`. `emailAndPassword.enabled: true` is set in the server config, but there's no email form, no password reset and no email verification (`requireEmailVerification` is commented out).
- **`callbackURL: "/"` is hardcoded** (sign-in `page.tsx:17,23`). The `?redirectTo=` set by `middleware.ts:39` and by `products/[productId]/purchase/page.tsx:60` is ignored, so buyers who sign in mid-checkout land on the homepage.
- `auth.ts` reads `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID/SECRET` and `GITHUB_CLIENT_ID/SECRET` directly from `process.env` with `as string`, and none of them are in `src/data/env/server.ts`. If the GitHub vars are missing, the provider registers with an empty ID.
- `trustedOrigins` and `crossSubDomainCookies.domain: ".paperglidr.com"` are hardcoded (`auth.ts:24-34`). There's no staging or preview-deploy origin.
- `auth-client.ts:4` silently falls back to `http://localhost:3001`.
- `rateLimit.storage: "memory"` is per-instance on serverless, so it offers almost no protection on Vercel.
- `src/services/auth.ts:52` runs `console.log("Called getUser for ID:", id)` on every cache miss. That's noise and a minor PII leak into logs.

**Clerk and Stripe leftovers** (flagged per the brief; `services/clerk.ts` is already renamed)
| Leftover | Location |
|---|---|
| Clerk JWT/metadata global type overrides | `src/data/typeOverrides/clerk.d.ts` |
| `svix` dependency (Clerk webhook verifier), unused | `apps/web/package.json` |
| Comment "in your services/clerk.ts" | `src/features/wishlist/permissions/wishlist.ts:5` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `src/data/env/client.ts:6-11`, `turbo.json` |
| `STRIPE_SECRET_KEY`, `DATABASE_URL` (unused) | `turbo.json` `build.env` |
| Entire file commented out (Stripe PPP coupons) | `src/data/pppCoupons.ts` |
| Stripe-era columns `priceInDollars`, `pricePaidInCents`, `stripeSessionId` | `src/drizzle/migrations/0000_faithful_rogue.sql:49,58,63` |

## 2. Authorization: P0 gaps

- **The admin area is open to any signed-in user.** `src/app/admin/layout.tsx` only renders a navbar. None of these pages check the role: `admin/page.tsx`, `admin/revenue`, `admin/payouts`, `admin/support`, `admin/support/[ticketId]`, `admin/categories`, `admin/categories/new`. `admin/reviews` calls `getCurrentUser` but only uses it for actions.
  - `canAccessAdminPages` (`src/permissions/general.ts:5`) is never called from `src/app/`.
  - The middleware only checks that a cookie exists.
  - What leaks: platform revenue, **pending payouts including `bankDetailsSnapshot`**, and every user's support ticket contents.
  - The build output confirms these pages don't read the session: `/admin/payouts` and `/admin/revenue` are **statically prerendered at build time**, so the data is baked into the page and goes stale as well.
  - Most mutations are gated in their actions: payouts (`canManagePayouts`), categories, review hiding, ticket status.
- **`revokeAccess` has no ownership or admin check** (`src/features/purchases/actions/purchases.ts:302-341`). It only requires a session. Because it's an exported server action, any signed-in user can call it with any `purchaseId`: it deletes the buyer's course access and marks the purchase `refunded`. It's also wired into `PurchaseTable`, which is rendered on the instructor page `/teach/sales` (`src/app/(consumer)/teach/sales/page.tsx:36`), so instructors can revoke their buyers' access. It doesn't reverse the ledger, so the instructor keeps the earnings.
- **`confirmPurchase` has no auth check** (`purchases.ts:189`). It's low risk because it only re-verifies with the gateway, but it's an open server action that triggers outbound gateway calls for any purchase ID.
- **Discount scoping bug** (`src/features/discounts/lib/validateDiscountCode.ts:41-44`). A `storewide` code is never checked against the product's creator. Creator A can make a 100%-off storewide code and redeem it on creator B's product. The flaw is acknowledged in an `ADJUST` comment. It's only masked today because the zero-price checkout path is broken (§6).

## 3. Feature folders

| Folder | actions | db | permissions | schemas | Verdict / notes |
|---|---|---|---|---|---|
| `courses` | ✅ | ✅ (+cache, userCourseAccess) | ✅ | ✅ | DONE. Creation cap in `lib/canCreateCourse.ts`: 1 course unverified, 3 phone-verified (counts all courses, since courses have no draft state) |
| `courseSections` | ✅ | ✅ | ✅ | ✅ | DONE. Public/private sections, sortable |
| `lessons` | ✅ (lessons, lessonAssets, userLessonComplete) | ✅ | ✅ | ✅ | PARTIAL. See §5 Video |
| `products` | ✅ | ✅ | ✅ | ⚠️ folder is `schema/` not `schemas/` | DONE. Publish gate `lib/canPublishProduct.ts`: description ≥100 chars, ≥1 preview lesson with a video, live cap 1/3. Stale comment in `permissions/products.ts:9` says `authorId` doesn't exist (it does) |
| `purchases` | ✅ | ✅ (+referral) | ⚠️ only `canRefundPurchases` | ❌ | PARTIAL. See §6 Payments |
| `payouts` | ✅ | ✅ | ✅ | ✅ | PARTIAL. Manual request → admin "mark paid"/reject, status-guarded. Minimum NPR 1,000 (`db/payouts.ts:7`). **No hold period**: earnings are withdrawable before the 7-day refund window closes. **Race**: the balance check and insert in `requestPayout` (`db/payouts.ts:39-58`) aren't in a transaction or lock, so two concurrent requests can both pass |
| `certificates` | ✅ | ✅ | ✅ | ✅ | DONE. `issueCertificateIfEligible` runs on each lesson completion (`lessons/actions/userLessonComplete.ts:28`); public verify page `src/app/verify/[certificateCode]/page.tsx`; QR in `components/CertificateQRCode.tsx`; revocation keeps an audit trail. `courseDurationMinutesSnapshot: 0` is a TODO (`db/certificates.ts:152`). QR and LinkedIn URLs use the unvalidated `NEXT_PUBLIC_APP_URL` |
| `instructors` | ✅ (profile, phoneOtp) | ✅ | ✅ | ✅ | DONE. Unique handle; SMS OTP via SMSPasal (`src/services/sms/smsPasalServer.ts`) with a SHA-256 hashed code, 10-minute TTL and 5 attempts; `teach/layout.tsx` redirects to onboarding. The `isVerified` column exists, and `setInstructorVerified` (`db/instructors.ts:41`) is never called; there's no admin verify action or UI |
| `ledger` | — | ✅ (ledger, revenue) | — | ⚠️ unused `commissionOverrideSchema` | PARTIAL. Append-only `sale` rows with a unique `(purchase, course, type)` key. Commission in `src/lib/comissionRate.ts` (misspelled): **30%** platform fee on sales via the instructor's own `?ref=` link, **50%** otherwise. Bundle split uses `Math.floor(price / nCourses)` (`purchases.ts:243`), so remainder paisa go unrecorded. `reverseLedgerEntriesForPurchase` exists (`db/ledger.ts:70`) but **nothing calls it** |
| `refunds` | ✅ | ✅ | — | — | MISSING in practice. `RefundRequestButton` is never rendered. `getRefundRequestsForAdmin` is unused, and there's no admin refund page. **Bug**: `lib/eligibility.ts:39` and `actions/refunds.ts:41` use `purchase.productId` as `courseId`, so completion is always 0% and the insert into `refund_requests.courseId`, which has an FK to `courses`, fails. No ledger reversal, no gateway refund |
| `reports` | ✅ | ✅ | — | ✅ | MISSING in practice. `ReportButton` is never rendered; there's no admin reports page |
| others | | | | | Discounts, reviews, wishlist, search (Postgres `tsvector`), support tickets, lesson Q&A, invoices (React-PDF → R2 → Resend; Nepali fiscal-year sequence) all have working code. Invoice PDFs depend on R2, which is broken by the env bug in §5 |

**Moderation state:** there is no course or product review status. `productStatuses = ["public","private"]` (`src/drizzle/schema/product.ts:771`), so any instructor who passes `canPublishProduct` goes live immediately.

## 4. Drizzle schema and migrations: MISSING / out of sync (P0)

- `src/drizzle/migrations/` holds one migration, `0000_faithful_rogue.sql` (journal `meta/_journal.json`). It creates **12 tables** (courses, course_products, course_sections, lessons, products, purchases, account, session, user, verification, user_course_access, user_lesson_complete) and 4 enums.
- The schema (`src/drizzle/schema.ts` → 28 files) defines **about 32 tables** and many more enums.
- **Tables with no migration:** instructors, instructor_phone_otps, certificates, ledger_entries, payouts, invoices, invoice_sequences, lesson_assets, lesson_questions, lesson_question_replies, discount_codes, discount_redemptions, refund_requests, reports, course_reviews, wishlist_items, support_tickets, support_ticket_messages, categories, tags, product_tags.
- **Drifted columns:**
  - `products`: `priceInDollars` → `priceInRupees`; missing `category_id` and `search_vector`, a generated tsvector.
  - `purchases`: `pricePaidInCents` and `stripeSessionId`, vs `pricePaidInPaisa`, `gateway`, `status`, `gatewayCheckoutId`, `gatewayTransactionId`, `rawGatewayResponse`, `idempotencyKey` (unique), `discount_*`, `referredByInstructorId`, `expiresAt`, and the unique index `gateway_transaction_unique_idx`.
- **Conclusion:** the dev database was built with `pnpm db:push`. Running `db:migrate` against a fresh production DB produces a Stripe-era schema that the code can't run on.
- **Fix:** delete the stale migration and generate a single fresh baseline from the current schema, since production will be a fresh DB (an assumption). Then use `db:generate` + `db:migrate` only; `db:push` goes to local dev only.
- **Also:**
  - `drizzle.config.ts` and `src/drizzle/db.ts` force `ssl: true`, which breaks a local non-SSL Postgres.
  - They use discrete `DB_*` vars while `turbo.json` lists `DATABASE_URL`. Pick one.

## 5. Video pipeline: PARTIAL

| Stage | Status | Evidence |
|---|---|---|
| Upload | ⚠️ Works in principle | `lessons/actions/lessonAssets.ts` → `requestLessonAssetUploadUrl` creates the `lesson_assets` row, then returns a presigned R2 PUT (`src/services/storage/r2.ts:38`); 5-minute URL |
| Storage | ❌ **Broken by env mismatch** | `r2.ts:19` reads `process.env.R2_BUCKET`; the env schema (`data/env/server.ts:28`) and `turbo.json` declare `R2_BUCKET_NAME`. The bucket is `undefined` unless both are set. This also breaks invoice PDFs (`putObject`) |
| Upload confirmation | ❌ | The asset row exists before any bytes arrive (comment at `lessonAssets.ts:21-23`). No HEAD check, size or MIME enforcement, or orphan cleanup |
| Transcoding | ❌ None | Raw uploaded file served as-is |
| Streaming | ⚠️ Progressive MP4 | `app/api/lessons/[lessonId]/assets/[assetId]/deliver/route.ts` signs an R2 GET (expiry = 2× duration, or 30 minutes) → `<video src>` in `features/lessons/components/VideoLessonViewer.tsx`. No HLS/adaptive bitrate |
| Bunny Stream | ❌ Dead code | `services/bunny/streamToken.ts` exists, but `deliver/route.ts:50` returns **501** for `bunny` before the real branch at `:94`, which is unreachable. No Bunny upload path |
| YouTube lessons | ✅ | `externalId` → `YouTubeVideoPlayer.tsx`, rendered server-side; doesn't hit `/deliver` |
| Free preview vs locked | ⚠️ **Half-broken** | Page-level gating is correct: `canViewLesson` (`lessons/permissions/lessons.ts:84`) allows `preview` for everyone, admins, and buyers of public lessons. But `/deliver` (`route.ts:24-44`) **401s anonymous users and 403s anyone without a `user_course_access` row**. So uploaded (R2) preview videos and PDFs don't play for prospective buyers, and **course authors and admins can't play their own uploaded lessons**. Only YouTube previews work. `canPublishProduct` accepts an uploaded preview video, so a course can publish with a preview nobody can watch |
| Anti-piracy | ❌ | Signed URLs only; buyer-stamping is a TODO (`route.ts:83`) |

## 6. Payments: PARTIAL, not launchable

**What exists** (`src/services/payments/**`, `src/features/purchases/**`)
- A `PaymentGateway` interface with `initiate` and `verify` (`services/payments/types.ts`).
- **eSewa v2:** HMAC-SHA256 signed auto-POST form (`esewa/esewaClient.ts`) and a server-to-server status API check that sends our own amount (`esewa/esewaServer.ts:29`).
- **Khalti:** server-side initiate returns `pidx`, which is stored as `gatewayTransactionId`; lookup verification (`khalti/khaltiClient.ts`, `khalti/khaltiServer.ts`).
- **Fonepay:** dynamic QR with HMAC-SHA512 (`fonepay/fonepayClient.ts`); status check **with** an amount check (`fonepay/fonepayServer.ts:98-108`); the client polls every 3 seconds (`PurchaseGatewayPicker.tsx:27-39`).
- **Idempotency:** a unique `purchases.idempotencyKey` with `onConflictDoNothing` (`purchases/db/purchases.ts:29`).
- **Duplicate-safe completion:** `markPurchaseCompleted` updates with `WHERE status='pending'` (`db/purchases.ts:96-123`), plus a unique `(gateway, gatewayTransactionId)` index.
- **Atomic fulfilment:** access grant, ledger rows, discount redemption and the invoice row are written in one DB transaction (`purchases.ts:205-282`). The PDF and email are sent afterwards, fire-and-forget.
- **The success page verifies** rather than assuming success (`products/[productId]/purchase/success/page.tsx:59`).

**Gaps**, in severity order:
1. **No callback, webhook or reconciliation.** There's no `app/api/payments/**`. Confirmation only happens when the buyer's browser loads the success page, or keeps the Fonepay QR tab open. A buyer who pays and closes the tab, or whose connection drops, is charged with **no access** and no automated recovery.
2. **Sandbox is the silent default.** `esewaClient.ts:3-7`, `esewaServer.ts:4-7`, `khaltiClient.ts:2-4`, `khaltiServer.ts:5-7` and `fonepayClient.ts:7-8` fall back to `EPAYTEST`, `rc-epay.esewa.com.np`, `dev.khalti.com` and `dev-clientapi.fonepay.com`. A production deploy with one missing var silently runs in test mode. There's no `PAYMENT_MODE`.
3. **Credentials aren't validated.** `ESEWA_*`, `KHALTI_*`, `FONEPAY_USERNAME/PASSWORD/DYNAMIC_QR_URL` and `NEXT_PUBLIC_APP_URL` are read via `process.env.X!`. `data/env/server.ts:22` says eSewa and Khalti are "intentionally NOT declared". A missing `ESEWA_SECRET_KEY` makes `createHmac` throw at checkout.
4. **Khalti amount isn't checked.** `khaltiServer.ts:47-59` marks the purchase verified on `status === "Completed"` without comparing `total_amount` to the expected paisa.
5. **Probable eSewa return-URL bug.** `successUrl` already contains `?purchaseId=…` (`purchases.ts:158`). eSewa appends `?data=<base64>` to the success URL, which would turn `purchaseId` into `"<uuid>?data=…"`. Needs confirming in sandbox. The `data` payload and its signature are never read.
6. **Zero-price checkout is broken.** When a discount brings the price to 0, `initiatePurchase` inserts `gateway:"free", status:"pending"` and returns `isFree` (`purchases.ts:107-130`). Nothing completes it: the picker ignores `isFree`, and `confirmPurchase` would call `gateways["free"].verify` → TypeError. (Genuinely free ₹0 products use a separate working path, `enrollInFreeProduct` in `products/[productId]/purchase/page.tsx:107`.)
7. **Gateways are always shown.** `PurchaseGatewayPicker.tsx:8-12` hardcodes all three buttons, whether or not they're configured.
8. **No failure state.** `status: "failed"` is never written. Abandoned purchases stay `pending` forever. `purchase-failure/page.tsx` ignores `purchaseId` and links to `/`. `initiatePurchase` errors show nothing to the user (`PurchaseGatewayPicker.tsx:51-54`).
9. **Idempotency is per click, not per checkout.** The key is `crypto.randomUUID()` on each click (`PurchaseGatewayPicker.tsx:44`). The replay branch reads `rawGatewayResponse.redirectUrl`, which is never stored (`purchases.ts:57-68`).
10. **Refunds:** no gateway refund API calls; `revokeAccess` doesn't reverse the ledger (§2, §3).
11. **Commission split:** implemented correctly in `features/ledger/db/ledger.ts:12-62`, apart from the rounding noted in §3.
12. **Creator payouts:** manual only (§3). Nothing enforces a phone-verified instructor before a payout, even though the onboarding copy says it's required (`instructors/onboarding/page.tsx:97`).

## 7. Instructor flow: DONE, with UX gaps

Onboarding (`src/app/(consumer)/instructors/onboarding/page.tsx`: profile + phone OTP) → `/teach` dashboard (`teach/page.tsx`, courses, products, discounts, sales, reviews, payouts) → course builder (sections and lessons with drag-sort via `components/SortableList.tsx`, `LessonAssetManager.tsx`) → product (bundle, NPR price, category) → publish gate.

Gaps:
- Uploaded video can't be previewed by the author (§5).
- Publishing is immediate, with no review (§3).
- `/teach/sales` exposes `revokeAccess` (§2).

## 8. Student flow: PARTIAL

- **Browse and search:** `(consumer)/browse/page.tsx`, `features/search` (tsvector; needs the missing migration).
- **Product page:** `products/[productId]/page.tsx`.
  - **Hardcoded instructor block:** "Tutor Jonas" linking to `/instructors/jonas` on every product (`:95-109`).
  - **Fake discount:** `Price` renders the same price twice, one struck through (`:295-314`).
- **Buy:** §6. **Watch:** §5.
- **Progress:** `(consumer)/courses/page.tsx` uses `user_lesson_complete`; completion is toggled via `features/lessons/actions/userLessonComplete.ts` or auto-marked when the video ends.
- **Certificates:** list, detail and PDF download (`CertificateDocument.tsx`, `jspdf`/`html2canvas`), LinkedIn button, and QR verification at `/verify/[certificateCode]`. DONE.
- **Refund requests and reporting:** not reachable from the UI (§3).

## 9. Legal pages: PARTIAL

The legal pages are in the landing app (`apps/landing/app/`).

| Page | Status |
|---|---|
| Terms of Service, `tos/page.tsx` | Exists. Placeholders: registration number, address, `LAST_UPDATED = "[DATE]"` (`:5-9`). The support email is the literal string **`[email protected]`**, a Cloudflare email-obfuscation artifact from copy-paste. It states a 7-day / <20% completion refund rule (`:73,126`), which matches `refunds/lib/eligibility.ts`. It doesn't state commission rates |
| DMCA, `dmca/page.tsx` | Exists. Same `[email protected]` and `[...]` placeholders (`:3-6`) |
| Content policy, `content/page.tsx` | Exists. Same placeholders (`:3-4`) |
| Privacy policy | **MISSING** |
| Refund policy (standalone) | **MISSING**. The web footer links `/refund-policy` |
| `/legal`, `/contact`, `/blog` | **MISSING** |

Both footers link to missing pages: `apps/web/src/components/Footer.tsx:171-240` and `apps/landing/components/Footer.tsx:43-107`. The landing app hardcodes `APP_URL = "https://app.paperglidr.com"` (`components/Footer.tsx:2`, `app/page.tsx:14`).

## 10. Env and config

No `.env`, `.env.local` or **`.env.example`** exists anywhere in the repo.

Legend: **Validated** = declared in `src/data/env/server.ts` or `client.ts` (t3-env). **Turbo** = listed in `turbo.json` `build.env`; under turbo 2's default strict env mode, unlisted vars are **stripped** during `turbo run build`.

| Var | Read in | Validated | Turbo | Launch need |
|---|---|---|---|---|
| `DB_HOST` `DB_USER` `DB_PASSWORD` `DB_NAME` | `drizzle/db.ts`, `drizzle.config.ts` | ✅ | ✅ | Required |
| `BETTER_AUTH_SECRET` | Better Auth (implicit) | ✅ | ✅ | Required |
| `BETTER_AUTH_URL` | `lib/auth.ts:11` | ❌ | ❌ | Required |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | `lib/auth-client.ts:4` | ✅ (client block of server env) | ❌ | Required |
| `GOOGLE_CLIENT_ID` / `_SECRET` | `lib/auth.ts:41-42` | ❌ | ✅ | Required |
| `GITHUB_CLIENT_ID` / `_SECRET` | `lib/auth.ts:37-38` | ❌ | ❌ | Optional (drop GitHub?) |
| `R2_ACCOUNT_ID` `R2_ACCESS_KEY_ID` `R2_SECRET_ACCESS_KEY` | `services/storage/r2.ts` | ✅ | ✅ | Required |
| `R2_BUCKET` | `r2.ts:19` | ❌ | ❌ | **Bug:** code reads this |
| `R2_BUCKET_NAME` | nothing | ✅ | ✅ | **Bug:** schema declares this |
| `RESEND_API_KEY` | `services/email/resend.ts:3` (module-level `new Resend`) | ✅ | ✅ | Required |
| `INVOICE_FROM_EMAIL` | `invoices/actions/generateAndSendInvoice.tsx:45` | ✅ | ✅ | Required |
| `NOTIFICATIONS_FROM_EMAIL` | `lessonQuestions/lib/sendReplyNotification.ts:41` | ❌ | ❌ | Required |
| `NEXT_PUBLIC_APP_URL` | `purchases.ts:152`, `khaltiServer.ts:69`, `CertificateQRCode.tsx:8`, `AddToLinkedInButton.tsx:16`, `sendReplyNotification.ts:38` | ❌ | ❌ | Required (payment return URLs) |
| `NEXT_PUBLIC_SERVER_URL` | `data/env/*` (duplicate of APP_URL) | ✅ | ❌ | Merge with `NEXT_PUBLIC_APP_URL` |
| `NEXT_PUBLIC_LANDING_URL` | `components/Footer.tsx:29` | ❌ | ❌ | Required (footer legal links) |
| `SMSPASAL_API_KEY` `_SENDER_ID` `_CAMPAIGN_ID` `_ROUTE_ID` | `services/sms/smsPasalServer.ts` | ✅ (optional) | ✅ | Required for phone verification |
| `ESEWA_PRODUCT_CODE` `ESEWA_SECRET_KEY` `ESEWA_FORM_URL` `ESEWA_STATUS_URL` | `services/payments/esewa/*` | ❌ | ❌ | Required per gateway |
| `KHALTI_SECRET_KEY` `KHALTI_INITIATE_URL` `KHALTI_LOOKUP_URL` | `services/payments/khalti/*` | ❌ | ❌ | Required per gateway |
| `FONEPAY_MERCHANT_CODE` `FONEPAY_SECRET_KEY` | `services/payments/fonepay/fonepayClient.ts` | ✅ (optional) | ❌ | Required per gateway |
| `FONEPAY_USERNAME` `FONEPAY_PASSWORD` `FONEPAY_DYNAMIC_QR_URL` | `fonepayClient.ts:5-8` | ❌ | ❌ | Required per gateway |
| `BUNNY_STREAM_LIBRARY_ID` `BUNNY_STREAM_TOKEN_AUTH_KEY` | `services/bunny/streamToken.ts` | ❌ | ❌ | Not needed at launch (dead path) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `data/env/client.ts` | ✅ (optional) | ✅ | **Remove** |
| `STRIPE_SECRET_KEY`, `DATABASE_URL` | nothing | — | ✅ | **Remove** from turbo |
| `SKIP_ENV_VALIDATION` | `data/env/*` | — | ❌ | Needs `globalPassThroughEnv` |
| `NODE_ENV` | `auth.ts`, `middleware.ts` | — | — | Set by the platform |

Other config issues:
- `apps/web/next.config.ts` allows `images.remotePatterns` with `hostname: "**"`, which turns `/_next/image` into an open image proxy. It should list only the R2 public domain, Google avatars and YouTube thumbnails.
- `experimental.useCache` is on, with `cacheTag` imported from the internal path `next/dist/server/use-cache/cache-tag` throughout. That's fragile across Next upgrades.
- The two apps are on different Next majors: web resolves **15.5.22** (`^15.2.0-canary.12`), landing is on **16.3.0**. Web's `next lint` is deprecated in 16.
- `packages/eslint-config` and `packages/typescript-config` exist but **neither app uses them**: each app has its own `eslint.config.mjs` and `tsconfig.json`.
- No package defines `check-types`, so `pnpm check-types` (root/turbo) is a no-op.

## Build / lint / typecheck results

The commands were run on 2026-09-23 after `pnpm install --frozen-lockfile`, which succeeded (688 packages). The build scripts for core-js, esbuild, sharp and unrs-resolver were ignored by pnpm's default policy.

| Command | Result |
|---|---|
| `pnpm lint` (turbo) | ❌ **Fails.** Turbo stops at `landing#lint` |
| `landing`: `eslint` | ❌ **23 errors, 1 warning.** 22 × `react/no-unescaped-entities` in `app/tos/page.tsx` (20:35 … 143:41), `app/content/page.tsx` (42, 46, 58, 71, 87) and `app/page.tsx:338`; 1 × React Compiler rule "setState synchronously within an effect" in `components/Navbar.tsx:48`; warning: unused `BookOpen` in `app/page.tsx:10` |
| `web`: `next lint` | ❌ **Can't run: config invalid.** `ESLint configuration in eslint-config-next/core-web-vitals » plugin:@next/next/recommended is invalid: Unexpected top-level property "name"`. `eslint-config-next@15.1.0` is out of step with the installed Next 15.5 / ESLint 9.39. Web code is **not linted at all** today, including during `next build` |
| `pnpm check-types` | No-op: no package defines the script |
| `apps/web`: `tsc --noEmit` | ✅ **0 errors** |
| `apps/landing`: `tsc --noEmit` | ❌ 1 error: `app/layout.tsx(42,50): Cannot find name 'LayoutProps'`. Next 16's global `LayoutProps` type comes from generated `.next/types`, so this passes after `next build` / `next typegen`. Low severity |
| `pnpm build` (turbo), no env | ❌ `landing` ✅ builds (6 static pages). `web` compiles and typechecks, then fails in "Collecting page data": `❌ Invalid environment variables` |
| `SKIP_ENV_VALIDATION=1 pnpm build` (turbo) | ❌ Same env failure: **turbo strict env mode strips `SKIP_ENV_VALIDATION`** because it isn't in `turbo.json`. This concretely shows the turbo env problem: `NEXT_PUBLIC_APP_URL` and the other unlisted `NEXT_PUBLIC_*` vars would be inlined as `undefined` the same way |
| `SKIP_ENV_VALIDATION=1 next build` (direct in `apps/web`) | ❌ `Failed to collect page data for /products/[productId]/purchase/success`: `Missing API key. Pass it to the constructor new Resend(...)` (module-level client in `services/email/resend.ts:3`), plus `BetterAuthError: You are using the default secret` |
| `next build` with placeholder values for all validated vars | ❌ Prerender fails: `ECONNREFUSED 127.0.0.1:5432` on `/admin/payouts` and `/admin/revenue`. **The build needs a live production DB**, because these pages are static and query the DB at build time (see §2) |

**The web app compiles and type-checks.** The build blockers are all config: lint config, env handling in turbo, module-level clients and static admin pages.

## Bugs and security list

**P0: fix before any real user**
1. Admin area unauthenticated beyond login, and statically prerendered with data baked in: `src/app/admin/**`. Add a role gate in `admin/layout.tsx`.
2. `revokeAccess` has no authorization: `features/purchases/actions/purchases.ts:302`.
3. Paid-but-no-access: no callback or reconciliation (§6.1).
4. Sandbox fallbacks in payment clients (§6.2); unvalidated payment credentials (§6.3).
5. Khalti amount not verified: `khaltiServer.ts:47`.
6. Migrations out of sync: `src/drizzle/migrations/`.
7. `R2_BUCKET` vs `R2_BUCKET_NAME`: `services/storage/r2.ts:19`.
8. Storewide discount applies to any creator's product: `discounts/lib/validateDiscountCode.ts:41`.

**P1: fix before public launch**
9. Preview and author playback blocked by `/deliver` access check: `deliver/route.ts:36-44`.
10. Zero-price checkout (100% discount) never completes: `purchases.ts:107`.
11. Probable eSewa `?data=` return-URL corruption: `purchases.ts:158`.
12. Refund flow broken (`productId` used as `courseId`) and unreachable: `refunds/lib/eligibility.ts:39`, `refunds/actions/refunds.ts:41`.
13. No payout hold vs the refund window; non-transactional balance check: `payouts/db/payouts.ts:39`.
14. Post-login redirect ignored: `(auth)/sign-in/[[...sign-in]]/page.tsx:17`.
15. Hardcoded "Tutor Jonas" and fake strikethrough price: `products/[productId]/page.tsx:95,295`.
16. Missing privacy/refund pages; placeholders and `[email protected]` in legal pages.
17. Build and lint failing (above); `turbo.json` env list.
18. `images.remotePatterns: "**"`: `next.config.ts:18`.

**P2: post-launch**
19. Better Auth in-memory rate limit on serverless.
20. Ledger remainder-paisa loss on bundle split: `purchases.ts:243`.
21. Bunny branch unreachable: `deliver/route.ts:50`.
22. `console.log` of user IDs: `services/auth.ts:52`.
23. Clerk/Stripe leftovers (§1).
24. `courseDurationMinutesSnapshot: 0`: `certificates/db/certificates.ts:152`.
25. `cacheTag` from `next/dist` internals.

**TODO / ADJUST / ASSUMPTION markers** (22 in `apps/web/src`; none in landing apart from the legal placeholders):
- `app/admin/payouts/page.tsx:40`
- `app/api/lessons/[lessonId]/assets/[assetId]/deliver/route.ts:95`
- `features/purchases/components/PurchaseCheckoutCard.tsx:46` (stale: the prop is wired)
- `features/purchases/actions/purchases.ts:22`, `:87`
- `features/purchases/db/purchases.ts:134`
- `features/products/permissions/products.ts:14`
- `features/products/lib/canPublishProduct.ts:12`
- `features/discounts/actions/discounts.ts:43`
- `features/discounts/lib/validateDiscountCode.ts:41` (**real bug**)
- `features/discounts/db/cache.ts:3`
- `features/certificates/db/certificates.ts:152`
- `features/lessonQuestions/components/AskQuestionForm.tsx:21`
- `features/lessonQuestions/components/QuestionThread.tsx:3`, `:7`, `:8`
- `features/courses/db/courses.ts:91`
- `features/refunds/actions/refunds.ts:35` (**real bug**)
- `features/refunds/lib/eligibility.ts:35` (**real bug**)
- `features/payouts/db/payouts.ts:86`
- `data/env/server.ts:25`
- `drizzle/schema/discountRedemption.ts:19`

Several are leftovers from pasted-in code ("never seen user.ts") and can simply be deleted once checked.

**Hardcoded secrets:** none found. The only hardcoded credentials-like values are the public sandbox defaults (`EPAYTEST`, sandbox URLs), which are a problem because they are fallbacks (§6.2).

## Assumptions
- **Deployment:** Vercel for both apps (`.vercel` is in `.gitignore`) with managed Postgres over SSL.
- **Production DB:** will be created fresh, with no data to migrate from the dev DB.
- **Roadmap:** the "8-phase roadmap" referenced in code comments (e.g. `payouts/db/payouts.ts:6`, `deliver/route.ts:51`) is not in the repo; this audit works from the summary in the brief.
- **Mobile:** the Flutter app was removed (commit `7d54455`); the React Native app isn't in this repo. `/api/v1/*` is assumed to serve it and was checked only for auth presence. Public catalogue routes are unauthenticated by design; user routes use the session/bearer.
