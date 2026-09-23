# Database setup

How the PaperGlidr database schema is managed, and how to bootstrap a fresh production database. Commands run from `apps/web/`.

## The rule: migrations only, `db:push` is local-only

| Command | Where | What it does |
|---|---|---|
| `pnpm db:generate --name <change>` | your machine | Diffs `src/drizzle/schema/**` against the last migration snapshot and writes a new SQL file to `src/drizzle/migrations/`. **Commit it with the schema change.** |
| `pnpm db:migrate` | every environment | Applies pending migrations, tracked in `drizzle.__drizzle_migrations`. The only way the schema changes in staging or production. |
| `pnpm db:seed` | once per environment (safe to repeat) | Inserts launch categories; promotes `ADMIN_EMAIL` to admin. |
| `pnpm db:push` | **your local throwaway DB only** | Pushes the schema directly, with no migration file. Never run it against staging or production. |
| `pnpm db:studio` | anywhere, read-mostly | Drizzle Studio browser UI. |

**Why:** the previous migration history was abandoned because the database had been built with `db:push`. The only migration file was from the Stripe era and described 12 of the 33 tables (see `docs/REPO_AUDIT.md` §4). It was replaced on 2026-09-23 by a single baseline, `src/drizzle/migrations/0000_baseline.sql`. From here on, every schema change ships as a generated migration.

Changing the schema:
1. Edit `src/drizzle/schema/*.ts`.
2. `pnpm db:generate --name short_description`, then read the generated SQL. Drizzle can miss things like generated columns, custom SQL and data backfills; hand-edit the file if needed.
3. `pnpm db:migrate` against your local DB and test.
4. Commit the schema change together with `src/drizzle/migrations/**`, including `meta/`.

## Environment

The DB tooling (`drizzle.config.ts`, `pnpm db:seed`) reads **only** these variables, validated in `src/data/env/db.ts`, so it runs without the rest of the app's env:

| Var | Required | Notes |
|---|---|---|
| `DB_HOST` | yes | |
| `DB_PORT` | no | default `5432` |
| `DB_USER` | yes | |
| `DB_PASSWORD` | yes | |
| `DB_NAME` | yes | |
| `DB_SSL` | no | `true` (default) or `false`. Use `false` only for a local Postgres without TLS. Keep it `true` in production |
| `ADMIN_EMAIL` | seed only | the user to promote to admin |

`drizzle-kit` and the seed script **don't read `.env` files**; Next.js does that only for the app itself. Export the variables into your shell first:

```sh
cd apps/web
set -a; source .env.local; set +a     # or .env.production.local, etc.
pnpm db:migrate
```

## Local development

Any Postgres 15+ works. With Docker:

```sh
docker run -d --name paperglidr-pg -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=paperglidr postgres:17
```

`.env.local`: `DB_HOST=localhost DB_USER=postgres DB_PASSWORD=postgres DB_NAME=paperglidr DB_SSL=false`, then `pnpm db:migrate && pnpm db:seed`.

## Bootstrapping a fresh production database

Production starts empty; there's no data to carry over from the dev DB.

1. **Create the database** on your managed Postgres provider. Note the host, port, user, password and database name. Make sure the provider requires TLS; `DB_SSL` stays `true`.
2. **Apply the schema** from a trusted machine, not from CI logs that could leak the password:
   ```sh
   cd apps/web
   export DB_HOST=… DB_PORT=… DB_USER=… DB_PASSWORD=… DB_NAME=…   # DB_SSL defaults to true
   pnpm db:migrate
   ```
   Expected: `migrations applied successfully!`. Sanity check: 33 tables in `public`, 22 enum types, and one row in `drizzle.__drizzle_migrations`.
3. **Seed categories:** `pnpm db:seed`. It prints `categories: 8 inserted` the first time and `0 inserted, 8 already present` after that.
4. **Set the app env in Vercel** (Production) from `apps/web/.env.example`, and deploy.
5. **Create the admin.** Sign in to the deployed app once with the admin's Google account; this creates their `user` row. Then run:
   ```sh
   ADMIN_EMAIL=founder@example.com pnpm db:seed
   ```
   If the user doesn't exist yet, the seed exits with code 1 and says so; nothing is changed. The email match is case-insensitive.
6. **Verify:** the admin opens `/admin` (reload if it was already open). Roles are read fresh from the database on every request, so the promotion applies on the next request, with no cache purge. Demotion works the same way: set `role = 'user'` and it applies on their next request.

## Baseline contents (for reference)

`0000_baseline.sql` was verified against an empty PostgreSQL 17 instance (`db:migrate` with `DB_SSL=false`):
- **33 tables and 22 enums**, matching `src/drizzle/schema/**`.
- **`products.search_vector`**: a `tsvector GENERATED ALWAYS AS (…) STORED` column; a full-text query against it works.
- **Money-safety unique keys:**
  - `purchases_idempotencyKey_unique`
  - `gateway_transaction_unique_idx` on `(gateway, gatewayTransactionId)`
  - `purchase_course_entry_type_unique_idx` on `ledger_entries (purchaseId, courseId, entryType)`
- **Plus:**
  - `invoices_purchaseId_unique` and `invoices_invoiceNumber_unique`
  - `user_course_unique_idx` on certificates
  - `discount_codes_code_unique`
  - `categories_slug_unique` (used by the seed's conflict target)
  - the wishlist and review uniques
