# Payments

How money moves through Chiyali, how to configure it, and how to test it.

## How a purchase completes

1. **Checkout.** `initiatePurchase` in `features/purchases/actions/purchases.ts` does four things:
   - It prices the product on the server, applying any discount code; the client never supplies a price.
   - It checks that the chosen gateway is enabled in this deployment.
   - It creates a `pending` purchase.
   - It sends the buyer to the gateway: an eSewa form POST, a Khalti redirect, or a Fonepay QR.
2. **Verification.** `verifyAndFulfil` in `features/purchases/lib/verifyAndFulfil.ts` asks the gateway server-to-server what happened. A purchase becomes `completed` only when the gateway reports it paid **and** the amount matches the purchase exactly, to the paisa. A mismatch becomes `disputed` and grants nothing. Several things call it:

   | Caller | When |
   |---|---|
   | `/api/payments/esewa/return/[purchaseId]` (and `/failure/`) | the buyer's browser returns from eSewa |
   | `/api/payments/khalti/return/[purchaseId]` | the buyer's browser returns from Khalti |
   | `/api/payments/fonepay/status/[purchaseId]` | the QR page polls every 3 seconds (owner only) |
   | the success page | as it loads |
   | `/api/cron/reconcile-payments` | every 5 minutes, from cron-job.org (see Cron) |
   | **Admin → Purchases → "Re-check payment"** | by hand |

   Any number of these can run at once; exactly one completes the purchase.
3. **Fulfilment.** A single transaction marks the purchase completed, grants course access, writes the ledger entries, records any discount redemption and creates the invoice row. The invoice PDF and email are generated afterwards.

**Zero price.** Free products, and paid products discounted to ₹0, skip the gateway: `features/purchases/lib/freeEnrollment.ts` enrolls the buyer directly. The discount code's limits are re-checked under a row lock.

**Statuses:** `pending` → `completed` | `failed` | `disputed`, and `refunded` when an admin approves a refund at `/admin/refunds`.
- A `failed` purchase can still become `completed` if the gateway later confirms the payment (late success wins).
- `disputed` and `refunded` are terminal for automated flows.
- `not_found` from a gateway only becomes `failed` after 30 minutes.
- The cron gives up on a purchase that has been `pending` for more than 48 hours, marking it `failed` with an `expired` event.

Every gateway answer is appended to `payment_events`, which is the record to use for "I paid but got nothing" tickets.

## Configuration

`services/payments/config.ts` reads the variables below; see `apps/web/.env.example` for each one.

