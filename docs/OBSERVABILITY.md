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
| `area=cleanup` | some R2 deletions in the cron's upload cleanup failed (warning; retried next run) | `features/lessons/lib/uploadCleanup.ts` |
| `area=deliver` | `/api/lessons/…/deliver` answered 5xx: an exception, or a deliberate 500 such as an asset with no storage key | deliver route |

Every payment event also carries `gateway` (esewa / khalti / fonepay) and `source` (return / poll / cron / admin / success_page), plus the purchase ID as extra data.

**Cron monitor:** `/api/cron/reconcile-payments` checks in to a Sentry cron monitor named `reconcile-payments` (schedule `*/5 * * * *`, 5-minute margin). The monitor is created on the first check-in.

**Privacy.**
- `sendDefaultPii` is off: no IPs, cookies or user details.
- `beforeSend` (`src/lib/sentryOptions.ts`) removes request cookies, headers and bodies, and cuts the `params:` part out of database error messages, which can contain payout bank details or emails. The SQL itself is kept.
- Tracing is off unless `SENTRY_TRACES_SAMPLE_RATE` is set.
- The privacy policy lists Sentry as a processor only once you turn it on. See "Before you turn it on" below.

## Steps: Sentry

1. Create a Sentry account (the free Developer plan is enough) and a project. Platform: **Next.js**. Name: `paperglidr-web`.
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
   SENTRY_PROJECT=paperglidr-web
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

Use any external checker. Examples use Better Stack (free tier: 10 monitors, 3-minute checks); UptimeRobot works the same way.

1. **Home page**
   - URL: `https://paperglidr.com/`, method GET, every 3 minutes (1 minute if your plan allows).
   - Expect: status 200 **and** the body contains `PaperGlidr`.
   - Alert after 2 failed checks, from at least 2 regions. Include a Kathmandu-near region (e.g. Singapore or India) if offered.
2. **Cron endpoint is reachable**
   - URL: `https://paperglidr.com/api/cron/reconcile-payments`, method GET, **no** Authorization header, every 5 minutes.
   - Expect: status **401**. Don't store `CRON_SECRET` in a third-party checker.
   - This proves the route is deployed and answering. Whether the cron actually *runs* is covered by the Sentry cron monitor (alert 3) and by Vercel → Project → Settings → Cron Jobs, where you can see recent invocations.
   - A 404 means the route is missing from the deployment. A 5xx means the app is broken. Either way, alert.
3. Optional: a **status page** in the same tool listing both monitors.
4. Put the alert contacts in the same place as the Sentry alerts (email + phone).

## Before you turn it on

- **Privacy policy:** add Sentry (Functional Software, Inc., USA) to the list of processors in `/privacy`, and mention error reports among the data you process. `docs/LEGAL_REVIEW.md` (cross-border processing) already asks the lawyer about processors outside Nepal.
- **Region:** choose the EU or US data region when you create the Sentry org. It can't be changed later.
