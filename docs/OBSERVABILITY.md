# Observability: Sentry, alerts and uptime checks

What the app reports, and the steps to set up alerts and uptime checks by hand. Everything here is optional at runtime. With the Sentry variables unset, the app builds and runs normally and reports nothing.

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
- Browser errors.

**Tagged for alerting** (the names are defined in `src/lib/observability.ts`):

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

**Cron monitor:** `/api/cron/reconcile-payments` checks in to a Sentry cron monitor named `reconcile-payments` (schedule `15 18 * * *` — daily while on the Vercel Hobby plan, TODO back to `*/5 * * * *` — 5-minute margin). The monitor is created on the first check-in.

**Privacy.**
- `sendDefaultPii` is off: no IPs, cookies or user details.
- `beforeSend` (`src/lib/sentryOptions.ts`) removes request cookies, headers and bodies, and cuts the `params:` part out of database error messages, which can contain payout bank details or emails. The SQL itself is kept.
- Tracing is off unless `SENTRY_TRACES_SAMPLE_RATE` is set.
- The privacy policy lists Sentry as a processor only once you turn it on. See "Before you turn it on" below.

## Steps: Sentry

1. Create a Sentry account (the free Developer plan is enough) and a project. Platform: **Next.js**. Name: `chiyali-web`.
2. Project settings → Client Keys (DSN): copy the DSN.
3. In Vercel, under Project → Settings → Environment Variables, add for **Production** (and Preview if you want preview errors too):
   ```
   SENTRY_DSN=<dsn>
   NEXT_PUBLIC_SENTRY_DSN=<same dsn>
   SENTRY_ENVIRONMENT=production                 # Preview: preview
   NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
   ```
   Optional, for readable stack traces (source map upload at build):
   ```
   SENTRY_AUTH_TOKEN=<Settings → Auth Tokens → Create, scope project:releases + org:read>
   SENTRY_ORG=<org slug>
   SENTRY_PROJECT=chiyali-web
   ```
4. Redeploy. `NEXT_PUBLIC_SENTRY_DSN` is inlined at build time.
5. Check it works. On a preview deployment with the DSN set, open `/api/lessons/00000000-0000-0000-0000-000000000000/assets/x/deliver`. It returns a 404, so nothing is sent. To force a test event, use Sentry → Project → "Send a test event", or temporarily set a wrong `R2_BUCKET_NAME` on a preview and play an uploaded lesson. That produces an `area=deliver` error.

## Steps: alert rules (Sentry → Alerts → Create alert)

Send every alert to email, and to the phone app or Slack if you have them. Use the Production environment.

1. **Payments: money at risk** (issue alert)
   - When: *a new issue is created* **or** *an issue changes state from resolved to unresolved* **or** *the issue is seen more than 1 time in 1 hour*.
   - If: tag `area` equals `payments` **and** tag `payment_event` is in `verify_error, fulfilment_error, amount_mismatch, reused_transaction`.
   - Then: notify immediately. Action interval: 5 minutes.
   - Response: open `/admin/purchases` and look at the purchase ID in the event. `amount_mismatch` and `reused_transaction` leave the purchase `disputed`; check it in the gateway dashboard.
2. **Payments: gateway not answering** (metric alert)
   - Dataset: errors. Query: `area:payments payment_event:gateway_error`.
   - Trigger: count > 10 in 15 minutes (critical), > 3 in 15 minutes (warning). Resolve below 1.
   - This usually means a gateway outage. The cron keeps retrying; check the gateway's status and `/admin/purchases?status=pending`.
3. **Payments: reconciliation cron** (cron monitor alert)
   - Crons → `reconcile-payments` (it appears after the first run with the DSN set) → Alerts: notify on **missed** check-ins and **failed** runs, after 2 consecutive failures.
   - Also add an issue alert: tag `area` equals `payments` and `context` equals `payments: cron reconcile`, notify on every new issue.
4. **Lesson delivery 5xx** (metric alert)
   - Dataset: errors. Query: `area:deliver`.
   - Trigger: count > 5 in 5 minutes (critical), ≥ 1 in 5 minutes (warning).
   - Usually an R2 credential or bucket problem (students can't play anything) or an asset row with no storage key.
5. **Startup: payment gateway disabled** (issue alert)
   - If: tag `area` equals `startup`. Level: error. Notify immediately.
   - A live gateway failed its config check at boot and was switched off: the site is up but can't take that gateway's payments. The event's extra data says which variable is wrong. Fix it in Vercel and redeploy.
6. **Invoice delivery gave up** (issue alert)
   - If: tag `area` equals `invoices` **and** tag `invoice_event` equals `gave_up`. Notify by email.
   - The buyer paid and has access, but never got their invoice. Check `last_delivery_error` on the invoice (usually a Resend domain or API key problem), fix it, then set `delivery_attempts = 0` on the affected invoices so the cron sends them.
7. **Everything else** (issue alert): *a new issue is created*, environment Production, notify by email in a daily digest (action interval: 1 day). This covers `area=action`, `area=route` and browser errors without paging you.

## Steps: uptime checks

Use any external checker: UptimeRobot (free: 50 monitors, 5-minute checks) or Better Stack (free: 10 monitors, 3-minute checks). Always use the canonical host, `https://www.chiyali.com`. `chiyali.com` redirects there, and some checkers treat a redirect as down.

1. **Health (the main one):** `GET https://www.chiyali.com/api/health`, every 1–5 minutes.
   - Expect: status **200** and the body contains `"status":"ok"`. HEAD works too, if your checker only sends HEAD.
   - It's red (**503**) when the database can't be reached **or** its schema doesn't match the code. A missing migration ("column … does not exist") shows up here within minutes, instead of on a customer's page. The body says which check failed (`database` or `schema`), never the error. The error goes to Sentry with tag `area=health`.
   - The body also has `commit` and `region`: which deployment answered. Handy right after a deploy or a rollback.
   - Alert after 2 failed checks, from at least 2 regions. Include one near Nepal (Singapore or India) if offered.
2. **Home page:** `GET https://www.chiyali.com/`, every 5 minutes. Expect 200 **and** the body contains `Chiyali`. This catches what the health check can't: a page that fails to render.
3. **Mobile API:** `GET https://www.chiyali.com/api/v1/config`, every 5 minutes. Expect 200 and the body contains `"siteName":"Chiyali"`. This is the first thing the app loads.
4. **Cron endpoint is reachable:** `GET https://www.chiyali.com/api/cron/reconcile-payments`, **no** Authorization header, every 5 minutes.
   - Expect **401**. Don't store `CRON_SECRET` in a third-party checker.
   - This proves the route is deployed and answering. Whether the cron actually *runs* is covered by the Sentry cron monitor (alert 3) and by Vercel → Project → Settings → Cron Jobs. A 404 means the route is missing; a 5xx means the app is broken. Either way, alert.
5. Optional: a **status page** in the same tool, listing monitors 1–3.
6. Put the alert contacts in the same place as the Sentry alerts (email + phone).

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

- **Privacy policy:** add Sentry (Functional Software, Inc., USA) to the list of processors in `/privacy`, and mention error reports among the data you process. `docs/LEGAL_REVIEW.md` (cross-border processing) already asks the lawyer about processors outside Nepal.
- **Region:** choose the EU or US data region when you create the Sentry org. It can't be changed later.
