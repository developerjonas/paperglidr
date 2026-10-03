# Observability: GlitchTip, alerts and uptime checks

What the app reports, and the steps to set up alerts and uptime checks by hand. Errors go to **GlitchTip** (hosted at app.glitchtip.com, project *Chiyali Web*), which speaks Sentry's protocol: the app uses the official `@sentry/nextjs` SDK and its `SENTRY_*` variables, pointed at GlitchTip. Everything here is optional at runtime. With the variables unset, the app builds and runs normally and reports nothing.

## What the app sends

`@sentry/nextjs` runs in all three runtimes:

| Runtime | Initialised in | DSN variable |
|---|---|---|
| Node.js server (pages, route handlers, server actions) | `src/sentry.server.config.ts` via `src/instrumentation.ts` | `SENTRY_DSN` |
| Edge (middleware) | `src/sentry.edge.config.ts` via `src/instrumentation.ts` | `SENTRY_DSN` |
| Browser | `src/instrumentation-client.ts` | `NEXT_PUBLIC_SENTRY_DSN` (inlined at build) |

**Reported automatically:**
- Uncaught errors in pages, route handlers and server actions, through `onRequestError` in `instrumentation.ts`.
- Errors that the app catches and turns into a generic message, through `safeErrorMessage` / `actionError` / `routeError` in `src/lib/safeError.ts`. These are tagged `area=action` or `area=route`, plus `context=<name>`. Deliberate `UserFacingError`s (validation messages) are **not** reported.
- Browser errors. They're sent through `/api/monitoring` on our own domain (`app/api/monitoring/route.ts`), so ad blockers that block the error service's domain don't drop them. That route only forwards envelopes whose DSN is ours.
- Not sent: release-health sessions (GlitchTip doesn't use them). No session replay.

**Tagged for triage** (the names are defined in `src/lib/observability.ts`; filter the issue list by them):

| Tag | Values | Where |
|---|---|---|
| `area=payments`, `payment_event=verify_error` | the gateway call threw | `verifyAndFulfil` |
| `area=payments`, `payment_event=gateway_error` | the gateway answered with no usable result (network, 5xx, unexpected body). Nothing changed; the cron retries. Level: warning | `verifyAndFulfil` |
| `area=payments`, `payment_event=amount_mismatch` | the gateway says paid, but not the exact amount. The purchase is now `disputed` | `verifyAndFulfil` |
| `area=payments`, `payment_event=reused_transaction` | a gateway transaction ID already belongs to another purchase. The purchase is now `disputed` | `verifyAndFulfil` |
| `area=payments`, `payment_event=fulfilment_error` | the payment is confirmed, but granting access, the ledger or the invoice failed | `verifyAndFulfil` |
| `area=payments`, `payment_event=gateway_disabled` | a pending purchase's gateway is no longer enabled. Level: warning | `verifyAndFulfil` |
| `area=payments` (with `context=payments: cron reconcile`) | the reconciliation cron itself failed | `/api/cron/reconcile-payments` |
| `area=startup`, `payment_event=gateway_disabled` | at server boot, a live gateway's config has a sandbox URL, test credential or non-https URL, so it was switched off. The site stays up. Also `area=startup` warnings for allow-list typos | `services/payments/bootCheck.ts` |
| `area=invoices`, `invoice_event=attempt_failed` / `gave_up` | an invoice's PDF or email failed; the cron retries up to 5 times, then `gave_up` | `features/invoices/lib/deliverInvoice.ts` |
| `area=health` | `/api/health` found the database unreachable or its schema out of date (a missing migration). The uptime monitor also goes red | `app/api/health/route.ts` |
| `area=cleanup` | some R2 deletions in the cron's upload cleanup failed (warning; retried next run) | `features/lessons/lib/uploadCleanup.ts` |
| `area=deliver` | `/api/lessons/…/deliver` answered 5xx: an exception, or a deliberate 500 such as an asset with no storage key | deliver route |

Every payment event also carries `gateway` (esewa / khalti / fonepay) and `source` (return / poll / cron / admin / success_page), plus the purchase ID as extra data.

**Cron heartbeat:** after each successful run, `/api/cron/reconcile-payments` sends a POST to `CRON_HEARTBEAT_URL`, a GlitchTip **heartbeat** monitor. GlitchTip alerts when the pings stop: the run failed, or the scheduler stopped calling it. The schedule is `15 18 * * *` (daily while on the Vercel Hobby plan; TODO back to `*/5 * * * *`). A failing heartbeat ping never fails the payment run.

**Privacy.**
- `sendDefaultPii` is off: no IPs, cookies or user details.
- `beforeSend` (`src/lib/sentryOptions.ts`) removes request cookies, headers and bodies, and cuts the `params:` part out of database error messages, which can contain payout bank details or emails. The SQL itself is kept.
- Tracing is off unless `SENTRY_TRACES_SAMPLE_RATE` is set.
- The privacy policy lists GlitchTip as the error-monitoring processor.

## Steps: GlitchTip

1. GlitchTip → the organisation → project **Chiyali Web** (platform Next.js) → Settings: copy the **DSN**.
2. In Vercel, under Project → Settings → Environment Variables, add for **Production** (and Preview if you want preview errors too):
   ```
   SENTRY_DSN=<dsn>
   NEXT_PUBLIC_SENTRY_DSN=<same dsn>
   SENTRY_ENVIRONMENT=production                 # Preview: preview
   NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
   ```
   Optional, for readable stack traces (source maps are uploaded at build):
   ```
   SENTRY_URL=https://app.glitchtip.com
   SENTRY_AUTH_TOKEN=<GlitchTip → Profile → Auth Tokens → create, scope project:releases>
   SENTRY_ORG=<organisation slug, as in GlitchTip's URL>
   SENTRY_PROJECT=<project slug, as in GlitchTip's URL>
   ```
   Without `SENTRY_AUTH_TOKEN` the build skips the upload and errors still arrive, just with minified stack traces.
3. Redeploy. `NEXT_PUBLIC_SENTRY_DSN` is inlined at build time.
4. Check it works: open `https://www.chiyali.com/api/monitoring` in a browser (it should say 405: the route exists and only accepts POST), then make a test error. For example, call `/api/health` on a preview whose database variables are wrong: it answers 503 and a "Health check failed" issue (`area=health`) appears.

## Steps: alerts (GlitchTip)

GlitchTip alerts are per project: "when *N* events happen within *M* minutes, notify these recipients". There are no per-tag rules, so start with one alert for any error, and use the tags above to triage.

1. **Any error:** Project → Settings → Alerts → Create. 1 event within 1 minute. Recipients: your email, plus a webhook to Discord, Slack or Teams if you use one.
2. **Error spike:** a second alert, 20 events within 5 minutes, to the same recipients.
3. **Payment cron heartbeat:** Uptime Monitors → New → type **Heartbeat**, interval **1 day** (match the cron schedule; 5 minutes once it's back to every 5 minutes), with an hour of grace. Copy its URL into Vercel as `CRON_HEARTBEAT_URL` and redeploy.

What to do when the alert is about:
- **Payments** (`area=payments`): `verify_error`, `fulfilment_error`, `amount_mismatch` or `reused_transaction` mean money may be at risk. Open `/admin/purchases` and find the purchase ID in the event. `amount_mismatch` and `reused_transaction` leave the purchase `disputed`; check it in the gateway dashboard. Many `gateway_error`s in a short time usually mean a gateway outage; the cron keeps retrying.
- **Startup** (`area=startup`): a live gateway failed its config check at boot and was switched off. The event's extra data says which variable is wrong; fix it in Vercel and redeploy.
- **Lesson delivery** (`area=deliver`): usually an R2 credential or bucket problem (students can't play anything), or an asset row with no storage key.
- **Invoices** (`area=invoices`, `invoice_event=gave_up`): the buyer has access but never got the invoice. Check `last_delivery_error` on the invoice, fix it, then set `delivery_attempts = 0` so the cron resends.
- **Health** (`area=health`): the database is unreachable or a migration is missing. See "Deploying without downtime" below.

## Steps: uptime checks

Use GlitchTip's own **Uptime Monitors** (then alerts arrive in the same place), or UptimeRobot or Better Stack. Always use the canonical host, `https://www.chiyali.com`. `chiyali.com` redirects there, and some checkers treat a redirect as down.

1. **Health (the main one):** `GET https://www.chiyali.com/api/health`, every 1–5 minutes.
   - Expect: status **200** and the body contains `"status":"ok"`. HEAD works too, if your checker only sends HEAD.
   - It's red (**503**) when the database can't be reached **or** its schema doesn't match the code. A missing migration ("column … does not exist") shows up here within minutes, instead of on a customer's page. The body says which check failed (`database` or `schema`), never the error. The error goes to GlitchTip with tag `area=health`.
   - The body also has `commit` and `region`: which deployment answered. Handy right after a deploy or a rollback.
   - Alert after 2 failed checks, from at least 2 regions. Include one near Nepal (Singapore or India) if offered.
2. **Home page:** `GET https://www.chiyali.com/`, every 5 minutes. Expect 200 **and** the body contains `Chiyali`. This catches what the health check can't: a page that fails to render.
3. **Mobile API:** `GET https://www.chiyali.com/api/v1/config`, every 5 minutes. Expect 200 and the body contains `"siteName":"Chiyali"`. This is the first thing the app loads.
4. **Cron endpoint is reachable:** `GET https://www.chiyali.com/api/cron/reconcile-payments`, **no** Authorization header, every 5 minutes.
   - Expect **401**. Don't store `CRON_SECRET` in a third-party checker.
   - This proves the route is deployed and answering. Whether the cron actually *runs* is covered by the heartbeat monitor (alerts, step 3) and by Vercel → Project → Settings → Cron Jobs. A 404 means the route is missing; a 5xx means the app is broken. Either way, alert.
5. Optional: a **status page** in the same tool, listing monitors 1–3.
6. Put the alert contacts in the same place as the GlitchTip error alerts (email + phone).

## Deploying without downtime

Vercel deploys are already zero-downtime: a new deployment only receives traffic once it has built and started, and **Instant Rollback** (Vercel → Deployments → ⋯ → Promote / Instant Rollback) switches back in seconds. What causes downtime here is everything around the code:

1. **Database changes must work with both versions of the code.** The old deployment keeps serving until the new one is live, and a rollback brings old code back onto the new schema. So:
   - **Run migrations *before* deploying** the code that needs them, never after. The outage after the domain move was this: new code, old schema.
   - **Only add** in a migration: new tables, nullable columns or columns with defaults, new enum values, indexes. Drop or rename only in a later release, once no deployed code uses the old shape ("expand, then contract").
   - After running a migration, check `/api/health` is green before promoting the deploy.
2. **Preview before production.** Every branch gets a preview URL. Point previews at a Neon **branch** of the production database (Vercel's Neon integration can create one per preview), so migrations are tried on real data first.
3. **Roll back the code, not the database.** If a deploy breaks, use Instant Rollback. Because migrations only add (rule 1), the old code still works on the new schema.
4. **Database availability (Neon).**
   - Turn off *scale to zero* (autosuspend) for the production branch on a paid plan. Otherwise the first request after idle waits for the database to wake.
   - Use the **pooled** connection string in production.
   - Point-in-time restore is the backup. Know how to use it before you need it.
5. **Region.** Put Vercel Functions in the **same region as the Neon database** (Vercel → Settings → Functions → Region). Every request makes several database round trips, so a cross-ocean gap multiplies.
   - Production logs show functions running in `iad1` (Washington). If Neon is also in the US, that's consistent.
   - For learners in Nepal, a Singapore pair (Neon `aws-ap-southeast-1` + Vercel `sin1`) would be faster. Moving Neon means a new project plus a data copy: plan it before launch, not after.
6. **Things outside your control degrade, not break.** An unconfigured or failing gateway is hidden at checkout (`PAYMENT_ENABLED_GATEWAYS` is the kill switch), and the reconciliation cron completes payments whose redirect was lost.
7. **Domain.** `www.chiyali.com` is canonical; keep `chiyali.com` redirecting to it, and keep both on this Vercel project only.

## Before you turn it on

- **Privacy policy:** `/privacy` lists GlitchTip as the error-monitoring processor. If you move to another service (e.g. Sentry), update that row and `LEGAL_LAST_UPDATED`. `docs/LEGAL_REVIEW.md` (cross-border processing) already asks the lawyer about processors outside Nepal.
