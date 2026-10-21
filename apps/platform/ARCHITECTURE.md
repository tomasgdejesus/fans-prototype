# Platform Architecture

The FANS platform uses a React single-page application and a Hono API, developed together with Vite and deployed through Cloudflare Workers. The database dialect is PostgreSQL; its hosting provider is not configured.

## Intended folder structure

```text
apps/platform/
├── README.md
├── ARCHITECTURE.md
├── package.json
├── index.html
├── vite.config.ts
├── postcss.config.cjs            # Mantine CSS transforms and breakpoint variables
├── wrangler.json
├── drizzle.config.ts
├── eslint.config.js
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.worker.json
├── tsconfig.node.json
├── worker-configuration.d.ts
├── .env.example
├── .dev.vars.example
├── public/                       # Public static assets
├── drizzle/                      # Generated SQL migrations and snapshots
├── docs/                         # App-specific guides
└── src/
    ├── react-app/
    │   ├── main.tsx
    │   ├── index.css
    │   ├── assets/
    │   ├── app/
    │   │   ├── router.tsx         # Register URLs, pages, layouts, and guards
    │   │   ├── providers.tsx      # App-wide providers
    │   │   └── theme.ts          # Shared Mantine theme
    │   ├── routes/               # Page folders follow URL paths
    │   │   ├── auth-layout.tsx   # Shared layout for account entry pages
    │   │   ├── page.tsx          # /
    │   │   ├── not-found.tsx
    │   │   ├── login/
    │   │   │   └── page.tsx
    │   │   ├── register/
    │   │   │   └── page.tsx
    │   │   ├── forgot-password/
    │   │   │   └── page.tsx
    │   │   ├── reset-password/
    │   │   │   └── page.tsx
    │   │   └── dashboard/
    │   │       ├── layout.tsx     # Dashboard navigation and child outlet
    │   │       ├── page.tsx       # /dashboard
    │   │       ├── courses/
    │   │       │   ├── page.tsx
    │   │       │   └── [courseId]/
    │   │       │       └── page.tsx
    │   │       ├── organizations/
    │   │       │   ├── page.tsx
    │   │       │   └── [organizationId]/
    │   │       │       └── page.tsx
    │   │       ├── orders/
    │   │       │   └── page.tsx
    │   │       └── settings/
    │   │           └── page.tsx
    │   ├── components/           # Reusable UI/etc. components reused across routes
    │   │   ├── language-switcher.tsx
    │   │   └── page-placeholder.tsx
    │   ├── i18n/
    │   │   ├── index.ts          # i18next initialization and language selection
    │   │   ├── i18next.d.ts      # Type-safe translation keys
    │   │   └── resources/
    │   │       ├── en.ts         # English translations and resource shape
    │   │       └── es.ts         # Spanish translations
    │   ├── features/             # Domain code reused across routes
    │   │   └── courses/
    │   │       ├── components/
    │   │       ├── api.ts        # Typed API calls
    │   │       └── queries.ts    # Query keys, options, mutations
    │   └── lib/
    │       ├── api-client.ts
    │       ├── auth-client.ts
    │       └── query-client.ts
    ├── worker/
    │   ├── index.ts              # Worker entry point
    │   ├── app.ts                # Hono app composition
    │   ├── env.ts                # Hono bindings and context types
    │   ├── auth/
    │   │   └── index.ts          # Better Auth server configuration
    │   ├── middleware/
    │   │   ├── session.ts
    │   │   └── authorization.ts
    │   ├── features/
    │   │   └── courses/          # Example feature
    │   │       ├── routes.ts
    │   │       ├── service.ts
    │   │       └── queries.ts
    │   └── db/
    │       ├── client.ts          # Request-owned PostgreSQL connection helper
    │       └── schema/
    │           ├── index.ts      # Exports all table definitions
    │           ├── auth.ts
    │           ├── people.ts
    │           ├── training.ts
    │           ├── commerce.ts
    │           └── payments.ts
    └── shared/
        ├── contracts/
        │   └── courses.ts        # Shared Zod request schemas
        └── constants/
```

## Frontend: src/react-app/

- **React and Vite:** application UI and frontend build tooling.
- **Mantine:** UI components, responsive layouts, and a shared theme. Use CSS Modules for custom styles; PostCSS provides Mantine mixins and breakpoint variables.
- **React Router:** browser routes, navigation, and layouts.
- **TanStack Query:** server data fetching, caching, mutations, and invalidation.
- **React Hook Form:** form state and submission.
- **Better Auth client:** browser authentication flows.
- **Hono RPC client:** typed requests to the backend API.
- **i18next and react-i18next:** English and Spanish localization, language selection, and type-safe translation keys.

Keep pages under `routes/` following URL paths, and register them explicitly in `app/router.tsx`. Folder names such as `[courseId]` are an organizational convention; route definitions use `:courseId`. Keep components used only by a page beside that page. Put domain components and API/query code reused across routes under `features/<feature>/`. Put generic UI under `components/` and app-wide clients under `lib/`.

`app/providers.tsx` composes Mantine and TanStack Query providers. `app/theme.ts` owns shared visual defaults. Import Mantine primitives directly from `@mantine/core`; create local shared components when the app needs a repeated composition. See [docs/UI.md](docs/UI.md) for examples. Mantine core styles load before application CSS in `main.tsx`.

