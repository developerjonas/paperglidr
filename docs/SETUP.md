# Setup and operations

How Chiyali's infrastructure is set up and kept running: the database, file storage, paid video, monitoring, and deploys. Payments have their own doc, [PAYMENTS.md](./PAYMENTS.md). Commands run from `apps/web/` unless they say otherwise.

**Production today:**
- Vercel (website and API) at `https://www.chiyali.com`; `chiyali.com` redirects there.
- Postgres on Neon.
- Cloudflare R2 for files (PDFs, invoices, images).
- Bunny Stream for paid lesson video (free lessons use YouTube/Vimeo links).
- GlitchTip for errors, with alerts to Discord.
- cron-job.org for the payment cron.
- EAS (Expo) for the Android app.

---

## 1. Database

### The rule: migrations only

| Command | Where | What it does |
|---|---|---|
| `pnpm db:generate --name <change>` | your machine | Diffs `src/drizzle/schema/**` against the last migration and writes a new SQL file to `src/drizzle/migrations/`. **Commit it with the schema change.** |
| `pnpm db:migrate` | every environment | Applies pending migrations (tracked in `drizzle.__drizzle_migrations`). The only way the schema changes in production. |
| `pnpm db:seed` | once per environment (safe to repeat) | Inserts the launch categories; promotes `ADMIN_EMAIL` to admin. |
| `pnpm db:push` | **a local throwaway database only** | Pushes the schema with no migration file. Never against production. |
| `pnpm db:studio` | anywhere | Drizzle Studio in the browser. |

To change the schema:
1. Edit `src/drizzle/schema/*.ts`.
2. Run `pnpm db:generate --name short_description` and read the SQL. Drizzle can miss generated columns, custom SQL and data backfills; edit the file by hand if needed.
3. Run `pnpm db:migrate` against your local database and test.
4. Commit the schema change together with `src/drizzle/migrations/**`, including `meta/`.
5. **In production, run the migration before deploying the code that needs it** (see section 5).

### Environment

`drizzle.config.ts` and the seed read only the database variables (validated in `src/data/env/db.ts`): `DB_HOST`, `DB_PORT` (default 5432), `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_SSL` (default `true`; `false` only for a local Postgres without TLS), and `ADMIN_EMAIL` for the seed. `drizzle.config.ts` also accepts `DATABASE_URL`, which wins over the `DB_*` variables.

