# Mobile API (v1)

The API the Chiyali React Native app uses. Everything lives under `/api/v1` on the site, and sign-in lives under Better Auth's `/api/auth`. The v1 routes call the same server actions as the web app, so checkout, refunds, reviews, Q&A and access rules behave exactly as they do on the site.

## Turning it on

User routes (anything that needs a signed-in user) return **404** unless `MOBILE_API_ENABLED=true` is set. Public catalogue routes are always on. Set it in `.env.local` while you build the app, and in Vercel when the app ships.

## Conventions

- **Base URL:** `https://chiyali.com/api/v1`. Locally: `http://<your LAN IP>:3000/api/v1`.
- **Auth:** send `Authorization: Bearer <token>` on every request (see [Signing in](#signing-in)).
- **Bodies:** JSON in, JSON out. Send `Content-Type: application/json`.
- **Errors:** always `{ "message": "..." }`. The message is safe to show the user.

| Status | Meaning |
| --- | --- |
| 400 | Invalid input. The message names the field, e.g. `body: Add a bit more detail`. |
| 401 | Not signed in, or the token expired. Send the user to sign-in. |
| 403 | Signed in but not allowed, e.g. the course isn't bought. |
| 404 | Doesn't exist, isn't yours, or `MOBILE_API_ENABLED` is off. |
| 409 | Conflict, e.g. reviewing a course you already reviewed. |
| 500 | Server error, already reported to Sentry. Show a generic retry. |

- **Money:** prices shown to buyers are whole rupees (`priceInRupees`). Amounts actually charged are paisa (`pricePaidInPaisa`, divide by 100).
- **Dates:** ISO 8601 strings, in UTC.
- **Never cache** anything from a user route, and never cache the signed media URLs.

## Signing in

Better Auth issues a session token, and its `bearer` plugin accepts that token in the `Authorization` header. Keep the token in `expo-secure-store`.

**Required on every request to `/api/auth`:**
- `credentials: "omit"`
- an `Origin: chiyali://` header, with `chiyali://` listed in `BETTER_AUTH_TRUSTED_ORIGINS`

iOS keeps cookies from responses automatically. Once a cookie is present, Better Auth checks the request's `Origin` header, and a React Native request has none. Without these two settings, sign-out and profile updates fail with `MISSING_OR_NULL_ORIGIN`.

| Action | Request | Notes |
| --- | --- | --- |
| Sign up | `POST /api/auth/sign-up/email` `{ name, username, email, password }` | Token is in the `set-auth-token` response header. `username` is required: 3-30 letters, numbers, `.` or `_` |
| Username free? | `POST /api/auth/is-username-available` `{ username }` | `{ available }` |
| Sign in (email) | `POST /api/auth/sign-in/email` `{ email, password }` | Token is in the `set-auth-token` response header |
| Sign in (username) | `POST /api/auth/sign-in/username` `{ username, password }` | Same response as email sign-in |
| Sign in (Google) | `POST /api/auth/sign-in/social` `{ provider: "google", idToken: { token } }` | `token` = the ID token from native Google Sign-In |
| Current session | `GET /api/auth/get-session` | `null` when the token is invalid |
| Update profile | `POST /api/auth/update-user` `{ name?, username?, displayUsername? }` | Name 2-100 characters; username rules as sign-up, and unique |
| Sign-in methods | `GET /api/auth/list-accounts` | `[{ providerId }]`: `credential` (password), `google`, `github` |
| Change password | `POST /api/auth/change-password` `{ currentPassword, newPassword, revokeOtherSessions? }` | Same rules as sign-up, and can't be the current password. With `revokeOtherSessions: true` every session ends, this one too: switch to the `token` in the response |
| Forgot password | `POST /api/auth/request-password-reset` `{ email, redirectTo: "/reset-password" }` | Always succeeds. The emailed link opens the website's reset page, which signs out every device |
| Sign out | `POST /api/auth/sign-out` | Then delete the stored token |

**Password rules:** sign-up and password changes are rejected (400, with the reason in `message`) unless the password has 12-128 characters with a lowercase letter, an uppercase letter, a number and a symbol. It also can't contain the user's name, username or email, or common words, repeats (`aaa`) or runs (`1234`). Passwords found in known data breaches are rejected too. The rules are in `apps/web/src/lib/passwordPolicy.ts`. Mirror them in the app's form, and offer the platform password manager: `textContentType="newPassword"` on iOS, `autoComplete="password-new"` on Android.

**Google on mobile:** Better Auth checks that the ID token's audience is the configured `GOOGLE_CLIENT_ID`. Request the ID token for that web client ID: `webClientId` in `@react-native-google-signin/google-signin`. The Android and iOS client IDs only sign the user in on the device.

```ts
const res = await fetch(`${SITE}/api/auth/sign-in/email`, {
  method: "POST",
  credentials: "omit",
  headers: { "Content-Type": "application/json", Origin: "chiyali://" },
  body: JSON.stringify({ email, password }),
});
const token = res.headers.get("set-auth-token"); // store it
```

## Endpoints

"User" = needs a Bearer token and `MOBILE_API_ENABLED`. "Public" = no token needed.

### App and catalogue

| Method | Path | Access | Returns |
| --- | --- | --- | --- |
| GET | `/config` | Public | `siteUrl`, `supportEmail`, enabled payment `gateways`, `policy` numbers (refund window, fees, and so on), `legal.pages` (open `siteUrl + path` — the website holds the only copy of the text), `company` details |
| GET | `/categories` | Public | `[{ id, name, slug }]` |
| GET | `/search?q=&categoryId=&minPrice=&maxPrice=&minRating=&sort=&page=` | Public | `{ page, results[] }`, 20 per page. `sort`: `relevance`, `rating`, `newest`, `price_asc`, `price_desc` |
| GET | `/products?limit=` | Public | All public products, A–Z (the website's featured order), with `avgRating` and `reviewCount` |
| GET | `/products/:productId` | Public | Details, `authorName` ("Created by"), `instructor` (or `null`), `courses[]`, `averageRating`, `reviewCount` |
| GET | `/products/:productId/reviews?page=` | Public | Rating summary and reviews, 20 per page |
| GET | `/products/:productId/me` | User | `{ owned, wishlisted, latestPurchase }`: whether to show Buy or Go to course |
| GET | `/courses/:courseId` | Public | Outline as the product page shows it (public sections, public and preview lessons) |
| GET | `/courses/:courseId/reviews` | Public (published courses; or your own course) | `{ averageRating, reviewCount, reviews[] }`, newest first; each review has `edited` and `isMine` |
| GET | `/instructors/:handle` | Public | Profile, `products` (public, A–Z) and `courses` (the website's list: courses in a public product) |
| GET | `/certificates/verify/:code` | Public | What the public verify page shows |

### Me and learning

| Method | Path | Access | Returns |
| --- | --- | --- | --- |
| GET | `/me` | User | Profile, `role`, `instructor` (or `null`) |
| GET | `/me/courses` | User | The website's "My courses": courses the user can open, A–Z, with `totalSections`, `totalLessons`, `completedLessons` (published lessons only) |
| GET | `/me/courses/:courseId` | User | Player outline: `sections[].lessons[]` with `isComplete` and `isPreview`, progress, and `myReview`. 403 if not bought. `review: { canWrite, completionPercent, requiredPercent }` (a review needs 50% of published lessons) |
| GET | `/lessons/:lessonId` | User, or signed out for preview lessons | Lesson, `isComplete`, `assets[]` (each with a `url` to the next row) |
| GET | `/lessons/:lessonId/assets/:assetId` | Same as the lesson | A playable URL, see [Playing lessons](#playing-lessons) |
| POST | `/lessons/:lessonId/complete` | User | Marks it complete. Includes `certificate` once the course is finished |
| DELETE | `/lessons/:lessonId/complete` | User | Marks it not complete |
| GET | `/lessons/:lessonId/questions` | User who can open the lesson | Q&A, with `author.isMine` and `author.isInstructor` |
| POST | `/lessons/:lessonId/questions` | Buyer | `{ body }` (10 to 2000 characters) |
| POST | `/questions/:questionId/replies` | Buyer or instructor | `{ body }` (1 to 2000 characters). Emails the asker |
| POST | `/courses/:courseId/review` | Buyer with 50% or more completed | `{ rating: 1-5, content? }` |
| PUT | `/courses/:courseId/review` | Author of the review | Same body. Clears the instructor's reply |
| DELETE | `/courses/:courseId/review` | Author of the review | |
| GET | `/certificates` | User | Certificates, each with a `verifyUrl` |
| GET | `/certificates/:certificateId` | User | One certificate |

### Buying

| Method | Path | Access | Returns |
| --- | --- | --- | --- |
| POST | `/checkout/discount` | User | `{ code, productId }` gives a price preview. Nothing is reserved |
| POST | `/checkout` | User | Starts a checkout, see [Checkout](#checkout) |
| POST | `/purchases/:purchaseId/confirm` | User (owner) | `{ status: "completed" \| "pending" \| "failed" }` |
| GET | `/purchases` | User | Purchases, newest first |
| GET | `/purchases/:purchaseId` | User (owner) | Details and the latest `refundRequest` |
| GET | `/purchases/:purchaseId/refund` | User (owner) | `{ eligible, msRemaining, completionPercent, openRequestStatus }` |
| POST | `/purchases/:purchaseId/refund` | User (owner) | `{ reason? }` requests a refund |

### Saved, support and reports

| Method | Path | Access | Returns |
| --- | --- | --- | --- |
| GET | `/wishlist` | User | Saved products, newest first; `available: false` once a product is unpublished |
| POST | `/wishlist` | User | `{ productId }` |
| DELETE | `/wishlist/:productId` | User | |
| GET | `/support` | User | Tickets, most recently active first |
| POST | `/support` | User | `{ subject, message, category? }` returns the new ticket |
| GET | `/support/:ticketId` | User (owner) | Ticket with messages |
| POST | `/support/:ticketId/messages` | User (owner) | `{ content }` returns the updated ticket |
| POST | `/reports` | User | `{ targetType: "product" \| "lesson", targetId, reason, details? }`. `reason` is one of `scam`, `piracy`, `misleading`, `inappropriate`, `other` |

## Checkout

1. When the checkout screen opens, make one `checkoutId` with `crypto.randomUUID()`. Reuse it for retries and double taps, so they return the same purchase instead of charging twice.
2. Optionally preview a code with `POST /checkout/discount`.
3. Call `POST /checkout` with `{ productId, gateway, checkoutId, discountCode? }`. `gateway` must be one of `config.gateways`.
4. Act on `next`:

| `next.type` | What the app does |
| --- | --- |
| `redirect` | Open `next.url` in a WebView. If `next.method` is `POST`, load an HTML form that posts `next.formFields` to `next.url` (eSewa does this). When the WebView reaches a page under `${config.siteUrl}/products/`, the payment has finished: close it and go to step 5. |
| `qr` | Fonepay. Show `next.qrString` as a QR code until `next.expiresAt`, and poll step 5 every 3 to 5 seconds. |
| `enrolled` | A 100% discount code. Access is already granted, so open `/me/courses`. |

5. Call `POST /purchases/:purchaseId/confirm`. `completed` means the course is unlocked. `pending` means ask again shortly. `failed` means offer a new checkout.

Confirmation asks the payment gateway directly, so it works even if the user closed the WebView early. The daily reconcile job also catches anything left pending.

```ts
// eSewa: POST the form fields inside the WebView
const html = `<form id="f" method="POST" action="${next.url}">${Object.entries(next.formFields)
  .map(([k, v]) => `<input type="hidden" name="${k}" value="${v}">`).join("")}</form>
  <script>document.getElementById("f").submit()</script>`;
<WebView source={{ html }} onNavigationStateChange={({ url }) => {
  if (url.startsWith(`${config.siteUrl}/products/`)) finish();
}} />
```

## Playing lessons

`GET /lessons/:lessonId/assets/:assetId` returns one of these:

| `type` | Use |
| --- | --- |
| `inline` | A signed file URL (video or PDF). Play or view it directly. It expires, so ask again after a long pause. |
| `download` | A signed URL for a downloadable file |
| `bunny_embed` | A Bunny Stream player URL. Load it in a WebView. |
| `youtube` | `externalId` of a YouTube video. Free preview lessons only. |

Video URLs last up to twice the video's length, with a 3-hour cap. Documents last 15 minutes.

## Not in v1 yet

- **Teaching from the app:** creating or editing courses, uploading, sales and payouts. Instructors use the web studio.
- **Referral links:** `?ref=` attribution is cookie-based on the web, so a purchase in the app isn't credited to the instructor's link.
- **Certificate PDFs:** there's no PDF download. The app shows the certificate with its QR code and shares the `verifyUrl`.
