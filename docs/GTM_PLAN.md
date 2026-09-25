# Chiyali Go-To-Market Plan

_Companion to [`REPO_AUDIT.md`](./REPO_AUDIT.md), dated 2026-09-23. Section numbers in the form "Audit §N" refer to that doc._

**Goal:** real creators publishing and real students paying, as fast as possible. Everything that isn't needed for that goes to "after launch".

**Headline:** the product surface is already bigger than needed. The work between here and launch is trust and money plumbing: authorization, payment confirmation, migrations, env, and legal. About **20 tasks**, most of them small. The critical path is **gateway merchant approval**, not code, so start the KYC paperwork today in parallel with engineering.

---

## Part 2: Payment gateways: code-complete now, keys later

**Target:** going live changes env vars only. The steps below are the specification. Task numbers refer to the launch list in Part 3 §1.

### 2.1 Single payments config module
Create `apps/web/src/services/payments/config.ts`. It is the **only** place that reads payment env vars. It's validated through `src/data/env/server.ts` (add every var below there, and to `turbo.json`).

```
PAYMENT_MODE = sandbox | live          # required, no default in production builds
PAYMENT_ENABLED_GATEWAYS = esewa,khalti,fonepay   # optional allow-list / kill switch

# eSewa (ePay v2)
ESEWA_PRODUCT_CODE, ESEWA_SECRET_KEY, ESEWA_FORM_URL, ESEWA_STATUS_URL
# Khalti (KPG-2)
KHALTI_SECRET_KEY, KHALTI_BASE_URL          # initiate = {base}/epayment/initiate/, lookup = {base}/epayment/lookup/
# Fonepay (dynamic QR)
FONEPAY_MERCHANT_CODE, FONEPAY_SECRET_KEY, FONEPAY_USERNAME, FONEPAY_PASSWORD, FONEPAY_BASE_URL

APP_BASE_URL (= NEXT_PUBLIC_APP_URL, consolidated)  # used to build return URLs
CRON_SECRET                                  # protects the reconciliation endpoint
```

Rules:
- **`sandbox` mode:** the public sandbox endpoints and test merchant codes may be used as defaults. These defaults live only in `config.ts`, inside a `SANDBOX_DEFAULTS` object, never inline in gateway files.
- **`live` mode:** **no defaults at all.** A gateway counts as configured only if every one of its live vars is set. A missing var disables that gateway; it never falls back to sandbox.
- A sandbox URL in live mode, e.g. `ESEWA_FORM_URL` containing `rc-epay` or `KHALTI_BASE_URL` containing `dev.khalti`, should fail the boot check. This is a cheap guard against copy-paste mistakes.
- Remove the `?? "EPAYTEST"` / `?? sandbox URL` fallbacks and the `process.env.X!` reads from `esewa/esewaClient.ts`, `esewa/esewaServer.ts`, `khalti/khaltiClient.ts`, `khalti/khaltiServer.ts` and `fonepay/fonepayClient.ts`. Each gateway takes its config object from `config.ts`.
- Add `getEnabledGateways(): ("esewa"|"khalti"|"fonepay")[]` and `isGatewayEnabled(g)`.

### 2.2 Checkout hides unconfigured gateways
- `products/[productId]/purchase/page.tsx` (server) calls `getEnabledGateways()` and passes the list through `PurchaseCheckoutCard` to `PurchaseGatewayPicker`, replacing the hardcoded `gatewayOptions` at `PurchaseGatewayPicker.tsx:8`.
- `initiatePurchase` rejects any gateway where `!isGatewayEnabled(gateway)` (server-side; never trust the client list).
- If there are zero gateways: "Payments are temporarily unavailable, contact support", with a link to `/support/new`. The checkout never throws.
- In `sandbox` mode, show a visible "TEST MODE — no real money" banner on checkout, so beta testers never confuse the two modes.
- Show `initiatePurchase` errors to the user; the picker currently swallows them at `PurchaseGatewayPicker.tsx:51`.

### 2.3 Return routes (server-verified)
Add route handlers that the gateway redirects the browser to. All three follow the same pattern: load the purchase by path param → `verifyAndFulfil(purchaseId)` → redirect to the success or failure page.