The current scaffold wires responsive Mantine navigation, page placeholders, TanStack Query, and a typed `/api/health` endpoint. A request-owned PostgreSQL connection helper and database readiness endpoint are implemented. Authentication remains deferred; dashboard pages are public placeholders. Account entry pages share a pathless React Router layout; their existing URLs stay the same.

### Localization

Localization is configured under `i18n/` and initialized by `main.tsx`. English and Spanish resources are bundled with the frontend. The app uses a saved language preference when available, otherwise selects a supported browser language and falls back to English.

Keep user-facing interface text in the translation resources and access it through `useTranslation()`. The English resource defines the expected translation structure, while the Spanish resource is type-checked against it. The shared language switcher updates i18next, persists the selection, and updates the document's `lang` attribute.

## Backend: src/worker/

Hono serves the API under `/api`. The backend owns authentication checks, authorization, business rules, and database access.

- `app.ts`: compose API routes and middleware.
- `features/<feature>/routes.ts`: validate requests and construct HTTP responses.
- Feature services and queries: business logic and database operations, separated as complexity grows.
- `middleware/`: session handling and shared request checks.
- `auth/`: Better Auth server configuration.
- `db/schema/`: Drizzle table definitions.
- Database adapters: provider-specific connection setup.

Keep the Worker entry point small. Register typed Hono routes using composition that preserves RPC type inference.

## Shared code: src/shared/

Shared code must be safe to import into both the browser and backend.

- `contracts/`: Zod request schemas and types inferred from them.
- `constants/`: shared values that have the same meaning across both environments.

Validate requests again on the backend. Shared validation supports forms; server-side authorization determines access.

Infer ordinary API response types through Hono RPC. The frontend may import the exported API type using `import type`, without importing backend runtime code.

Keep Drizzle tables and database row types in the backend. API inputs and responses represent the public contract and may differ from stored rows.

## Testing

Vitest uses separate projects for the React application and backend:

```text
src/
├── react-app/
│   └── test/
│       ├── setup.ts
│       ├── helpers/
│       ├── components/
│       └── routes/
└── worker/
    └── test/
        └── app.test.ts
```

React tests use jsdom and React Testing Library for components, routes, localization, and user interactions. Backend tests run in Node and test the exported Hono application through `app.request()`. Route tests cover HTTP contracts, while service tests should call business logic directly with injected fakes or repository interfaces.

The primary backend suite must remain provider-neutral and must not require Wrangler, Miniflare, D1, or other Cloudflare-specific bindings. Provider adapters may have separate integration tests when introduced.

Shared test helpers and fixtures belong inside the applicable test tree. Add feature tests beneath paths matching the production source as those features are implemented. `vitest.config.ts` defines both test projects and coverage collection.

## Database and schema management

**Drizzle ORM** defines PostgreSQL tables under `src/worker/db/schema/`. Status checks, amount arithmetic, foreign keys, and existing domain boundaries remain enforced by the schema. Native PostgreSQL types replace SQLite representations: timestamptz(3), boolean, JSONB, and bigint amounts mapped to safe JavaScript numbers. IDs remain text UUIDs generated by application `$defaultFn` callbacks.

`src/worker/db/client.ts` isolates the `pg` driver and exports `withDatabase`. Connections belong to the current request and close in `finally`; no global pool is retained between Worker requests. Services should accept its typed `Database` argument. Interactive transactions use Drizzle's `db.transaction` callback. A future hosting adapter may pass a Hyperdrive connection string without changing table definitions or feature queries.

`/api/health` checks liveness without PostgreSQL. `/api/health/db` checks database connectivity and returns a generic 503 on failure. It does not prove the schema is migrated. Neither endpoint implements authentication.

Table IDs use UUID v7 values; certificate verification codes use UUID v4. External SQL writers supply their own values. Database defaults initialize timestamps; Drizzle `$onUpdate` maintains `updated_at` for ORM updates. Other writers must update it explicitly. Better Auth remains deferred; configure its PostgreSQL Drizzle adapter and UUID v7 generation when implementing authentication.

**Drizzle Kit** uses a credential-free `drizzle.config.ts` for generation. The separate `drizzle.runtime.config.ts` loads migration credentials from exported `DATABASE_URL` or the app's `.dev.vars` fallback. Migrations are reviewed, committed, and explicitly applied with `db:migrate`, not during application startup or frontend builds.

The active migration directory is `drizzle/postgresql/`; its baseline and metadata target an empty PostgreSQL database. Historical SQLite files are retained in the parent directory but are not part of the active history. No D1 data is automatically migrated. Docker Compose provides local PostgreSQL with a persistent named volume.

Primary application tests remain independent of a running database. Opt-in PostgreSQL integration tests live in `src/worker/integration/`, require an explicit `TEST_DATABASE_URL`, and use a migrated development/test database. See the platform README for commands.

Production builds select `env.production` through the non-secret `.env.production` file. Production database credentials are configured separately, never placed in `VITE_*` variables or committed Wrangler settings. No Neon or Hyperdrive resource is provisioned by this repository.

## Documentation

Keep repository setup and common commands in the root README. Keep app and feature details beside the code they describe, with links between documents. A future documentation site can collect these Markdown sources.

Package manifests and the lockfile record dependency versions.
