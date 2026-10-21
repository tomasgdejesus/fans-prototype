# FANS Platform

React SPA and Hono API developed with Vite and deployed as one Cloudflare Worker. PostgreSQL stores application data; Drizzle defines its schema and migrations. No hosted database or Hyperdrive resource is provisioned by this scaffold.

See the [root README](../../README.md), [architecture](ARCHITECTURE.md), and [UI guide](docs/UI.md).

## Local development

Run these commands from the repository root with Docker running:

```bash
pnpm install --frozen-lockfile
cp apps/platform/.dev.vars.example apps/platform/.dev.vars
pnpm db:up
pnpm db:migrate
pnpm dev
```

After first applying the PostgreSQL patch, use `pnpm install --no-frozen-lockfile` once to resolve the new driver dependencies, and commit the resulting lockfile before using frozen installs.

The example `DATABASE_URL` matches the local-only credentials in `compose.yaml`. The database port is bound to loopback. Keep Vite and Docker in the same development environment (for example, WSL with Docker Desktop integration). If port 5432 is occupied, change the Compose host port and the connection string together.

Docker stores data in a named volume. `pnpm db:down` retains it; `docker compose down --volumes` deletes it. Removing `.wrangler/state/` does not reset PostgreSQL. Changing `POSTGRES_*` initialization settings does not change credentials in an existing database volume.

`/api/health` is database-independent liveness. `/api/health/db` runs `SELECT 1` and returns 503 when PostgreSQL is unavailable, without exposing database error details. It checks connectivity, not whether migrations have been applied. Neither the frontend nor unknown routes open database connections.

## Database changes

```bash
pnpm db:generate
# Review and commit new SQL and snapshot files.
pnpm db:migrate
pnpm db:studio
```

The active PostgreSQL history is `drizzle/postgresql/`. Its baseline creates all 19 tables in an empty database. Existing SQLite files at the parent directory are retained only as history; they are not applied to PostgreSQL. This patch does not copy data out of D1. Export and transform any existing data separately before switching a live deployment.

`drizzle.config.ts` generates migrations without credentials. `drizzle.runtime.config.ts` loads credentials for migration and Studio commands: an exported `DATABASE_URL` wins, otherwise it reads this app's `.dev.vars` explicitly. Drizzle Kit runs in Node and does not inherit Wrangler bindings. The selected URL determines the database modified by `db:migrate`; there is no implicit local/remote switch.

IDs remain text containing application-generated UUID v7 values; certificate verification codes remain UUID v4. External SQL writers must provide these values. Timestamps use `timestamptz(3)`, booleans are native booleans, and JSON payloads use JSONB. Amounts, quantities, and counters use bigint mapped to JavaScript numbers, with checks retaining the existing safe-integer limits. Monetary values remain integer minor units.

Drizzle update operations maintain `updated_at` through `$onUpdate`. Raw SQL and other writers must set it explicitly. Timestamp insertion defaults run in PostgreSQL. Application inputs still require validation; database checks provide another boundary.

Use `withDatabase(connectionString, async (db) => { ... })` for backend queries and `db.transaction(async (tx) => { ... })` for related writes. The helper creates a request-owned pool and closes it in `finally`. Keep live connections out of global Worker state. Retries for payment and fulfillment writes require application idempotency; they are not added automatically by the connection helper.

## Testing

```bash
pnpm test
pnpm check
```

Frontend tests use jsdom. The primary Hono suite runs in Node without database credentials or a running database. PostgreSQL integration tests are a separate opt-in command. Point them at a migrated development/test database, never production:

```bash
# Bash / WSL; use the database created above, or a separate migrated test database.
TEST_DATABASE_URL=postgresql://fans:fans_local@127.0.0.1:5432/fans pnpm test:db
```

These tests cover native type round trips, amount/currency checks, composite foreign keys, duplicate webhook events, transaction rollback, and database readiness. Fixtures are rolled back. Integration tests do not fall back to application credentials or run migrations automatically. Re-running `pnpm db:migrate` should apply no additional changes; `pnpm db:generate` should find no schema changes on a clean checkout.

## Production preparation

`vite build` selects Wrangler's production environment through `.env.production`; `pnpm deploy` builds and then deploys that flattened configuration. The production Worker is named `fans-platform`. Development uses the top-level `platform` configuration. Frontend `VITE_*` variables are public; database credentials must never use that prefix.

Before database-backed production use, choose and provision PostgreSQL, migrate it with separate deployment credentials, and configure the runtime connection. For the current direct-connection adapter, set the Worker secret:

```bash
pnpm --dir apps/platform exec wrangler secret put DATABASE_URL --env production
```

Local `.dev.vars` values are not uploaded as production secrets. Use TLS settings appropriate to the hosted database, separate runtime and migration roles, and a separate staging database. No Neon account, connection string, or resource ID is included here.

For Cloudflare production, Hyperdrive can later supply its `connectionString` to the same `withDatabase` helper; configure its binding and disable query caching for authentication, permissions, payments, and reads that require fresh data. A deployed staging test is needed because local development does not exercise Hyperdrive pooling/caching. Select and measure the hosted connection setup before relying on production latency or scale-to-zero behavior.

Authentication, authorization, and course/payment operations remain deferred. Better Auth should use its PostgreSQL Drizzle adapter and the request's connection when implemented. Dashboard pages are currently public placeholders.