| Gateway | Route | Notes |
|---|---|---|
| eSewa | `app/api/payments/esewa/return/[purchaseId]/route.ts` (success) and `/esewa/failure/[purchaseId]` | Put `purchaseId` in the **path**: eSewa appends `?data=` and would corrupt a query string (Audit §6.5). Decode `data` (base64 JSON), check its HMAC signature over `signed_field_names` with `ESEWA_SECRET_KEY`, and check that `transaction_uuid` equals `purchaseId`. **Then still call the status API**, which is the authority |
| Khalti | `app/api/payments/khalti/return/[purchaseId]/route.ts` | Khalti appends `pidx`, `status`, `amount` and so on. Treat them as hints only: check that `pidx` equals the stored `gatewayTransactionId`, then call lookup |
| Fonepay | No redirect: the QR tab polls `GET /api/payments/fonepay/status/[purchaseId]` (owner only), replacing the direct `confirmPurchase` server-action poll | Keep the 3-second poll and stop at `expiresAt`. The cron picks up anything missed |

`verifyAndFulfil` is today's `confirmPurchase` body moved out of the exported server-action file, so it can't be called directly from the client. The exported action keeps a thin owner-only wrapper for the success page.

### 2.4 Amount checks (both modes, all gateways)
- Every `verify()` returns `amountInPaisa` from the gateway. `verifyAndFulfil` then requires `verification.amountInPaisa === purchase.pricePaidInPaisa`, in addition to the per-gateway check.
- **Khalti:** add the missing comparison in `khaltiServer.ts:47`: `total_amount` is in paisa.
- **eSewa:** the status API is queried with our amount, and the response `total_amount` must also match. Parse as rupees → paisa with `Math.round`.
- **Fonepay:** already checks the amount (`fonepayServer.ts:105`).
- A mismatch sets `status = "disputed"`, which already exists in `purchaseStatuses`, rather than `completed`. Log it and surface it in admin; a human decides.

### 2.5 Duplicate-callback and idempotency handling
Already correct, so keep all of it:
- `markPurchaseCompleted`'s `WHERE status='pending'` guard
- the unique `(gateway, gatewayTransactionId)` index
- the unique ledger `(purchase, course, type)` index
- the single fulfilment transaction

Add:
- **Failure transitions:** `markPurchaseFailed(id)`, also guarded on `status='pending'`, when the gateway reports a terminal failure (eSewa `CANCELED`/`NOT_FOUND` after the window, Khalti `Expired`/`User canceled`, Fonepay `failed`/`expired`).
- **Late success wins:** if a gateway reports `COMPLETE` for a purchase already marked `failed`, allow `failed → completed`. A buyer who paid must get access.
- **Idempotency key per checkout,** not per click: generate it once per product-page mount in `PurchaseGatewayPicker`, plus the gateway. Store the gateway redirect payload in `rawGatewayResponse` at initiation, so the existing replay branch (`purchases.ts:57`) can return it.
- **Payment event log:** add a `payment_events` table (purchaseId, source = return|poll|cron, gateway status, raw payload, timestamp), or append to a jsonb array. It's cheap, and it's what you'll need in the first chargeback or dispute conversation.

### 2.6 Reconciliation cron (the webhook substitute)
None of the three gateways gives this app a reliable server-to-server webhook in the current integrations, so reconciliation is mandatory.

- Add `app/api/cron/reconcile-payments/route.ts`, protected by `Authorization: Bearer ${CRON_SECRET}`, and schedule it with Vercel Cron every **5 minutes** in `apps/web/vercel.json`.
- Each run selects purchases with `status='pending'` and `createdAt` between 2 minutes and 48 hours ago, limited to 50, then runs `verifyAndFulfil` on each. Anything older than 48 hours that's still pending gets marked `failed`.
- An admin "Re-check payment" button on a purchase calls the same function. This is the support team's tool for "I paid but have no access" tickets.

