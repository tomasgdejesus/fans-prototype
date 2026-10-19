# FANS Platform

React SPA and Hono API developed together with Vite and deployed as one Cloudflare Worker.

See the [repository README](../../README.md) for installation and common commands, and [ARCHITECTURE.md](ARCHITECTURE.md) for code placement.

From the repository root:

```bash
pnpm dev
pnpm check
pnpm --dir apps/platform run db:generate
```

The home page checks `/api/health` through Hono RPC and TanStack Query. Page folders follow URL paths, but `src/react-app/app/router.tsx` explicitly registers them; adding a folder does not create a route.

Authentication, authorization, course operations, and database connections remain deferred. Dashboard pages are public placeholders until authentication is implemented.

The Drizzle schema uses SQLite SQL defaults for UUIDs and initial timestamps. `updated_at` does not change automatically on update. Generation creates SQL files; the external database process remains responsible for applying reviewed changes.
