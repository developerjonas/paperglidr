# Server action authorization

Every exported server action in `apps/web` (`"use server"` modules plus the inline action on the purchase page), and the authorization it enforces **server-side**. Swept on 2026-09-23 on branch `fix/security`.

A server action is a public HTTP endpoint. Any signed-in (or signed-out) client can call it with any arguments, including arguments bound with `.bind()`, which Next.js does **not** encrypt. The UI hiding a button is never the check.

**Levels:**
- **none:** anyone, including signed-out visitors (intentionally public data only).
- **signed-in:** any authenticated user, acting only on their own data.
- **owner:** the resource must belong to the caller. The "Rule" column says what "belongs" means.
- **admin:** `requireAdmin()` (`src/services/auth.ts`). Non-admins get `notFound()`, which throws before any work is done.

Roles are read fresh from the database on every request (`getUser` is memoized per request only), so a role change applies on the next request.

**Status:** ✅ correct before this sweep · 🔧 **fixed in this batch** (the task number or "sweep" says where) · 🆕 added later (branch named).

## Table

| Module (`src/…`) | Action | Level | Rule enforced | Status |
|---|---|---|---|---|
| `features/categories/actions/categories.ts` | `createCategory` | admin | `requireAdmin()` | 🔧 task 4: had **no check at all** |
| | `deleteCategory` | admin | `requireAdmin()` | 🔧 task 4: had **no check at all** |
| `features/certificates/actions/certificates.ts` | `getCertificateForViewing` | owner | certificate holder or admin | ✅ |
| | `getCertificateForVerification` | none | intentionally public (QR verification) | ✅ |
| | `revokeCertificate` | admin | `requireAdmin()` | 🔧 task 4: was a cached-role check |
| `features/courseSections/actions/sections.ts` | `createSection` | owner | caller authors the course | 🔧 sweep: permission check was **not awaited** (a Promise is truthy), so anyone, even signed out, could add sections to any course |
| | `updateSection` | owner | caller authors the section's course | 🔧 sweep: not awaited **and** passed a cache-tag string instead of the section ID, so anyone could edit any section |
| | `deleteSection` | owner | caller authors the section's course | 🔧 sweep: same bug as `updateSection`, so anyone could delete any section |
| | `updateSectionOrders` | owner | **every** section ID is the caller's | 🔧 sweep: only the first ID was checked |
| `features/courses/actions/courses.ts` | `createCourse` | signed-in | author = caller; creation cap | ✅ |
| | `updateCourse` | owner | course author or admin | ✅ |
| | `deleteCourse` | owner | course author or admin | ✅ |
| `features/discounts/actions/discounts.ts` | `createDiscountCode` | signed-in | creator = caller; product-scoped codes only on the caller's own product (`product.authorId`) | 🔧 task 6: switched to `canScopeDiscountToProduct`, the same rule as update |
| | `updateDiscountCodeAction` | owner | code creator or admin; **new** target product must be the caller's | 🔧 task 6: could re-point a code at another creator's product |
| | `deleteDiscountCodeAction` | owner | code creator or admin | ✅ |
| | `applyDiscountCode` | signed-in | preview only; `validateDiscountCode` scopes storewide codes to the creator's products | 🔧 task 6 (validator) |
| `features/instructors/actions/instructors.ts` | `saveInstructorProfile` | signed-in | upserts the caller's own profile; handle can't be taken from another user | ✅ |
| | `getInstructorPublishedCourses` | none | public data (published courses of an instructor) | ✅ |
| `features/instructors/actions/phoneOtp.ts` | `requestInstructorPhoneOtp` | signed-in | caller's own instructor profile | ✅ |
| | `verifyInstructorPhoneOtp` | signed-in | caller's own profile; hashed code, 5 attempts | ✅ |
| `features/lessonQuestions/actions/lessonQuestions.ts` | `askLessonQuestion` | owner | caller has purchased the course | ✅ |
| | `replyToLessonQuestion` | owner | purchaser, course author, or admin | ✅ |
| `features/images/actions/imageUploads.ts` | `requestImageUploadUrl` | signed-in | staging key is under the caller's own `image-uploads/<purpose>/<userId>/`; JPEG/PNG/WebP ≤ 5 MB | 🆕 fix/funnel |
| | `confirmImageUpload` | signed-in | only the caller's own staging keys (exact key shape); checks size, type and file signature before copying to the public bucket | 🆕 fix/funnel |
| `features/lessons/actions/lessonAssets.ts` | `requestLessonAssetUploadUrl` | owner | lesson's course author or admin; type and size per `uploadRules.ts` | ✅ (rules added in task 12) |
| | `confirmLessonAssetUpload` | owner | lesson's course author or admin **and** the asset belongs to that lesson | 🆕 task 12 |
| | `removeLessonAsset` | owner | lesson's course author **and** the asset belongs to that lesson | 🔧 sweep: any asset ID could be deleted via a lesson the caller owned |
| | `listLessonAssetsForEditor` | owner | lesson's course author or admin | ✅ |
| `features/lessons/actions/lessons.ts` | `createLesson` | owner | caller authors the target section's course | ✅ |
| | `updateLesson` | owner | caller authors the lesson **and** the target `sectionId` | 🔧 sweep: `sectionId` from the form was unchecked, so a lesson could be moved into another creator's course |
| | `deleteLesson` | owner | lesson's course author or admin | ✅ |
| | `updateLessonOrders` | owner | **every** lesson ID is the caller's | 🔧 sweep: only the first ID was checked |
| `features/lessons/actions/userLessonComplete.ts` | `updateLessonCompleteStatus` | owner | caller has access to the lesson's course; writes only the caller's progress | ✅ |
| `features/payouts/actions/payouts.ts` | `requestPayout` | signed-in | caller's own balance; verified phone required; only sales past the refund window count; check + insert in one transaction with the instructor row locked | 🔧 task 17: two concurrent requests could spend the same balance, fresh (still refundable) sales were withdrawable, and non-validation errors were returned raw |
| | `approvePayout` | admin | `requireAdmin()` | 🔧 task 4: was a cached-role check |
| | `denyPayout` | admin | `requireAdmin()` | 🔧 task 4: was a cached-role check |
| | `getMyBalancesInRupees` | signed-in | caller's own available and held balance | ✅ (renamed in task 17) |
| `features/products/actions/products.ts` | `createProduct` | signed-in | author = caller; **every bundled course is the caller's** | 🔧 sweep: any course could be bundled, so another creator's paid course could be sold at ₹0 / enrolled free |
| | `updateProduct` | owner | product owner **and** every bundled course is the caller's | 🔧 sweep: same bug as `createProduct` |
| | `deleteProduct` | owner | product owner or admin | ✅ |
| `features/purchases/actions/purchases.ts` | `initiatePurchase` | signed-in | buys for the caller only | ✅ (see Found list) |
| | `confirmPurchase` | owner | `purchase.userId` = caller | 🔧 task 5: had no check |
| | `revokeAccess` | admin | `requireAdmin()` | 🔧 task 5: any signed-in user could revoke any purchase |
| `app/(consumer)/products/[productId]/purchase/page.tsx` (inline) | `enrollInFreeProduct` | signed-in | public product **with price 0** | 🔧 sweep: price was never checked, so any public **paid** product could be enrolled for free by calling the action with its ID |
| `features/refunds/actions/refunds.ts` | `checkMyRefundEligibility` | owner | `purchase.userId` = caller | 🔧 fix/money-ops: read `session.user.id`, which `getCurrentUser()` never sets, so it always answered "Not signed in" |
| | `requestRefund` | owner | `purchase.userId` = caller; eligibility recomputed server-side; one open request per purchase (unique index) | 🔧 fix/money-ops: same "Not signed in" bug; stored the product ID as the course ID |
| | `approveRefund` | admin | `requireAdmin()`; request must be pending (row locked); revoke runs in the same transaction | 🆕 task 16 |
| | `rejectRefund` | admin | `requireAdmin()`; pending only | 🆕 task 16 |
| `features/reports/actions/reports.ts` | `reportCourse` | signed-in | reporter = caller | ✅ |
| `features/reviews/actions/reviews.ts` | `createReview` | signed-in | ≥50% course completion; one per course | ✅ |
| | `updateReview` | owner | review author | ✅ |
| | `deleteReview` | owner | review author | ✅ |
| | `hideReview` | admin | `requireAdmin()` | 🔧 task 4: was a cached-role check |
| | `replyToReview` | owner | course author or admin | ✅ |
| | `deleteReply` | owner | course author or admin | ✅ |
| `features/search/actions/search.ts` | `searchProductsAction` | none | public catalogue search | ✅ |
| `features/support/actions/supportTickets.ts` | `createSupportTicket` | signed-in | ticket user = caller | ✅ |
| | `replyToSupportTicket` | owner | ticket owner or admin; not when closed | ✅ (role now fresh) |
| | `updateSupportTicketStatus` | admin | `requireAdmin()` | 🔧 task 4: was a cached-role check |
| `features/wishlist/actions/wishlist.ts` | `toggleWishlist` | signed-in | caller's own wishlist | ✅ |