### 2.7 Other payment fixes that belong in the same PR
- **Zero-price after discount:** route it through the working free-enrolment path (`enrollInFreeProduct`), marked completed immediately, and still record the discount redemption. Never create a pending `free` purchase.
- **Storewide discount scoping:** require `product.authorId === discountCode.creatorId` for `storewide` codes (`validateDiscountCode.ts:41`).
- **Failure page:** `purchase-failure/page.tsx` reads `purchaseId`, shows the product, and offers "Try again" (back to checkout) plus "I was charged": a support ticket prefilled with the purchase ID.

### 2.8 Sandbox reference (verify each against current gateway docs before use)
| Gateway | Sandbox endpoints | Test credentials |
|---|---|---|
| eSewa ePay v2 | form `https://rc-epay.esewa.com.np/api/epay/main/v2/form`; status `https://rc.esewa.com.np/api/epay/transaction/status/` | product code `EPAYTEST`; the secret key and test eSewa IDs/password/token are published in eSewa's developer docs |
| Khalti KPG-2 | `https://dev.khalti.com/api/v2/epayment/initiate/`, `.../lookup/` | test secret key from a free test-merchant signup at the Khalti sandbox; the test wallet IDs, MPIN and OTP are in the Khalti docs |
| Fonepay dynamic QR | `https://dev-clientapi.fonepay.com/api/merchant/merchantDetailsForThirdParty` | **Not self-serve.** The dev merchant code, secret, username and password come from Fonepay or the acquiring bank. Until then, Fonepay stays disabled via 2.2, which is exactly what that mechanism is for |

### 2.9 Go-live checklist (per gateway)
Do this **one gateway at a time**. Khalti first, because onboarding is usually fastest (an assumption); then eSewa; then Fonepay.

**Before switching any gateway**
- [ ] Legal entity registered; PAN obtained; business bank account open (all three gateways require them for merchant KYC).
- [ ] Production domain live on HTTPS: `https://chiyali.com` (the single canonical domain; `www.` and `app.chiyali.com` redirect to it).
- [ ] `PAYMENT_MODE=live` set in **Vercel Production only**. Preview deployments stay on `sandbox`.
- [ ] `CRON_SECRET` set; the Vercel Cron job shows successful runs.
- [ ] Admin "Re-check payment" button tested in sandbox.

| | **Khalti** | **eSewa** | **Fonepay** |
|---|---|---|---|
| Get credentials from | Khalti merchant dashboard (live secret key) after KYC approval | eSewa merchant onboarding (live product code / merchant ID + secret key) | Acquiring bank / Fonepay merchant onboarding |
| Env vars to set | `KHALTI_SECRET_KEY` (live), `KHALTI_BASE_URL=https://khalti.com/api/v2` | `ESEWA_PRODUCT_CODE`, `ESEWA_SECRET_KEY`, `ESEWA_FORM_URL=https://epay.esewa.com.np/api/epay/main/v2/form`, `ESEWA_STATUS_URL=https://epay.esewa.com.np/api/epay/transaction/status/` | `FONEPAY_MERCHANT_CODE`, `FONEPAY_SECRET_KEY`, `FONEPAY_USERNAME`, `FONEPAY_PASSWORD`, `FONEPAY_BASE_URL=<live URL from Fonepay>` |
| URLs to register / whitelist | Website URL `https://chiyali.com`; return URL pattern `https://chiyali.com/api/payments/khalti/return/*` (sent per request; register it if the dashboard asks) | Success `https://chiyali.com/api/payments/esewa/return/*`; failure `https://chiyali.com/api/payments/esewa/failure/*` (sent per request in the form; give the domain to eSewa if they whitelist) | None (QR + status polling). Whitelist the server's egress IP if Fonepay requires it. On Vercel that needs a static-egress add-on or a proxy, so **ask Fonepay early** |
| Live URL values | Confirm against the live docs at go-live; the values above are the documented pattern, not verified here | Same | Provided by Fonepay |

