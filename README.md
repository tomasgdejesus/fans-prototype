# FANS

A pnpm workspace using React, TypeScript, Vite, and Mantine for the frontend, with Hono on Cloudflare Workers for the API. 

## Structure

| Path | Purpose |
| --- | --- |
| `apps/platform/src/react-app/` | Frontend components and styles |
| `apps/platform/src/worker/` | API routes |
| `apps/platform/public/` | Static assets |
| `apps/platform/wrangler.json` | Worker configuration and bindings |
| `pnpm-workspace.yaml` | Workspace configuration |
| `pnpm-lock.yaml` | Shared dependency lockfile |

## Setup

Use Node.js 22.22+, Docker with Compose v2, and the pnpm version pinned in the root `package.json`.

After cloning or extracting the repository, run from its root:

```bash
pnpm install --frozen-lockfile
cp apps/platform/.dev.vars.example apps/platform/.dev.vars
pnpm db:up
pnpm db:migrate
pnpm dev
```

Open the URL printed in the terminal, normally `http://localhost:5173`. The frontend and API run together.

## Commands

Run all commands from the repository root.

| Action | Command |
| --- | --- |
| Develop | `pnpm dev` |
| Build | `pnpm build` |
| Deploy | `pnpm deploy` |
| Type-check | `pnpm --dir apps/platform run typecheck` |
| Lint | `pnpm --dir apps/platform run lint` |
| Full check | `pnpm --dir apps/platform run check` |
| Preview build | `pnpm --dir apps/platform run preview` |
| Generate Worker types | `pnpm --dir apps/platform run cf-typegen` |

`build` includes type-checking. `deploy` includes a production build. `check` runs lint, tests, build, and a deployment dry run without publishing.

## Local Dev Database

The app uses PostgreSQL and Drizzle. `pnpm db:up` starts local PostgreSQL and its transaction pooler (PgBouncer) in Docker; `pnpm db:down` stops it while retaining its data.
`docker compose down --volumes` deletes volume. Use `pnpm db:generate` after schema changes, review the SQL, then run `pnpm db:migrate`. See [platform setup](apps/platform/README.md) for connection settings, integration tests, and hosted database preparation.

## Dependencies

Target the app that uses the package. Replace `<package>` with its name:

```bash
pnpm --filter ./apps/platform add <package>
pnpm --filter ./apps/platform add -D <package>
pnpm --filter ./apps/platform remove <package>
pnpm --filter ./apps/platform update <package>
```

Use `-D` for development tools. Add root-level tooling with `pnpm add -Dw <package>`. Commit changed package manifests and `pnpm-lock.yaml` together. Use pnpm consistently across the repository.

## Configuration and deployment

- Public frontend variables: `apps/platform/.env.local`, using the `VITE_` prefix. These values are visible in the browser.
- Local Worker secrets: `apps/platform/.dev.vars`. Keep secrets out of Git.
- Worker bindings: `apps/platform/wrangler.json`. Regenerate Worker types after changing bindings.
- Database URLs: `DATABASE_URL` uses the pooler (local port 6432); `DATABASE_MIGRATION_URL` connects directly (local port 5432). Set both in `apps/platform/.dev.vars`; exported migration credentials take precedence for Drizzle tooling.
- Production builds select the production Worker using the tracked, non-secret `apps/platform/.env.production`. Production `DATABASE_URL` must be configured separately as a Worker secret before using database routes.

Authenticate before the first deployment:

```bash
pnpm --dir apps/platform exec wrangler login
```

Verify the target account and Worker configuration, then run the full check and `pnpm deploy`.
