# Platform UI

Mantine is the primary UI and layout library. React Router owns navigation,
TanStack Query owns server state, and React Hook Form owns forms. Zod remains
available for validation. Mantine does not replace those responsibilities.

## Setup and file placement

Run `pnpm install --no-frozen-lockfile` from the repository root after applying dependency changes.
Commit the updated manifest and lockfile together. Subsequent clean installs
can use `pnpm install --frozen-lockfile`.

| File or directory | Responsibility |
| --- | --- |
| `src/react-app/main.tsx` | Import Mantine core styles, then application CSS |
| `src/react-app/app/providers.tsx` | Mantine and TanStack Query providers |
| `src/react-app/app/theme.ts` | Shared colors, typography, radius, and component defaults |
| `src/react-app/routes/dashboard/layout.tsx` | Responsive AppShell and route navigation |
| `src/react-app/routes/auth-layout.tsx` | Shared account entry layout |
| `src/react-app/components/` | Generic app compositions reused across routes |
| `src/react-app/features/*/components/` | Domain-specific components |
| `postcss.config.cjs` | Mantine CSS transforms and breakpoint variables |

Import primitives directly from `@mantine/core`. Add a local shared component
when a composition repeats; avoid wrappers that merely rename Mantine props.
Keep components used by only one page beside that page.

The scaffold defaults to light mode. Teal is an initial theme choice; change
`primaryColor` and other defaults in `app/theme.ts` to match the final FANS brand.
Use `theme.components` for defaults that should apply to every instance of a
component. If you add a color scheme control later, use Mantine's color scheme
APIs so components and custom styles share the same state.

## Styling

Use `Stack`, `Group`, `Grid`, `SimpleGrid`, and `Container` for common layouts.
Use theme-aware props such as `gap="md"`, `c="dimmed"`, and `variant="light"`.
Tailwind and its Vite plugin have been removed.

For custom styles, colocate a `*.module.css` file and pass its classes through
`className` or Mantine's `classNames` API:

```css
/* course-card.module.css */
.root {
  padding: var(--mantine-spacing-lg);

  @media (max-width: $mantine-breakpoint-sm) {
    padding: var(--mantine-spacing-md);
  }
}
```

```tsx
import { Paper } from "@mantine/core";
import classes from "./course-card.module.css";

export function CourseCard() {
  return <Paper withBorder className={classes.root}>Course content</Paper>;
}
```

Keep PostCSS breakpoint variables synchronized with the theme if you override
Mantine's default breakpoints. Load additional Mantine package styles once,
after core styles, only when adopting that package. Keep Mantine package
versions aligned. Dates, notifications, charts, and `@mantine/form` are not
installed by this scaffold.

## Routing

Use React Router links to preserve SPA navigation:

```tsx
import { Button } from "@mantine/core";
import { Link } from "react-router";

<Button component={Link} to="/dashboard/courses">Courses</Button>
```

The dashboard uses Mantine `NavLink` with `renderRoot` and React Router's
`NavLink`. Forward all root props. React Router sets `aria-current`, which
Mantine uses for active styling. The overview link uses `end` so it does not
remain selected on every dashboard child route. Mobile navigation closes when
a navigation link is selected.

## Forms

Use React Hook Form with `zodResolver` from `@hookform/resolvers/zod`.

- `src/shared/contracts/auth.ts`: auth input schemas and inferred types.
- `src/shared/constants/auth.ts`: password limits, also used by Better Auth.
- `src/react-app/features/auth/form-schemas.ts`: password confirmation checks.
- `src/react-app/lib/validation.ts`: translate validation errors at render time.

Register standard inputs directly; use `Controller` for Select and MultiSelect.
Keep labels, `required`, autocomplete, and error display on inputs.

## Navigation progress

`src/react-app/app/layout.tsx` mounts one Mantine progress bar for all routes.
It tracks pending router navigation and initial queries with mounted consumers,
starting after 150 ms. Cached-data refreshes and unobserved prefetches stay quiet.
Pages using TanStack Query need no separate progress-bar setup.

## Testing + Verification


From the repository root, run:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm dev
```

Check public pages, catalog details, account forms, invalid recovery links,
the 404 page, and mobile navigation below 48em. Open dashboard navigation with the
keyboard, select a destination, and confirm it closes. Keep the page heading
hierarchy and link labels meaningful as placeholders become working features.
Run `pnpm check` before deployment for the existing deployment dry run.

References: [Mantine Vite setup](https://mantine.dev/guides/vite/),
[AppShell](https://mantine.dev/core/app-shell/),
[Styles API](https://mantine.dev/styles/styles-api/), and
[NavLink](https://mantine.dev/core/nav-link/).
