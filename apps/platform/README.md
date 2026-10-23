# FANS Platform

React SPA and Hono API developed with Vite and deployed as one Cloudflare Worker. PostgreSQL stores application data; Drizzle defines its schema and migrations. 

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

## Database changes

PostgreSQL 18+ is required. 

```bash
pnpm db:generate
# Review and commit new SQL and snapshot files.
pnpm db:migrate
pnpm db:studio
```

## Testing

```bash
pnpm test
pnpm check
```

Frontend tests use jsdom. The primary Hono suite runs in Node without database credentials or a running database. PostgreSQL integration tests are ran separately:

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

Local `.dev.vars` values are not uploaded as production secrets. 