| `PAYMENT_MODE` | Behaviour |
|---|---|
| `sandbox` | Env values override `SANDBOX_DEFAULTS`. eSewa works with nothing set (the public `EPAYTEST` merchant). Khalti needs `KHALTI_SECRET_KEY`, a per-merchant test key. Fonepay needs all its credentials. |
| `live` | **Env values only.** A gateway with any value missing is disabled and hidden at checkout; it never falls back to sandbox. Any sandbox URL, `EPAYTEST`, the public eSewa test key or a non-https URL **disables that gateway** and reports it at boot (`src/services/payments/bootCheck.ts`, GlitchTip tag `area=startup`, see [SETUP.md](./SETUP.md#3-monitoring-glitchtip)). The site and correctly configured gateways keep working. |

- `PAYMENT_ENABLED_GATEWAYS=esewa,khalti` is a kill switch: it can only switch gateways off.
- The boot log line shows what's enabled and why the rest aren't, for example `[payments] mode=live enabled=esewa,khalti { fonepay: 'missing FONEPAY_MERCHANT_CODE, …' }`.

### Return URLs to register with each gateway

These are sent per request. Register or whitelist them where the gateway's dashboard asks:

| Gateway | URL |
|---|---|
| eSewa success | `https://www.chiyali.com/api/payments/esewa/return/*` |
| eSewa failure | `https://www.chiyali.com/api/payments/esewa/failure/*` |
| Khalti `return_url` | `https://www.chiyali.com/api/payments/khalti/return/*` (`website_url`: `https://www.chiyali.com`) |
| Fonepay | none: QR plus status polling. Ask Fonepay whether they whitelist server IPs. |

### Cron

- **Scheduled on [cron-job.org](https://cron-job.org)**, not Vercel Cron (the Hobby plan only allows daily runs; `apps/web/vercel.json` has no crons). Set up the job like this:
  - URL: `https://www.chiyali.com/api/cron/reconcile-payments`, method GET.
  - Schedule: every 5 minutes.
  - Advanced → Headers: `Authorization` = `Bearer <CRON_SECRET>` (the same value as in Vercel).
  - Advanced → Timeout: 30 seconds (the maximum).
  - Notifications: on failure (after 2–3 in a row), on success after failing, and when the job is disabled. This is the cron's alerting: a failed run answers 500 and a wrong secret 401.
  - Use **Test run** after saving: it should answer 200 with a summary. 401 means the header or secret is wrong.
- Each run is kept short for that 30-second limit: up to 25 payments, and it stops starting new checks after 20 seconds. Anything left (`"deferred": N` in the summary) is picked up 5 minutes later. Invoice retries and upload cleanup only run if time is left.
- Any other scheduler works the same way: `curl -H "Authorization: Bearer $CRON_SECRET" https://www.chiyali.com/api/cron/reconcile-payments`. Overlapping runs are safe: each purchase is fulfilled exactly once.
- Without `CRON_SECRET` the endpoint refuses every request. It returns a summary such as `{"checked": 3, "outcomes": {"completed": 1, "pending": 2}, "invoices": {...}}`.
- The same run also does housekeeping, each step isolated so one failure doesn't stop the others:
  - **Invoice retry.** Invoices whose PDF or email failed (`emailed_at` still null) are retried at most 5 times, at least 10 minutes apart, for 30 days. An atomic claim means the cron and the post-payment send never email the same invoice twice. After the 5th failure Sentry gets `area=invoices`, `invoice_event=gave_up`. The error is in `invoices.last_delivery_error`.
  - **Upload cleanup.** Lesson uploads still `pending` after 24 hours (never confirmed) are deleted, both the R2 object and the row. The R2 objects of replaced or removed lesson files are deleted 4 hours later, via the `storage_deletions` queue. The delay is longer than any signed playback URL, so nobody's video stops mid-lesson.
- Optional: with `CRON_HEARTBEAT_URL` set, each successful run also pings a GlitchTip heartbeat monitor. It isn't used today (see [SETUP.md](./SETUP.md#alerts)).

## Tests

Both suites need a **throwaway** Postgres, migrated with `pnpm db:migrate`, and refuse to run without an explicit flag. Setup is in [SETUP.md](./SETUP.md#tests).

```sh
cd apps/web
# Unit/integration: verifyAndFulfil, reconciliation, config, gateway parsing, initiatePurchase
# (stub gateway, real Postgres, no network)
TEST_DB_IS_THROWAWAY=1 pnpm test

# End-to-end against the running app and the real eSewa sandbox
SMOKE_TEST_DB_IS_THROWAWAY=1 BASE_URL=http://localhost:3000 CRON_SECRET=... pnpm test:security-smoke
```

The stub gateway lives in `src/test/` only. A test fails if any app file imports from there, and gateways can't be selected from env.

## Going live, per gateway

1. Set the gateway's live values in Vercel **Production** (see `.env.example`), with `PAYMENT_MODE=live` and `CRON_SECRET` set.
2. Deploy, then check the boot log shows the gateway enabled.
3. Buy a real ₹10–50 test product and confirm:
   - you land on the success page with access granted, and the purchase row is `completed`;
   - there is one ledger row and one invoice row, and the invoice email arrives.
4. **Closed-tab test:** pay, then close the tab before the redirect. Access should appear after the next cron run, within 5 minutes.
5. **Replay test:** reload the return URL. The purchase stays completed with one ledger row.
6. **Cancel test:** cancel at the gateway. You reach the failure page, and the purchase later becomes `failed`.
7. Refund the test payment: request a refund from the purchase page, approve it at `/admin/refunds` (access ends and the ledger is reversed), return the money in the merchant dashboard, then mark it returned.