`drizzle-kit` and the seed **don't read `.env` files**, so export the variables first:
```sh
cd apps/web
set -a; source .env.local; set +a
pnpm db:migrate
```
(The scripts in `apps/web/scripts/` do load `apps/web/.env` themselves, and print which database they're using before writing anything.)

### Local development

Any Postgres 15+ works. With Docker:
```sh
docker run -d --name chiyali-pg -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=chiyali postgres:17
```
Then set `DB_HOST=localhost DB_USER=postgres DB_PASSWORD=postgres DB_NAME=chiyali DB_SSL=false` and run `pnpm db:migrate && pnpm db:seed`.

### A fresh production database

1. Create the database on the provider (Neon), with TLS required.
2. From a trusted machine (not CI logs), export the `DB_*` variables and run `pnpm db:migrate`. Expect `migrations applied successfully!`.
3. `pnpm db:seed`: `categories: 8 inserted` the first time, `0 inserted, 8 already present` after.
4. Set the app's variables in Vercel (Production) from `apps/web/.env.example`, and deploy.
5. **The admin:** sign up on the site once (email or Google), then run `ADMIN_EMAIL=<that email> pnpm db:seed`. If the user doesn't exist yet, it says so and changes nothing. Roles are read fresh on every request, so `/admin` opens on the next page load. To demote, set `role = 'user'`.

### Tests

Both suites write data, so they need a **throwaway** Postgres (migrated with `pnpm db:migrate`) and refuse to run without an explicit flag.

```sh
cd apps/web
# Unit and integration tests (real Postgres, stub gateway, no network)
TEST_DB_IS_THROWAWAY=1 DB_HOST=… DB_NAME=… pnpm test

# Security smoke test: calls the running app over HTTP like a browser (or an attacker)
# would, then checks the database. Start the app against the same throwaway database first.
SMOKE_TEST_DB_IS_THROWAWAY=1 BASE_URL=http://localhost:3000 CRON_SECRET=… pnpm test:security-smoke
```

The smoke test checks that `/admin` is a 404 for non-admins, that admin-only and owner-only actions change nothing when called by others, discount scoping, and that a forced mid-transaction failure rolls back. Run it after upgrading Next.js, Better Auth or Drizzle, and after changing authorization or purchase code.

---

## 2. File storage (Cloudflare R2)

Two buckets:

| Bucket | Env var | Holds | Who can read it |
|---|---|---|---|
| Private (e.g. `chiyali-private`) | `R2_BUCKET_NAME` | Lesson PDFs and attachments, invoice PDFs, image uploads waiting to be checked (`image-uploads/`), and older MP4 lesson videos (new videos go to Bunny Stream, section 3) | Nobody directly. The app hands out short-lived signed URLs after an access check |
| Public (e.g. `chiyali-images`) | `R2_PUBLIC_BUCKET_NAME` | Product thumbnails (`products/`) and instructor photos (`instructors/`) | Anyone, at `R2_PUBLIC_BASE_URL` (e.g. `https://images.chiyali.com`) |

**Why two buckets:** R2 makes a whole bucket public or private; there's no public folder. Two buckets keep the rule simple: nothing in the private bucket is ever reachable without a signed URL.

**Images are never uploaded straight to the public bucket.** The browser uploads to `image-uploads/` in the private bucket. The server checks the type (JPEG, PNG or WebP, by declared type **and** file signature) and size (5 MB or less), and only then copies the file to the public bucket.

### Steps (Cloudflare dashboard)

1. **Private bucket:** R2 → Create bucket (e.g. `chiyali-private`). Leave **Public access** off; no custom domain, no `r2.dev` URL.
2. **CORS on the private bucket** (browsers upload to it with presigned PUT URLs). Bucket → Settings → CORS policy:
   ```json
   [
     {
       "AllowedOrigins": ["https://www.chiyali.com", "https://chiyali.com"],
       "AllowedMethods": ["PUT", "GET"],
       "AllowedHeaders": ["Content-Type"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```
   `Content-Type` must be allowed, because it's part of the upload signature. Add `http://localhost:3000` only on a dev bucket.
3. **Lifecycle rule on the private bucket:** Settings → Object lifecycle rules → prefix `image-uploads/`, delete after 1 day. This removes uploads that were never confirmed.
4. **Public bucket** (e.g. `chiyali-images`). No CORS needed.
5. **Custom domain for the public bucket:** Settings → Custom Domains → `images.chiyali.com`. Keep the `r2.dev` URL disabled.
6. **Optional:** a Transform Rule on the `chiyali.com` zone adding `X-Content-Type-Options: nosniff` for `images.chiyali.com`.
7. **API token:** R2 → Manage R2 API Tokens → **Object Read & Write**, scoped to these two buckets only. The secret is shown once.
8. **Env vars in Vercel** (Production; Preview with separate dev buckets):
   ```
   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
   R2_BUCKET_NAME=chiyali-private
   R2_PUBLIC_BUCKET_NAME=chiyali-images
   R2_PUBLIC_BASE_URL=https://images.chiyali.com
   NEXT_PUBLIC_IMAGE_HOSTS=images.chiyali.com     # inlined at build: redeploy after changing
   ```

### Check it works

1. Upload an instructor photo: the saved URL starts with `R2_PUBLIC_BASE_URL/instructors/`.
2. Rename a `.txt` to `.png` and upload it: rejected with "That file isn't a valid image".
3. Upload a lesson PDF: it appears in the editor without "upload not finished", and opens.
4. An expired signed URL returns 403. Documents last 15 minutes.
5. `image-uploads/` stays empty after successful uploads.

The payment cron also cleans up lesson uploads that were never confirmed, and deletes replaced lesson files 4 hours later (see PAYMENTS.md, "Cron").

---

---

## 3. Video (Bunny Stream)

Paid lesson videos live in **Bunny Stream**; free lessons and previews stay on YouTube/Vimeo links (cost 0). Creators upload straight from the lesson editor to Bunny (resumable TUS uploads, signed by our server so the API key never reaches the browser); Bunny encodes 240p–720p HLS; students watch in Bunny's player through a signed link that the server issues only after the access check (`/api/lessons/…/deliver`). Code: `src/services/bunny/stream.ts`, `src/features/lessons/lib/bunnyVideos.ts`, `src/app/api/webhooks/bunny-stream/route.ts`.

**Protection, in layers:**
- **No public file:** Bunny serves streaming chunks, never an MP4 (MP4 fallback off), and only to a signed player link (token authentication) from our domains.
- **Paid only, never unlockable:** a lesson with an uploaded video can't become a free preview or join a free course (`features/lessons/lib/freeTier.ts`), and the deliver route never sends it on preview access. A video that finishes encoding after its lesson became free is deleted, not published.
- **Traceable:** the viewer's name and email drift across every paid video (website and app).
- **App:** screenshots and screen recording are blocked while a paid video is on screen (`expo-screen-capture`).
- **Accounts:** at most 2 signed-in devices (`features/users/lib/sessionLimit.ts`); a third sign-in signs out the oldest. Admins are exempt.
- **Later, if needed:** MediaCage Enterprise DRM (Widevine/FairPlay) can be switched on for the same library without re-uploading ($99/month + per licence).

**No surprise bills:**
- Each creator can upload **5 GB** (videos and files together, uploads in progress included); admins change it per creator in `/admin/users/[id]` → Creator profile → Upload storage.
- Uploads not finished within 24 hours are deleted from Bunny; replaced or removed videos are deleted 4 hours later; failed encodes are deleted at once (the editor shows "couldn't be processed" for 7 days).
- The player doesn't preload: bandwidth is used only when someone presses play.

### Steps (Bunny dashboard)

1. **Stream → Add Video Library** (e.g. `chiyali-lessons`), storage region closest to Nepal; no extra replication regions.
2. **Encoding:** resolutions 240p, 360p, 480p, 720p (no 1080p); **keep original files: on** (lets you re-encode, e.g. for DRM, without re-uploads).
3. **Security:**
   - **Token authentication: on**: its key is `BUNNY_STREAM_TOKEN_AUTH_KEY`.
   - **Allowed domains:** `www.chiyali.com`, `chiyali.com` (the app loads the player with the site as its base, so it matches).
   - **Block direct URL file access: on**, **MP4 fallback: off**, **MediaCage Basic: on** if offered.
4. **Player:** download button off.
5. **Webhook URL:** `https://www.chiyali.com/api/webhooks/bunny-stream` (Bunny signs it with the library's Read-Only API key).
6. **CDN (the library's pull zone):** a **monthly bandwidth limit** (e.g. 500 GB to start; raise it with sales). Account → Billing: turn on billing alerts.
7. **Env vars in Vercel** (Production), then redeploy:
   ```
   BUNNY_STREAM_LIBRARY_ID=…          # library → API
   BUNNY_STREAM_TOKEN_AUTH_KEY=…      # library → Security → Token Authentication Key
   BUNNY_STREAM_API_KEY=…             # library → API → API Key (secret)
   BUNNY_STREAM_READ_ONLY_API_KEY=…   # library → API → Read-Only API Key (webhook signing)
   ```
   Without them, the editor says video uploads aren't available yet; everything else works.

### Check it works

1. As a creator, open a lesson of a paid (or not-yet-published) course → **Upload the lesson video**: a progress bar, then "Processing for streaming…". Reloading mid-upload and choosing the same file continues from where it stopped.
2. Within a few minutes (webhook, or the editor's 15-second refresh, or the 5-minute cron) the lesson shows the video as ready.
3. As a buyer, the lesson plays with your name drifting across it; as a signed-in non-buyer, "Buy this course to watch"; signed out, "Sign in".
4. In the Android app (preview or production build), the paid video plays and a screenshot comes out black.
5. In Bunny, the library's video list shows the video; delete the lesson's video in the editor and it disappears from Bunny about 4 hours later.

## 4. Monitoring (GlitchTip)

Errors go to **GlitchTip** (app.glitchtip.com), which speaks Sentry's protocol: the website uses `@sentry/nextjs` and the app `@sentry/react-native`. With the variables unset, nothing is reported and everything still works.

| Project | DSN (not secret) | Where it's set |
|---|---|---|
| **Chiyali Web** | `https://ea38c8e31d6d4e1a99afd337890276ef@app.glitchtip.com/28435` | Vercel: `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` (same value), `SENTRY_ENVIRONMENT=production` |
| **Chiyali Expo App** | `https://c5e50ec80152474eacf4f4e7ea15822a@app.glitchtip.com/28438` | `apps/mobile/eas.json` (preview and production builds) |

### What the website sends

- Uncaught errors in pages, route handlers and server actions (`onRequestError` in `src/instrumentation.ts`).
- Errors the app catches and turns into a generic message (`safeErrorMessage`, `actionError`, `routeError` in `src/lib/safeError.ts`), tagged `area=action` or `area=route` plus `context=<name>`. Deliberate `UserFacingError`s (validation messages) are not sent.
- Browser errors, through `/api/monitoring` on our own domain so ad blockers don't drop them. That route only forwards our own DSN.
- **Privacy:** `sendDefaultPii` is off; `beforeSend` (`src/lib/sentryOptions.ts`) strips cookies, headers, bodies and database parameter values. No session replay, and tracing only if `SENTRY_TRACES_SAMPLE_RATE` is set.

**Tags for triage** (names defined in `src/lib/observability.ts`):

| Tag | Meaning | Where |
|---|---|---|
| `area=payments`, `payment_event=verify_error` | the gateway call threw | `verifyAndFulfil` |
| `area=payments`, `payment_event=gateway_error` | no usable answer from the gateway; nothing changed, the cron retries (warning) | `verifyAndFulfil` |
| `area=payments`, `payment_event=amount_mismatch` | paid, but not the exact amount; the purchase is now `disputed` | `verifyAndFulfil` |
| `area=payments`, `payment_event=reused_transaction` | the gateway transaction already belongs to another purchase; now `disputed` | `verifyAndFulfil` |
| `area=payments`, `payment_event=fulfilment_error` | paid, but access, the ledger or the invoice failed | `verifyAndFulfil` |
| `area=payments`, `payment_event=gateway_disabled` | a pending purchase's gateway is no longer enabled (warning) | `verifyAndFulfil` |
| `area=payments`, `context=payments: cron reconcile` | the payment cron itself failed | `/api/cron/reconcile-payments` |
| `area=startup` | at boot, a live gateway's config looked wrong (sandbox URL, test key, non-https) and it was switched off; also allow-list typos | `services/payments/bootCheck.ts` |
| `area=invoices`, `invoice_event=attempt_failed` / `gave_up` | an invoice PDF or email failed; retried up to 5 times | `features/invoices/lib/deliverInvoice.ts` |
| `area=health` | `/api/health` found the database unreachable or a migration missing | `app/api/health/route.ts` |
| `area=cleanup` | some R2 deletions in the upload cleanup failed (retried) | `features/lessons/lib/uploadCleanup.ts` |
| `area=deliver` | the lesson delivery route answered 5xx | deliver route |

Payment events also carry `gateway` and `source` (return, poll, cron, admin, success_page) and the purchase ID.

### What the app sends

JavaScript and render errors, unhandled promise rejections, and native crashes, from preview and production EAS builds only (`apps/mobile/src/lib/monitoring.ts`). No sessions, traces, IPs or user details. Stack traces are minified: source-map upload is off (`SENTRY_DISABLE_AUTO_UPLOAD=true` in `eas.json`). To turn it on, add the EAS variables `SENTRY_AUTH_TOKEN` (GlitchTip → Profile → Auth Tokens, scope `project:releases`), `SENTRY_ORG` and `SENTRY_PROJECT`, then remove that flag.

### Alerts

- **Errors → Discord.** Create a webhook in Discord (channel → Edit Channel → Integrations → Webhooks → New Webhook → Copy Webhook URL; free). In **each** GlitchTip project: Settings → Alerts → "1 event in 1 minute" → recipient Discord → paste the URL. Optionally add a spike alert (20 events in 5 minutes).
- **Payment cron → email from cron-job.org.** On the job: Notifications → on failure (after 2–3 in a row), on success after failing, and when the job is disabled. A failed run answers 500 and a wrong secret 401, which cron-job.org counts as failures.
- **Heartbeat (optional, not used today):** setting `CRON_HEARTBEAT_URL` to a GlitchTip heartbeat monitor makes each successful run ping it, which would also catch the scheduler going quiet. Left unset, nothing is sent.

**What to do when an alert comes in:**
- **Payments:** `verify_error`, `fulfilment_error`, `amount_mismatch` or `reused_transaction` mean money may be at risk. Open `/admin/purchases`, find the purchase from the event, and check it in the gateway dashboard. Many `gateway_error`s in a short time usually mean a gateway outage; the cron keeps retrying.
- **Startup:** a live gateway was switched off at boot. The event says which variable is wrong; fix it in Vercel and redeploy.
- **Lesson delivery:** usually an R2 credential or bucket problem, so students can't play anything.
- **Invoices (`gave_up`):** the buyer has access but no invoice. Check `last_delivery_error`, fix it, then use "Send invoice now" on the payment's admin page.
- **Health:** the database is unreachable or a migration is missing (section 5).

### Uptime checks (optional)

GlitchTip's Uptime Monitors (or UptimeRobot) on the canonical host `https://www.chiyali.com`:
1. `GET /api/health` every 1–5 minutes: expect 200 and `"status":"ok"`. It's 503 when the database is unreachable **or** the schema doesn't match the code. The body says which (`database` or `schema`) and which deployment answered (`commit`, `region`).
2. `GET /` every 5 minutes: expect 200 and `Chiyali` in the body.
3. `GET /api/v1/config` every 5 minutes: expect `"siteName":"Chiyali"` (the first call the app makes).

---

## 5. Deploying without downtime

Vercel deploys are zero-downtime, and **Instant Rollback** (Deployments → ⋯) switches back in seconds. Downtime comes from what's around the code:

1. **Database changes must work with both versions of the code.** Run migrations **before** deploying the code that needs them, and only *add* in a migration (tables, nullable or defaulted columns, enum values, indexes). Drop or rename only in a later release ("expand, then contract"). Check `/api/health` is green afterwards.
2. **Preview before production.** Point preview deployments at a Neon **branch** of production, so migrations are tried on real data first.
3. **Roll back the code, not the database.** Because migrations only add, old code still works on the new schema.
4. **Neon:** on a paid plan, turn off scale-to-zero for production (or the first request after idle waits); use the **pooled** connection string; know how point-in-time restore works before you need it.
5. **Region:** keep Vercel Functions in the same region as the database. For learners in Nepal, Singapore (Neon `aws-ap-southeast-1` + Vercel `sin1`) is fastest; moving Neon means a new project and a data copy.
6. **Degrade, don't break:** an unconfigured or failing gateway is hidden at checkout (`PAYMENT_ENABLED_GATEWAYS` is the kill switch), and the cron completes payments whose redirect was lost.
7. **Domain:** `www.chiyali.com` is canonical; keep `chiyali.com` redirecting to it. The app always calls `www` (a redirect can drop its sign-in header).