## Summary

- **58 server actions** in total: 57 exported from 21 `"use server"` feature modules, plus the inline `enrollInFreeProduct`. (55 at the security sweep; `fix/funnel` added `confirmLessonAssetUpload`, `requestImageUploadUrl` and `confirmImageUpload`.)
- **15 had a hole that let a user read or change data that isn't theirs, and are fixed:**
  - Task 4: `createCategory`, `deleteCategory`.
  - Task 5: `revokeAccess`, `confirmPurchase`.
  - Task 6: `updateDiscountCodeAction`.
  - Sweep: `createSection`, `updateSection`, `deleteSection`, `updateSectionOrders`, `updateLessonOrders`, `updateLesson`, `removeLessonAsset`, `createProduct`, `updateProduct`, `enrollInFreeProduct`.
- **5 were already correct but moved to `requireAdmin()`** so their role check reads a fresh role: `revokeCertificate`, `approvePayout`, `denyPayout`, `hideReview`, `updateSupportTicketStatus`.
- **3 are intentionally public:** `getCertificateForVerification`, `getInstructorPublishedCourses`, `searchProductsAction`.

# Route handlers

Route handlers (`app/api/**/route.ts`) are public HTTP endpoints too. Swept on 2026-09-23 on branch `fix/funnel`. Same levels as above.

