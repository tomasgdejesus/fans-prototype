# Platform Architecture

The FANS platform uses a React single-page application and a Hono API, developed together with Vite and deployed through Cloudflare Workers. The database provider remains undecided.

## Frontend: src/react-app/

- **React and Vite:** application UI and frontend build tooling.
- **Tailwind CSS:** styling.
- **React Router:** browser routes, navigation, and layouts.
- **TanStack Query:** server data fetching, caching, mutations, and invalidation.
- **React Hook Form:** form state and submission.
- **Better Auth client:** browser authentication flows.
- **Hono RPC client:** typed requests to the backend API.

Organize domain-specific pages, components, and query code under `features/<feature>/`. Keep reusable UI components under `components/` and app-wide clients under `lib/`.

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

Keep provider-specific connection code separate from table definitions. D1 integration can later create the Drizzle client from a Worker database binding.

**Drizzle Kit** is development tooling. A generation-only `drizzle.config.ts` belongs at the platform app root and specifies the dialect, schema path, and output directory without database credentials.

Database changes are currently applied manually through an external process. Keep the Drizzle definitions synchronized with that schema. Table declarations do not modify the database automatically.

Optional generated migrations describe differences between Drizzle snapshots; they do not inspect the live database. The external process remains authoritative for applied changes.

## Documentation

Keep repository setup and common commands in the root README. Keep app and feature details beside the code they describe, with links between documents. A future documentation site can collect these Markdown sources.

Package manifests and the lockfile record dependency versions.

