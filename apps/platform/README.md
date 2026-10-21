# FANS Platform

React SPA and Hono API developed together with Vite and deployed as one Cloudflare Worker.

See the [repository README](../../README.md) for installation and common commands, and [ARCHITECTURE.md](ARCHITECTURE.md) for code placement.

The frontend uses Mantine for UI components and layout. See [docs/UI.md](docs/UI.md) for theming, CSS Modules, and React Hook Form integration.

## Testing

Vitest runs separate frontend and backend projects. React tests live under `src/react-app/test/` and use jsdom with React Testing Library. Provider-neutral Hono tests live under `src/worker/test/`, run in Node, and exercise the application through `app.request()`.

Test paths mirror the source paths they cover. Provider-specific adapter tests should remain separate from the primary application suites.

From the repository root:

```bash
pnpm dev
pnpm check
pnpm test
pnpm test:coverage
pnpm --dir apps/platform run db:generate
```

The home page checks `/api/health` through Hono RPC and TanStack Query. Page folders follow URL paths, but `src/react-app/app/router.tsx` explicitly registers them; adding a folder does not create a route.

Authentication, authorization, course operations, and database connections remain deferred. Dashboard pages are public placeholders until authentication is implemented.

Table IDs use application-generated UUID v7 values from the `uuid` package through Drizzle `$defaultFn` callbacks. Certificate verification codes use random UUID v4 values through the same package. External SQL writers must supply their own IDs and verification codes. Initial timestamps retain SQLite SQL defaults; `updated_at` does not change automatically on update. Generation creates SQL files; the external database process remains responsible for applying reviewed changes.
