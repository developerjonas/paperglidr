# Payments

How money moves through PaperGlidr, how to configure it, and how to test it.

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
   | `/api/cron/reconcile-payments` | every 5 minutes |
   | **Admin → Purchases → "Re-check payment"** | by hand |

   Any number of these can run at once; exactly one completes the purchase.
3. **Fulfilment.** A single transaction marks the purchase completed, grants course access, writes the ledger entries, records any discount redemption and creates the invoice row. The invoice PDF and email are generated afterwards.

**Zero price.** Free products, and paid products discounted to ₹0, skip the gateway: `features/purchases/lib/freeEnrollment.ts` enrolls the buyer directly. The discount code's limits are re-checked under a row lock.

**Statuses:** `pending` → `completed` | `failed` | `disputed`, and `refunded` via the admin revoke.
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
| `live` | **Env values only.** A gateway with any value missing is disabled and hidden at checkout; it never falls back to sandbox. Any sandbox URL, `EPAYTEST`, the public eSewa test key or a non-https URL **disables that gateway** and reports it at boot (`src/services/payments/bootCheck.ts`, Sentry tag `area=startup`, see `docs/OBSERVABILITY.md`). The site and correctly configured gateways keep working. |

- `PAYMENT_ENABLED_GATEWAYS=esewa,khalti` is a kill switch: it can only switch gateways off.
- The boot log line shows what's enabled and why the rest aren't, for example `[payments] mode=live enabled=esewa,khalti { fonepay: 'missing FONEPAY_MERCHANT_CODE, …' }`.

### Return URLs to register with each gateway

These are sent per request. Register or whitelist them where the gateway's dashboard asks:

| Gateway | URL |
|---|---|
| eSewa success | `https://paperglidr.com/api/payments/esewa/return/*` |
| eSewa failure | `https://paperglidr.com/api/payments/esewa/failure/*` |
| Khalti `return_url` | `https://paperglidr.com/api/payments/khalti/return/*` (`website_url`: `https://paperglidr.com`) |
| Fonepay | none: QR plus status polling. Ask Fonepay whether they whitelist server IPs. |

### Cron

- `apps/web/vercel.json` runs `/api/cron/reconcile-payments` every 5 minutes. Vercel sends `Authorization: Bearer $CRON_SECRET` automatically.
- Any scheduler works the same way: `curl -H "Authorization: Bearer $CRON_SECRET" https://paperglidr.com/api/cron/reconcile-payments`.
- Without `CRON_SECRET` the endpoint refuses every request. It returns a summary such as `{"checked": 3, "outcomes": {"completed": 1, "pending": 2}}`.

## Tests

Both suites need a **throwaway** Postgres, migrated with `pnpm db:migrate`, and refuse to run without an explicit flag. Setup is in `docs/DB_SETUP.md`.

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
4. **Closed-tab test:** pay, then close the tab before the redirect. Access should appear within 5 minutes via the cron.
5. **Replay test:** reload the return URL. The purchase stays completed with one ledger row.
6. **Cancel test:** cancel at the gateway. You reach the failure page, and the purchase later becomes `failed`.
7. Refund the test payment in the merchant dashboard, then use Admin → revoke to remove access and reverse the ledger.
