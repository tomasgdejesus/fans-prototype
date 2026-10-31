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

In `apps/platform/.dev.vars`, use `DATABASE_URL` for PgBouncer (port 6432) and `DATABASE_MIGRATION_URL` for direct PostgreSQL access (port 5432). Both use the local credentials in `compose.yaml`; both ports bind to loopback. Update these two values in an existing `.dev.vars` while keeping its auth settings. Keep Vite and Docker in the same development environment (for example, WSL with Docker Desktop integration).

Docker stores data in a named volume. `pnpm db:down` retains it; `docker compose down --volumes` deletes it. Removing `.wrangler/state/` does not reset PostgreSQL. Changing `POSTGRES_*` initialization settings does not change credentials in an existing database volume.

## Database changes

PostgreSQL 18+ is required. 

```bash
pnpm db:generate
# Review and commit new SQL and snapshot files.
pnpm db:migrate
pnpm db:studio
```

Migrations and Studio require `DATABASE_MIGRATION_URL` from the environment or `.dev.vars`; they never fall back to the pooled application URL.

## Authentication core

Better Auth is mounted at `/api/auth/*`. Set `BETTER_AUTH_URL` to the application's exact
origin (normally `http://localhost:5173` locally), and put a secret generated with
`openssl rand -base64 32` in `apps/platform/.dev.vars` as `BETTER_AUTH_SECRET`.
Missing or invalid configuration returns HTTP 503. 

Email/password signup, login, sessions, and logout are enabled. The standard
signup endpoint still takes a `name`; this corresponds to display name/default of FANS user.
`platformRole` and `status` are server-owned.

The browser uses same-origin Better Auth requests and one TanStack Query session
cache. Signup supplies `FANS user` as the internal display name. Logout and account
changes cancel requests and clear other query/mutation caches. Sessions refresh on
route entry, window focus, and every minute; auth changes also notify other tabs
when BroadcastChannel is available.



## Testing

```bash
pnpm test
pnpm check
```

Frontend tests use jsdom. The primary Hono suite runs in Node without database credentials or a running database. PostgreSQL integration tests are ran separately:

```bash
# Bash / WSL; use the database created above, or a separate migrated test database.
TEST_DATABASE_URL='postgresql://fans:fans_local@127.0.0.1:6432/fans?sslmode=disable' \
TEST_DATABASE_DIRECT_URL='postgresql://fans:fans_local@127.0.0.1:5432/fans?sslmode=disable' \
pnpm test:db
```

Both URLs must select the same migrated test database. These tests cover pooled concurrent transactions, database constraints, and Better Auth's signup, login, sessions,
logout, and origin checks. Database fixtures are rolled back; auth tests delete
their unique test users after each case because HTTP requests use separate
connections. Tests do not fall back to application credentials or run migrations
automatically. Re-running `pnpm db:migrate` should apply no additional changes;
`pnpm db:generate` should find no schema changes on a clean checkout.

## Production preparation

`vite build` selects Wrangler's production environment through `.env.production`; `pnpm deploy` builds and then deploys that flattened configuration. The production Worker is named `fans-platform`. Development uses the top-level `platform` configuration. Frontend `VITE_*` variables are public; database credentials must never use that prefix.

Before database-backed production use, choose and provision PostgreSQL, migrate it with separate deployment credentials, and configure the runtime connection. Use a transaction-pooled endpoint for `DATABASE_URL` with verified TLS, and a direct endpoint for Node migration tooling via `DATABASE_MIGRATION_URL`. No hosted database or Hyperdrive resource is configured. Set the Worker secret:

```bash
pnpm --dir apps/platform exec wrangler secret put DATABASE_URL --env production
```

Local `.dev.vars` values are not uploaded as production secrets. 

Before enabling authentication in production, set `BETTER_AUTH_URL` to the HTTPS
application origin and configure `BETTER_AUTH_SECRET` in the production Worker.
Configure shared rate-limit storage; the default in-memory limiter is per isolate.

### Local email

Email configuration and senders: `src/worker/email/`. React Email templates:
`src/worker/email/templates/`. Verification expiry: `src/shared/constants/auth.ts`.
Configure `EMAIL_PROVIDER`, `EMAIL_FROM`,
`SMTP_HOST`, and `SMTP_PORT` in `.dev.vars` using `.dev.vars.example`.
Email configuration is required. From the repository root:

```bash
pnpm mail:up
pnpm dev
# Inbox: http://localhost:1080
pnpm test:email
pnpm mail:down
```

`test:email` requires MailDev; `test:db` uses a recording sender for auth emails.
`pnpm check` requires neither service. For a Workers runtime smoke test, register
in the running app, open its verification email, then complete forgot/reset password.
`SendEmail` type and are selected in `src/worker/email/index.ts`.
