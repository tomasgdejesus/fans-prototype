# Techstack Description

WARNING: This document was last written on October 10, 2026. Be aware that current dependencies may have changed since this file was written.
Descriptions may be out-of-date.

# src/react-app

This is the source for the vite+react SPA frontend.

- Styling: TailwindCSS
- TanStack Query. Manage data fetched from the backend
- React Hook Form. Forms
- Routing: ReactRouter. This serves to help routing so new browser reloads are not needed after going to different route (e.g. /dashboard -> /settings)

# src/worker

This is the source for the Hono worker to serve the backend api.

# Shared
- Auth: BetterAuth
- ORM: Drizzle ORM (TODO ADD)
- Migrations: Drizzle Kit (TODO ADD)
- Validation: Zod
- Hono RPC. Typed HTTP Client from backend -> frontend.