**Smoke test after switching each gateway** (a real ₹10–₹50 test product, published — private products can't be bought — and unpublished again afterwards):
1. Buy with a real wallet or bank app → land on success → course access granted.
2. Check the DB: `purchases.status='completed'`, `gatewayTransactionId` set, `rawGatewayResponse` stored; one `ledger_entries` row with the correct fee split (30%/50%); one `invoices` row.
3. The invoice email arrives, and the PDF opens from R2.
4. **Abandon test:** start a payment, complete it in the wallet, **close the tab before the redirect.** Within 5 minutes the cron completes it and access appears.
5. **Replay test:** reload the return URL → still one ledger row, and "Already confirmed".
6. **Cancel test:** cancel in the gateway → failure page → the cron marks it `failed` later.
7. Refund the test purchase in the gateway merchant dashboard, then mark it refunded in admin (task 16) → access revoked, refund ledger row written.
8. Toggle the gateway off with `PAYMENT_ENABLED_GATEWAYS` → the button disappears from checkout.

---

## Part 3: GTM plan

### 3.1 Launch-blocking work (dependency order)

Effort: **S** ≤ 1 day, **M** 2–4 days, **L** 1+ week. Assumes one full-stack developer.

| # | Task | Why it blocks launch | Files | Effort |
|---|---|---|---|---|
| 1 | **Make build and lint green.** Replace `next lint` with the ESLint CLI and a working `eslint-config-next` matching Next 15.5; fix landing's 23 lint errors; add `check-types` scripts; make admin pages dynamic (task 4 does this) so the build doesn't need a DB | Nothing ships without a green build; web code is currently unlinted | `apps/web/package.json`, `apps/web/eslint.config.mjs`, `apps/landing/app/{tos,content,page}.tsx`, `apps/landing/components/Navbar.tsx`, `turbo.json` | S–M |
| 2 | **Env consolidation.** Add `.env.example` for both apps; declare every var in `data/env/server.ts`; fix `R2_BUCKET` → `R2_BUCKET_NAME`; merge `NEXT_PUBLIC_SERVER_URL`/`NEXT_PUBLIC_APP_URL`; list all vars in `turbo.json` (or set `envMode: "loose"` + `globalPassThroughEnv`); make `Resend` lazy; remove Stripe/Clerk leftovers | Uploads, invoices and payment return URLs are broken or undefined in prod builds today | `src/data/env/*`, `src/services/storage/r2.ts`, `src/services/email/resend.ts`, `src/lib/auth.ts`, `turbo.json`, `.env.example` | S |
| 3 | **Regenerate migrations and bootstrap prod DB.** Delete the stale `0000`, generate a fresh baseline, apply to a new prod Postgres, seed categories and one admin user | The production DB can't be created from the current migrations | `src/drizzle/migrations/**`, `drizzle.config.ts`, a seed script | M |
| 4 | **Admin authorization.** Role gate in `app/admin/layout.tsx` (`getCurrentUser` → `canAccessAdminPages` → `notFound()`); re-check in every admin action | Any user can read bank details, revenue and all support tickets | `src/app/admin/layout.tsx`, `src/permissions/general.ts` | S |
| 5 | **Lock down purchase actions.** `revokeAccess` becomes admin-only and reverses the ledger; remove it from `/teach/sales`; move `confirmPurchase` logic behind an owner check | Any user can revoke anyone's course | `features/purchases/actions/purchases.ts`, `features/purchases/components/PurchaseTable.tsx` | S |
| 6 | **Discount scoping fix** | Creators can zero-price other creators' courses | `features/discounts/lib/validateDiscountCode.ts` | S |
| 7 | **Payment config, `PAYMENT_MODE`, gateway hiding** (Part 2 §2.1–2.2) | Silent sandbox fallback in prod; broken checkout if a gateway is missing | `services/payments/config.ts` (new), gateway files, `PurchaseGatewayPicker.tsx`, `purchase/page.tsx` | M |
| 8 | **Return routes and amount checks** (§2.3–2.4), including the Khalti amount fix and the eSewa path-param fix | Correct money-in in both modes | `app/api/payments/**` (new), `khaltiServer.ts`, `purchases.ts` | M |
| 9 | **Reconciliation cron, failure states, payment events** (§2.5–2.6) | Paid-but-no-access is the #1 trust killer in NP e-commerce | `app/api/cron/reconcile-payments/route.ts` (new), `apps/web/vercel.json`, `db/purchases.ts`, schema | M |
| 10 | **Zero-price-after-discount path; failure page** (§2.7) | Launch promo codes (100% codes for beta students) are currently broken | `purchases.ts`, `purchase-failure/page.tsx` | S |
| 11 | **Fix `/deliver` access.** Allow `preview` lessons for anyone (signed URL, short expiry); allow the course author and admins | Uploaded preview videos don't play, which kills conversion; creators can't QA their own uploads | `app/api/lessons/[lessonId]/assets/[assetId]/deliver/route.ts` | S |
| 12 | **Upload constraints and confirmation.** Accept `video/mp4` only, ≤2 GB, with creator guidance: H.264, 720p, ~1.5–2.5 Mbps. Add a `confirmLessonAssetUpload` step (R2 `HeadObject` → verify size and type) and a pending/ready flag | Raw 4K uploads would be unwatchable on NTC/Ncell 4G and costly; ghost assets | `features/lessons/actions/lessonAssets.ts`, `schemas/lessonAssets.ts`, `LessonAssetManager.tsx`, `lesson_assets` schema | S |
| 13 | **Product page placeholders.** Real instructor block from `product.authorId` → instructor profile; remove the fake strikethrough | Every course currently says "Tutor Jonas"; the fake discount is misleading pricing | `app/(consumer)/products/[productId]/page.tsx` | S |
| 14 | **Post-login redirect.** Pass `redirectTo` into `callbackURL` (validate it's a relative path) | Checkout funnel breaks at login | `app/(auth)/sign-in/…/page.tsx`, `sign-up/…/page.tsx` | S |
| 15 | **Legal pages.** Privacy policy and refund policy (7 days / <20% completion, matching the code); fill the ToS/DMCA/Content placeholders; fix the `[email protected]` strings; add the commission disclosure to the ToS or creator terms; create or remove the `/legal`, `/contact`, `/blog` footer links; landing `APP_URL` from env | Gateway KYC reviewers check for ToS, privacy and refund pages on the live site; dead footer links look unfinished | `apps/landing/app/{privacy,refund-policy,contact}/page.tsx` (new), `tos/`, `dmca/`, `content/`, both `Footer.tsx` | M (+ lawyer review) |
| 16 | **Minimal manual refund path.** Fix `productId`→`courseId` (resolve via `course_products`, aggregate across the bundle); render `RefundRequestButton` on `/purchases/[purchaseId]`; add an admin refunds page listing requests with "Approve & revoke" (revoke access + `reverseLedgerEntriesForPurchase` + `status='refunded'`). The money goes back **manually in the gateway dashboard** | The ToS promises refunds; the flow is broken and unreachable | `features/refunds/**`, `app/admin/refunds/page.tsx` (new), `app/(consumer)/purchases/[purchaseId]/page.tsx` | M |
| 17 | **Payout hold and safety.** Only ledger entries older than 7 days are withdrawable; wrap the balance check and insert in a transaction with `SELECT … FOR UPDATE` on the instructor row; require `phoneVerifiedAt` to request a payout; add a structured bank-details field (bank, account name, account number, branch, or eSewa/Khalti ID) | Otherwise creators withdraw money that later gets refunded, and double requests can be paid twice | `features/payouts/db/payouts.ts`, `actions/payouts.ts`, `PayoutRequestForm.tsx` | S |
| 18 | **Moderation gate for launch.** Add `pending_review` to `productStatuses`; instructor "Publish" sets `pending_review`; add an admin queue with approve/reject and reason; render `ReportButton` on the product page; add an admin reports list | Pirated or scam courses on day one would kill both creator trust and gateway relationships | `drizzle/schema/product.ts`, `features/products/actions/products.ts`, `app/admin/products/page.tsx` (new), `features/reports/**` | M |
| 19 | **Observability.** Sentry (free tier) on web; alerts on payment verify errors and `/deliver` 5xx; uptime check on `/` and `/api/cron/reconcile-payments` | You need to know before a buyer tells you on Facebook | `apps/web/*` Sentry config | S |
| 20 | **End-to-end smoke run in sandbox.** Onboard creator → upload → publish → approve → buy on each gateway → watch → complete → certificate → verify QR → refund → payout request → mark paid | Proves the whole loop before real money | a written checklist in `docs/` | S |

**Critical path:** 1 → 2 → 3 → (4, 5, 6 in parallel) → 7 → 8 → 9 → 20. Tasks 10–19 run alongside. Realistic total is **about 3–4 weeks** for one developer, which is well inside the typical gateway KYC timeline.

### 3.2 What to cut or fake for launch

| Cut / fake | Launch version | Build the real thing when… |
|---|---|---|
| Automated payouts | Existing manual flow: creator requests, founder pays by bank transfer or eSewa, clicks "mark paid". Fixed weekly payout day (e.g. every Friday) | >50 payouts a month, or payouts take >2 hours a week |
| Gateway refund APIs | Refund in the merchant dashboard; the admin button only fixes access and the ledger (task 16) | >20 refunds a month |
| Automated moderation (filters, fingerprinting) | Manual approval queue (task 18) plus report button. Founder reviews preview lesson, description and creator identity | >30 submissions a week, or first real piracy incident |
| Transcoding / HLS / Bunny Stream | Progressive MP4 from R2 (zero egress fees) with upload limits (task 12) | Playback complaints >5% of tickets, median upload >1 GB, or a piracy incident. Bunny code already exists in `services/bunny/streamToken.ts` |
| Watermarking / buyer stamping | None; signed URLs with short expiry | First confirmed leak of a paid course |
| Distributed rate limiting | Better Auth memory limiter + Vercel's built-in protection | Credential stuffing or signup spam appears |
| Email/password, password reset | Google sign-in only (hide GitHub; Nepal learners mostly have Gmail) | >10% of signup-page visitors drop without signing in, or support requests for it |
| Commission overrides / founder deal | Founding creators' reduced commission handled as a **manual top-up at payout time**, tracked in a spreadsheet | More than one commission tier is permanent |
| VAT/PAN on invoices | `vatRatePercent: null` (already supported) | VAT registration (turnover threshold) |
| Mobile app, `/api/v1` polish | Mobile web only; make sure checkout and the player work on a 360-px Android screen | Web retention data shows repeat learners |
| Analytics / growth / offline (roadmap phases 7–8) | Vercel Analytics + a handful of saved SQL queries (§3.7) | After product-market fit signals (Stage 3 metrics) |
| Certificate duration, reviews/Q&A/wishlist polish | Ship as-is | Only if users ask |

### 3.3 Payment go-live checklist
See **Part 2 §2.9** above. It is the launch-day checklist, run once per gateway.

### 3.4 Supply side: the first 10–20 creators

**Target profile.** Qualification checklist for each candidate:
- Has an existing audience: a YouTube, Facebook or TikTok following, or classroom students. **Distribution matters more than content quality at this stage.**
- Has at least 2 hours of recorded material ready, or can record in two weeks.
- Owns the rights to it: no reuploaded coaching-centre recordings, no copied books.
- Can price at NPR 499–2,999, the impulse range for eSewa/Khalti wallets.

**Who to target** (verticals where Nepali learners already pay):
1. **Loksewa (PSC) exam prep tutors.** A huge, recurring market that already buys notes and online classes.
2. **Entrance prep:** IOE/CEE (engineering, medical), CMAT/BBS, and nursing-licence tutors. Many teach at Putalisadak or Bagbazar coaching centres and want their own brand.
3. **Foreign-employment and study-abroad language tutors:** Korean EPS-TOPIK, Japanese JLPT/NAT, IELTS/PTE. Learners are highly motivated and ready to pay.
4. **Nepali tech and skills YouTubers** with 10k–200k subscribers: coding, Excel/Tally/accounting, graphic design, digital marketing, freelancing on Fiverr/Upwork.
5. **CA/CS/ACCA and +2 subject teachers** with established followings.

**Outreach sequence** (weeks −4 to 0 before public launch):
1. Build a shortlist of **60** by scraping YouTube search in Nepali and English plus Facebook education pages. Rank by audience size × payment likelihood.
2. Personal DM, then a phone call. The founder does this, not a form. Pitch: _"Your own paid course page, paid via eSewa/Khalti, your own referral link where we take only 30%, we set it all up for you."_
3. Goal: **20 onboarding calls → 15 committed → 10–15 published courses** before public launch.

**What we do for them** (the white-glove beta):
- A 30-minute onboarding call, where we create the instructor profile and do phone verification with them.
- **We upload and structure the first course,** with sections, preview lesson and description, from their files (Google Drive handoff).
- A free course thumbnail and description copy-edit.
- A **founding-creator deal:** the platform fee is reduced (e.g. a flat 20%) for the first 90 days, paid as a manual top-up (see §3.2). A "Founding Creator" badge on their profile.
- A **guaranteed weekly payout** (every Friday) with a personal WhatsApp/Viber line to the founder. Payout trust is the reason creators stay.
- Their `?ref=` link and a ready-made launch kit: a promo code, a Reels/Shorts script, poster templates.
- A featured slot on the homepage at launch.

**Creator-side exit criteria before public launch:** ≥10 approved products with a playable preview, across ≥3 verticals, and ≥5 creators who have posted about it to their audience.

### 3.5 Demand side: Nepal-specific channels
In priority order:
1. **Creators' own audiences via `?ref=` links.** This is the primary channel, and it's already built (`middleware.ts` referral cookie → 30% fee bucket). It aligns incentives: creators earn 70% on their own traffic.
2. **Facebook groups and pages.** Loksewa, entrance-prep, EPS-TOPIK and IT-jobs groups have hundreds of thousands of members. Post the **free preview lesson** as the hook, never a bare sales link.
3. **TikTok, Reels and YouTube Shorts:** 30–60-second clips cut from preview lessons, in Nepali, by the creators themselves.
4. **Viber and Messenger communities:** classroom and batch groups the tutors already run.
5. **Launch-week promo codes:** creator-scoped, 30–50% off for the first 72 hours. That needs task 6's scoping fix and task 10.
6. **Campus ambassadors** at TU-affiliated colleges, Pulchowk/Thapathali, KU and Pokhara colleges. They get a referral code and a commission paid manually.
7. **Local tech and startup press:** Techpana, TechLekh, ICT Samachar, Nepali startup communities. Angle: "Nepal's own Udemy — pay with eSewa/Khalti, verifiable certificates."
8. **Later (post-launch):** a feature on the eSewa/Khalti "offers" pages (a partnership ask once there's volume); SEO for Nepali exam-prep keywords; Google/Meta ads only once conversion is known.

**Messaging pillars:** pay in rupees with the wallet you already use · watch on your phone · a certificate with a QR code employers can verify · learn from teachers you already follow.

### 3.6 Launch sequence and success metrics

| Stage | When | What happens | Exit / success metrics |
|---|---|---|---|
| **0. Internal dogfood** | Weeks 1–3 (during tasks 1–20) | `PAYMENT_MODE=sandbox` on a production-like deploy. The team runs the §2.9 smoke tests on every gateway | 10 sandbox purchases per configured gateway; **0** purchases stuck `pending` after the cron; 0 P0/P1 bugs open |
| **1. Private creator beta** | Weeks 2–4 (overlaps) | 10–20 invited creators onboard and publish; admin approves. Still sandbox | ≥10 approved products; every preview plays on a mid-range Android over 4G; median creator time-to-publish <3 days with our help |
| **2. Soft launch, real money** | Weeks 4–6, as soon as the first gateway is live | `PAYMENT_MODE=live` with whichever gateways are approved. Traffic **only** from creators' own audiences (no press) | First **100 paid purchases**; per-gateway success rate (completed ÷ initiated) **≥85%**; **0** paid-without-access cases older than 24 hours; refund rate **<5%**; first weekly payout run on time; support first response <12 hours |
| **3. Public launch** | About week 6–8 | Press, ambassadors, Facebook/TikTok push, launch promo week | Weekly paid purchases and weekly GMV (NPR) growing week over week; visitor → purchase conversion on product pages (target ≥1.5%); **≥50%** of sales via creator `?ref=` links; **≥60%** of creators with ≥1 sale; lesson-1 completion ≥60% of buyers; ≤5 support tickets per 100 orders |

### 3.7 Risks and the first-30-day watchlist

**Risks**
| Risk | Likelihood / impact | Mitigation |
|---|---|---|
| Gateway merchant approval takes weeks (legal entity, PAN, bank letters, site review) | High / blocks revenue | Start KYC **now**; launch on whichever gateway approves first; §2.2 hides the rest; live legal pages (task 15) are part of the review |
| Paid but no access (tab closed, network drop) | Medium / trust-destroying | Cron (task 9), admin re-check button, "I was charged" support path, daily query below |
| Piracy: screen recording or reuploads of paid courses | High (eventually) / creator churn | DMCA page and takedown process; move to Bunny + watermarking on the first confirmed leak |
| Video playback on slow mobile data | Medium / refunds and churn | 720p H.264 guidance, file limits, YouTube-unlisted fallback for previews |
| Creators churn after slow first sales | High / supply collapse | White-glove launch kit, founder check-ins, feature slots, weekly payouts |
| Commission perception (50% on platform-sourced sales) | Medium | Lead with "70% on your own audience"; founding deal; revisit rates at 90 days with data |
| Content-rights disputes (coaching-centre material, copied books) | Medium | Rights attestation in the creator terms; manual approval; fast takedown |
| Tax and legal readiness (company, PAN, invoices, VAT threshold) | Medium | Invoice numbering already fiscal-year based; register VAT when required; accountant on retainer |
| Single admin bottleneck (approvals, payouts, refunds, support) | High at launch | Batch ops windows (daily approvals, Friday payouts); saved queries; delegate support once past 100 orders a week |
| Security incident via an unfixed gap | Low after tasks 4–6 | Run `/security-review` on the payments PR; re-run this audit before Stage 3 |

**Daily watchlist, first 30 days** (saved SQL + Sentry):
- Purchases `status='pending'` older than 1 hour (should be ~0 after the cron).
- Purchases `status='disputed'` (amount mismatch); count per gateway.
- Initiated → completed rate, per gateway per day.
- Verify-call errors and latency, per gateway (Sentry).
- `/deliver` 4xx/5xx rate; video-related support tickets.
- Refund requests pending; refund rate by course (flag any course >10%).
- Payout requests pending and their age.
- Products waiting in `pending_review`, and their age.
- New reports.
- Signups → first purchase conversion; share of purchases via `?ref=`.
- Top-selling creators and creators with zero sales (the latter get a check-in call).

---

## Assumptions
- **Roadmap:** the existing 8-phase roadmap isn't in the repo; it was re-prioritized from the summary in the brief. Phases 1 (trust/legal), 5 (payments/payouts) and parts of 2 (rate limiting: minimal) and 4 (moderation: manual) are pulled into launch. Phase 3's cost-control video pipeline is reduced to upload limits. Phases 6–8 (student success, growth, analytics/offline) go after launch.
- **Hosting:** Vercel for both apps, with Vercel Cron for reconciliation, plus managed Postgres. On other hosting, swap Vercel Cron for any scheduler that hits the endpoint with `CRON_SECRET`.
- **Commission rates:** as in the code today, 30% via the creator's own link and 50% otherwise (`src/lib/comissionRate.ts`).
- **Refund policy:** as in the code and ToS, 7 days and <20% completion.
- **Gateway endpoints and test credentials:** listed from the current code and the gateways' public docs as known; **confirm against each gateway's current docs** at integration time. Live URLs especially.
- **Onboarding order:** Khalti tends to onboard fastest, then eSewa; Fonepay requires a bank relationship. Adjust to reality.
- **Legal text:** needs review by a Nepali lawyer before Stage 2.
- **Effort estimates:** assume one full-time developer familiar with the codebase.
