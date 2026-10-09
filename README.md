# FANS

A pnpm workspace using React, TypeScript, Vite, and Tailwind CSS for the frontend, with Hono on Cloudflare Workers for the API.

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

Use Node.js 22.12+ and pnpm 10.26+ within the pnpm 10 release line.

```bash
npm install --global pnpm@10
```

After cloning or extracting the repository, run from its root:

```bash
pnpm install --frozen-lockfile
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

`build` includes type-checking. `deploy` includes a build. `check` runs lint, build, and a deployment dry run without publishing.

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

Authenticate before the first deployment:

```bash
pnpm --dir apps/platform exec wrangler login
```

Verify the target account and Worker configuration, then run the full check and `pnpm deploy`.