**Mobile API flag.** The mobile app isn't launching. Every **user-specific** `/api/v1` route starts with `mobileApiDisabled()` (`src/lib/mobileApi.ts`) and answers **404** unless `MOBILE_API_ENABLED=true`, which defaults to off. The rule column describes what applies once the flag is on. Public catalogue routes aren't behind the flag.

Sessions: `auth.api.getSession` reads the web cookie or a Bearer token (Better Auth `bearer` plugin), so the same rules apply to mobile clients.

| Route | Method | Level | Rule enforced | Flag | Status |
|---|---|---|---|---|---|
| `/api/lessons/[lessonId]/assets/[assetId]/deliver` | GET | none / owner | `canAccessLessonContent`: admins and the course author get every lesson; a **preview** lesson plays for anyone, signed out included; a **private** lesson is for nobody else; other lessons need purchased access **and** a public section. Unknown lesson 404, sign-in needed 401, no access 403. The asset must belong to the lesson and be `ready`. Signed URLs: documents 15 min, videos 2× duration (30 min if unknown), capped at 3 h. `Cache-Control: private, no-store` | — | 🔧 task 11: previews needed a purchase (so they never played signed out), and authors/admins were refused; 🔧 task 12: `ready` only |
| `/api/v1/products` | GET | none | public products only (`status = public`); listing fields only | always on | ✅ |
| `/api/v1/products/[productId]` | GET | none | public products only; product-page fields only | always on | 🔧 sweep: returned **private (unpublished) products** by ID, and every column (`authorId`, `searchVector`, …) |
| `/api/v1/courses` | GET | none | public products only (same listing as above) | always on | ✅ |
| `/api/v1/courses/[courseId]` | GET | none | a course in at least one public product; public sections; public/preview lessons; names and order only | always on | 🔧 sweep: returned **any** course, including drafts, with its private sections and lessons and `authorId` |
| `/api/v1/instructors/[handle]` | GET | none | public profile fields only (handle, name, bio, photo, verified) plus public products | always on | 🔧 sweep: returned the whole instructor row, including **phone number** and `userId`; its course list compared `authorId` with the instructor's row ID, so it was always empty |
| `/api/v1/me/courses` | GET | signed-in | caller's own courses | 🔒 | ✅ |
| `/api/v1/purchases` | GET | signed-in | caller's own purchases | 🔒 | ✅ |
| `/api/v1/certificates` | GET | signed-in | caller's own certificates | 🔒 | ✅ |
| `/api/v1/certificates/[certificateId]` | GET | owner | certificate holder = caller, else 404 | 🔒 | ✅ |
| `/api/v1/lessons/[lessonId]` | GET | owner | `canViewLesson` (admin, course author, preview, or purchased access to a public lesson); `ready` assets only, no `storageKey` | 🔒 | ✅ (author access from task 11) |
| `/api/v1/lessons/[lessonId]/complete` | POST | owner | `canViewLesson`; writes only the caller's progress | 🔒 | ✅ |
| `/api/v1/support` | GET | signed-in | caller's own tickets | 🔒 | ✅ |
| `/api/v1/support` | POST | signed-in | ticket user = caller | 🔒 | ✅ |
| `/api/v1/support/[ticketId]` | GET | owner | `getTicketForUser` (ticket owner), else 404 | 🔒 | ✅ |
| `/api/v1/support/[ticketId]/messages` | POST | owner | ticket owner, else 404 | 🔒 | ✅ |
| `/api/v1/wishlist` | GET, POST | signed-in | caller's own wishlist | 🔒 | ✅ |
| `/api/v1/wishlist/[productId]` | DELETE | signed-in | removes from the caller's own wishlist only | 🔒 | ✅ |

Other route handlers were covered in earlier batches: `/api/auth/[...better-auth]` (Better Auth), `/api/cron/reconcile-payments` (Bearer `CRON_SECRET`), and the payment return routes (see `docs/PAYMENTS.md`).

**Route handler summary:**
- 19 handler/method pairs: the deliver route plus 18 in `/api/v1`, across 16 route files (5 public catalogue, 11 user-specific).
- 11 `/api/v1` user routes (13 method pairs) are behind `MOBILE_API_ENABLED`, off by default.
- 4 had data exposure holes, now fixed:
  - the deliver route (task 11)
  - `/api/v1/products/[id]`
  - `/api/v1/courses/[id]`
  - `/api/v1/instructors/[handle]` (phone numbers)
