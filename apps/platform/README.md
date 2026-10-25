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

## Authentication core

Better Auth is mounted at `/api/auth/*`. Set `BETTER_AUTH_URL` to the application's exact
origin (normally `http://localhost:5173` locally), and put a secret generated with
`openssl rand -base64 32` in `apps/platform/.dev.vars` as `BETTER_AUTH_SECRET`.
Missing or invalid configuration returns HTTP 503. 

Email/password signup, login, sessions, and logout are enabled. The standard
signup endpoint still takes a `name`; this corresponds to display name/default of FANS user.
`platformRole` and `status` are server-owned.

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

These tests cover database constraints and Better Auth's signup, login, sessions,
logout, and origin checks. Database fixtures are rolled back; auth tests delete
their unique test users after each case because HTTP requests use separate
connections. Tests do not fall back to application credentials or run migrations
automatically. Re-running `pnpm db:migrate` should apply no additional changes;
`pnpm db:generate` should find no schema changes on a clean checkout.

## Production preparation

`vite build` selects Wrangler's production environment through `.env.production`; `pnpm deploy` builds and then deploys that flattened configuration. The production Worker is named `fans-platform`. Development uses the top-level `platform` configuration. Frontend `VITE_*` variables are public; database credentials must never use that prefix.

Before database-backed production use, choose and provision PostgreSQL, migrate it with separate deployment credentials, and configure the runtime connection. For the current direct-connection adapter, set the Worker secret:

```bash
pnpm --dir apps/platform exec wrangler secret put DATABASE_URL --env production
```

Local `.dev.vars` values are not uploaded as production secrets. 

Before enabling authentication in production, set `BETTER_AUTH_URL` to the HTTPS
application origin and configure `BETTER_AUTH_SECRET` in the production Worker.
Configure shared rate-limit storage; the default in-memory limiter is per isolate.
