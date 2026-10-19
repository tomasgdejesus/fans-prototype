# Platform Architecture

The FANS platform uses a React single-page application and a Hono API, developed together with Vite and deployed through Cloudflare Workers. The database provider remains undecided.

## Intended folder structure

```text
apps/platform/
├── README.md
├── ARCHITECTURE.md
├── package.json
├── index.html
├── vite.config.ts
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
    │   │   └── providers.tsx      # App-wide providers
    │   ├── routes/               # Page folders follow URL paths
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
    │   │   └── ui/
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
- **Tailwind CSS:** styling.
- **React Router:** browser routes, navigation, and layouts.
- **TanStack Query:** server data fetching, caching, mutations, and invalidation.
- **React Hook Form:** form state and submission.
- **Better Auth client:** browser authentication flows.
- **Hono RPC client:** typed requests to the backend API.

Keep pages under `routes/` following URL paths, and register them explicitly in `app/router.tsx`. Folder names such as `[courseId]` are an organizational convention; route definitions use `:courseId`. Keep components used only by a page beside that page. Put domain components and API/query code reused across routes under `features/<feature>/`. Put generic UI under `components/` and app-wide clients under `lib/`.

The current scaffold wires navigation, TanStack Query, and a typed `/api/health` endpoint. Authentication and database connections remain deferred; dashboard pages are public placeholders.

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

## Database and schema management

**Drizzle ORM** provides typed table definitions and queries. SQLite is the intended dialect for straightforward future D1 integration; choosing SQLite does not select a hosting provider.

Keep provider-specific connection code separate from table definitions. D1 integration can later create the Drizzle client from a Worker database binding. No database client or adapter is required for schema generation.

Table IDs use UUID v7 values generated in the backend with `uuid` and Drizzle `$defaultFn(() => uuidv7())`. These callbacks run on Drizzle inserts when a value is omitted; they do not create SQL defaults. Direct SQL writers and external scripts must supply IDs explicitly. Certificate verification codes remain random UUID v4 values, also generated through an application callback.

Initial timestamps retain their SQLite SQL defaults. `updated_at` does not update automatically; update statements or a future database trigger must maintain it if needed. When Better Auth is configured, import `v7 as uuidv7` from `uuid` and set `advanced.database.generateId: () => uuidv7()` so its IDs follow the same convention.

Existing UUID v4 IDs remain valid and do not need rewriting. If the earlier SQL UUID defaults were applied, coordinate their removal with the external database process. If no SQL UUID defaults were applied, adding `$defaultFn` alone does not require a SQL migration.

**Drizzle Kit** is development tooling. A generation-only `drizzle.config.ts` belongs at the platform app root and specifies the dialect, schema path, and output directory without database credentials.

Database changes are currently applied manually through an external process. Keep the Drizzle definitions synchronized with that schema. Table declarations do not modify the database automatically.

Optional generated migrations describe differences between Drizzle snapshots; they do not inspect the live database. The external process remains authoritative for applied changes.

## Documentation

Keep repository setup and common commands in the root README. Keep app and feature details beside the code they describe, with links between documents. A future documentation site can collect these Markdown sources.

Package manifests and the lockfile record dependency versions.

