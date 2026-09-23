# Server action authorization

Every exported server action in `apps/web` (`"use server"` modules plus the inline action on the purchase page), and the authorization it enforces **server-side**. Swept on 2026-09-23 on branch `fix/security`.

A server action is a public HTTP endpoint. Any signed-in (or signed-out) client can call it with any arguments, including arguments bound with `.bind()`, which Next.js does **not** encrypt. The UI hiding a button is never the check.

**Levels:**
- **none:** anyone, including signed-out visitors (intentionally public data only).
- **signed-in:** any authenticated user, acting only on their own data.
- **owner:** the resource must belong to the caller. The "Rule" column says what "belongs" means.
- **admin:** `requireAdmin()` (`src/services/auth.ts`). Non-admins get `notFound()`, which throws before any work is done.

Roles are read fresh from the database on every request (`getUser` is memoized per request only), so a role change applies on the next request.

**Status:** ✅ correct before this sweep · 🔧 **fixed in this batch** (the task number or "sweep" says where).

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
| `features/lessons/actions/lessonAssets.ts` | `requestLessonAssetUploadUrl` | owner | lesson's course author or admin | ✅ |
| | `removeLessonAsset` | owner | lesson's course author **and** the asset belongs to that lesson | 🔧 sweep: any asset ID could be deleted via a lesson the caller owned |
| | `listLessonAssetsForEditor` | owner | lesson's course author or admin | ✅ |
| `features/lessons/actions/lessons.ts` | `createLesson` | owner | caller authors the target section's course | ✅ |
| | `updateLesson` | owner | caller authors the lesson **and** the target `sectionId` | 🔧 sweep: `sectionId` from the form was unchecked, so a lesson could be moved into another creator's course |
| | `deleteLesson` | owner | lesson's course author or admin | ✅ |
| | `updateLessonOrders` | owner | **every** lesson ID is the caller's | 🔧 sweep: only the first ID was checked |
| `features/lessons/actions/userLessonComplete.ts` | `updateLessonCompleteStatus` | owner | caller has access to the lesson's course; writes only the caller's progress | ✅ |
| `features/payouts/actions/payouts.ts` | `requestPayout` | signed-in | caller's own balance | ✅ (see Found list) |
| | `approvePayout` | admin | `requireAdmin()` | 🔧 task 4: was a cached-role check |
| | `denyPayout` | admin | `requireAdmin()` | 🔧 task 4: was a cached-role check |
| | `getMyAvailableBalanceInRupees` | signed-in | caller's own balance | ✅ |
| `features/products/actions/products.ts` | `createProduct` | signed-in | author = caller; **every bundled course is the caller's** | 🔧 sweep: any course could be bundled, so another creator's paid course could be sold at ₹0 / enrolled free |
| | `updateProduct` | owner | product owner **and** every bundled course is the caller's | 🔧 sweep: same bug as `createProduct` |
| | `deleteProduct` | owner | product owner or admin | ✅ |
| `features/purchases/actions/purchases.ts` | `initiatePurchase` | signed-in | buys for the caller only | ✅ (see Found list) |
| | `confirmPurchase` | owner | `purchase.userId` = caller | 🔧 task 5: had no check |
| | `revokeAccess` | admin | `requireAdmin()` | 🔧 task 5: any signed-in user could revoke any purchase |
| `app/(consumer)/products/[productId]/purchase/page.tsx` (inline) | `enrollInFreeProduct` | signed-in | public product **with price 0** | 🔧 sweep: price was never checked, so any public **paid** product could be enrolled for free by calling the action with its ID |
| `features/refunds/actions/refunds.ts` | `checkMyRefundEligibility` | owner | `purchase.userId` = caller | ✅ |
| | `requestRefund` | owner | `purchase.userId` = caller | ✅ |
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

- **55 server actions** in total: 54 exported from 20 `"use server"` feature modules, plus the inline `enrollInFreeProduct`.
- **15 had a hole that let a user read or change data that isn't theirs, and are fixed:**
  - Task 4: `createCategory`, `deleteCategory`.
  - Task 5: `revokeAccess`, `confirmPurchase`.
  - Task 6: `updateDiscountCodeAction`.
  - Sweep: `createSection`, `updateSection`, `deleteSection`, `updateSectionOrders`, `updateLessonOrders`, `updateLesson`, `removeLessonAsset`, `createProduct`, `updateProduct`, `enrollInFreeProduct`.
- **5 were already correct but moved to `requireAdmin()`** so their role check reads a fresh role: `revokeCertificate`, `approvePayout`, `denyPayout`, `hideReview`, `updateSupportTicketStatus`.
- **3 are intentionally public:** `getCertificateForVerification`, `getInstructorPublishedCourses`, `searchProductsAction`.

Not in scope of this table: the `/api/v1/*` route handlers and `/api/lessons/.../deliver`, which are route handlers, not server actions. See the Found list in the batch report.
