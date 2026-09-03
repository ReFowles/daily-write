# AGENTS.md

## Project Overview

**daily-write** is a Next.js application for tracking daily writing habits and progress. The app allows users to log writing sessions, view history, and track statistics.

## Tech Stack

- **Framework**: Next.js 16.0.3 (App Router)
- **Runtime**: React 19.2.0
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 4.x
- **Package Manager**: **pnpm** (v10.20.0)
- **Linting**: ESLint 9.x with Next.js config
- **Formatting**: Prettier 3.x
- **Compiler**: React Compiler (babel-plugin-react-compiler 1.0.0)
- **Auth**: NextAuth v5 (beta) with Google provider
- **Database**: Firebase Firestore
- **Integrations**: Google Docs & Drive APIs (googleapis)
- **Editor**: Tiptap (`@tiptap/react`) via a decoupled `Editor` component in `src/components/editor/`

## Project Structure

```
src/
├── app/                            # Next.js App Router pages & routes
│   ├── globals.css                # Global styles
│   ├── icon.svg                   # App icon
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home (dashboard) — server component
│   ├── theme-init.tsx             # Theme initialization script
│   ├── about/                     # About page
│   │   └── page.tsx
│   ├── goals/                     # Goals page
│   │   └── page.tsx
│   ├── write/                     # Writing session page
│   │   └── page.tsx
│   └── api/                       # Route handlers
│       ├── auth/[...nextauth]/    # NextAuth handler
│       │   └── route.ts
│       └── google-docs/           # Google Docs CRUD proxy
│           └── route.ts
├── components/                     # React components (grouped by route; shared at root)
│   ├── DayCard.tsx                # Day display card (shared: dashboard + goals calendars)
│   ├── GoalCard.tsx               # Goal display card (shared: dashboard + goals)
│   ├── PageHeader.tsx             # Reusable page header (shared: all routes)
│   ├── about/                     # /about route
│   │   └── AboutPageClient.tsx
│   ├── dashboard/                 # / (home) route
│   │   ├── DashboardClient.tsx
│   │   ├── ProgressCard.tsx
│   │   ├── SortableCards.tsx
│   │   ├── StatsCard.tsx
│   │   └── WeeklyCalendar.tsx
│   ├── goals/                     # /goals route
│   │   ├── CalendarHeader.tsx
│   │   ├── CreateGoalForm.tsx
│   │   ├── GoalsPageClient.tsx
│   │   └── MonthlyCalendar.tsx
│   ├── navigation/                # Navigation shell mounted in layout.tsx
│   │   ├── MobileNavMenu.tsx
│   │   ├── NavLinks.tsx
│   │   ├── NavShortcuts.tsx
│   │   ├── Navigation.tsx
│   │   ├── SignInButton.tsx       # Also used directly on /about
│   │   ├── SignOutButton.tsx
│   │   └── ThemeToggle.tsx
│   ├── write/                     # /write route
│   │   ├── DocumentTabs.tsx
│   │   ├── GoogleDocsPicker.tsx
│   │   └── editor/                # Tiptap-backed Editor (implementation isolated here)
│   │       ├── Editor.tsx
│   │       ├── Toolbar.tsx
│   │       ├── doc-style-passthrough.ts
│   │       └── index.ts
│   └── ui/                        # UI primitives (shared)
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       └── ProgressBar.tsx
├── lib/                            # Utilities, hooks, and service layer
│   ├── auth.ts                    # NextAuth configuration
│   ├── class-utils.ts             # CSS class utility (`cn`)
│   ├── content-to-google-docs.ts  # DocumentContent -> Google Docs batchUpdate requests
│   ├── data-store.ts              # Firestore CRUD for goals & sessions
│   ├── date-utils.ts              # Date formatting utilities
│   ├── document-content.ts        # Editor-agnostic DocumentContent type + helpers
│   ├── firebase.ts                # Firebase client singleton
│   ├── google-docs-to-content.ts  # Google Docs API response -> DocumentContent
│   ├── google-docs.ts             # Google Docs & Drive API wrappers
│   ├── theme-utils.ts             # Theme class tokens
│   ├── types.ts                   # Shared domain type definitions
│   ├── use-calendar-navigation.ts # Hook: calendar navigation
│   ├── use-current-goal.ts        # Hook: current goal + progress
│   └── use-toggle.ts              # Hook: boolean toggle
└── types/                          # Ambient TypeScript declarations
    └── next-auth.d.ts             # Session/JWT module augmentation
```

Top-level files of note:

- `firestore.rules` — Firestore security rules (per-user isolation via `request.auth.token.email`).
- `scripts/` — Reserved for maintenance scripts (currently empty).

## Development Workflow

### Package Management

**Always use `pnpm` for package management.** This project is configured to use pnpm exclusively.

```bash
# Install dependencies
pnpm install

# Add a new dependency
pnpm add [package-name]

# Add a dev dependency
pnpm add -D [package-name]

# Remove a dependency
pnpm remove [package-name]
```

### Running the Development Server

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

```bash
pnpm build
pnpm start
```

### Linting, Type-checking, and Formatting

```bash
pnpm lint          # ESLint
pnpm typecheck     # tsc --noEmit
pnpm format        # Prettier write
pnpm format:check  # Prettier check (CI-safe)
```

**Important: All linting errors must be addressed, not silenced.** Do not use `eslint-disable` comments or suppress warnings unless there is a documented, exceptional reason. Fix the underlying issues instead.

### Testing

```bash
pnpm test           # Run the suite once (Vitest)
pnpm test:watch     # Watch mode for local development
pnpm test:coverage  # Run once with v8 coverage → HTML report in coverage/
```

Testing stack: **Vitest** + **@testing-library/react** + **@testing-library/jest-dom** + **jsdom**. Config lives in [vitest.config.mts](vitest.config.mts); the global `@testing-library/jest-dom/vitest` matcher setup is in [vitest.setup.ts](vitest.setup.ts).

#### File layout & discovery

- Tests live next to the code they cover: `foo.ts` → `foo.test.ts`, `Foo.tsx` → `Foo.test.tsx`.
- Vitest picks up `src/**/*.{test,spec}.{ts,tsx}`. Do not create a top-level `__tests__/` directory.
- Coverage excludes `src/app/**/page.tsx`, `src/app/**/layout.tsx`, and `src/app/theme-init.tsx` — those are exercised at build time by Next.js.

#### What to test

Prioritize behavior that would break the app for a real user or silently return wrong data.

- **Pure utilities** (`src/lib/date-utils.ts`, `class-utils.ts`, etc.): high-value, cheap. Test edge cases (empty input, boundary dates, DST-safe cases).
- **Data-store functions**: mock `firebase/firestore` and `./firebase`; assert that the right queries are built and results are shaped/sorted correctly.
- **API routes** (`src/app/api/**/route.ts`): mock `@/lib/auth` and downstream service modules; assert 401/400/500 branches and happy paths.
- **Hooks with logic**: use `renderHook` + `act` from `@testing-library/react`; assert state transitions and effect side-effects (via mocked dependencies).
- **Components with logic or user interaction**: forms, calendars, cards that compute values from props. Assert what the user sees (aria-labels, text) and that callbacks fire with the right arguments.

#### What is overkill

Skip tests that only re-verify framework/library behavior or lock in incidental output.

- **Do not** snapshot-test whole components — Tailwind class strings change often and snapshots become noise.
- **Do not** test presentational-only components that just render props (a `<Card>` with one `className` prop, an icon that returns a static `<svg>` — one smoke test is enough).
- **Do not** test config files: `src/lib/auth.ts`, `src/lib/firebase.ts`, `next.config.ts`, `tailwind.config.*`. They're wiring, not logic.
- **Do not** test theme class token maps (`src/lib/theme-utils.ts`) — testing that a constant equals itself has no signal.
- **Do not** test Next.js `page.tsx`/`layout.tsx` files directly. Test the client components they render instead (e.g. `DashboardClient.tsx`, not `page.tsx`).
- **Do not** re-test the same branch through multiple components. Test it once at the lowest level that owns the behavior.
- **Do not** assert on specific Tailwind class strings unless the class is load-bearing (e.g. `bg-green-500` for a completed-goal state). Prefer role/text/aria queries.

#### Writing tests — conventions

- Use `describe` blocks per unit under test; use `it("does X when Y")` for scenarios.
- Prefer role-based queries: `getByRole("button", { name: /save/i })`, `getByLabelText(/end date/i)`. Fall back to `getByText` only when semantics don't apply.
- Assert on user-visible signals (aria-labels, text content, form values, callback arguments), not implementation details (state variables, internal function calls).
- Use `vi.useFakeTimers({ toFake: ["Date"] })` when a hook or effect uses `waitFor`/`setTimeout` internally — faking `Date` only leaves timers real so Testing Library's async helpers still work.
- Mock at the module boundary with `vi.mock("...", () => ({ ... }))` at the top of the file, then import + `vi.mocked(...)` the specific functions inside `describe`.
- Reset mocks per test with `beforeEach(() => vi.clearAllMocks())` when using shared mocks.
- Keep fixtures small and inline — don't build shared factories until the third caller.
- When a test reveals a real bug, either fix the code or add a `// TODO:` comment above the assertion and open an issue; **never** encode buggy behavior as the expected result.

#### Mocking specific dependencies

- **`firebase/firestore`**: mock the full module with `vi.fn()` for `collection`, `doc`, `query`, `where`, `getDocs`, `getDoc`, `addDoc`, `updateDoc`, `deleteDoc`, and a `Timestamp` stub. See [src/lib/data-store.test.ts](src/lib/data-store.test.ts) for a reference harness including `snapshotFrom` / `docSnapshotFrom` helpers.
- **`next-auth`'s `auth`**: it's an overloaded function; narrow it in tests with `vi.mocked(auth as unknown as () => Promise<MinimalSession>)`. See [src/app/api/google-docs/route.test.ts](src/app/api/google-docs/route.test.ts).
- **`next-auth/react`'s `useSession`**: mock the module and return whatever session shape the hook needs; see [src/lib/use-current-goal.test.ts](src/lib/use-current-goal.test.ts).
- **`next/link`**: mock it to a plain anchor when a component test only needs to assert `href`.

#### When adding a feature

1. If the feature touches `src/lib/` (pure or data-layer): **write a test**.
2. If it touches an API route: **write a test** covering unauthorized, invalid-input, and success paths.
3. If it's a new UI component with computed state or user interactions: **write a test** for the interaction.
4. If it's a purely presentational component (props → JSX with no branches): tests are optional.

## Architecture & Data Model

### Type System

Domain types live in `src/lib/types.ts` (`Goal`, `WritingSession`, `DayData`, `CalendarDay`, `GoogleDoc`, `DocumentTab`). Ambient module augmentations (e.g. NextAuth session/JWT) live in `src/types/`.

- **Goal**: Represents a writing goal with start/end dates and daily word target
- **WritingSession**: Tracks words written on a specific date
- **DayData**: Combines date, words written, and goal for a single day
- **CalendarDay**: Extended day data with UI state (isToday, isFuture)
- **GoogleDoc / DocumentTab**: Google Docs metadata used by the Docs integration

All date strings follow `YYYY-MM-DD` format for consistency.

### Custom Hooks

The project uses custom React hooks for reusable logic:

- **use-calendar-navigation.ts**: Handles month/week navigation in calendar views
- **use-current-goal.ts**: Manages current goal state and filtering
- **use-toggle.ts**: Generic toggle state management

These hooks encapsulate business logic and make components cleaner and more focused.

## Code Style Guidelines

### TypeScript

- Use TypeScript for all new files
- Define proper types and interfaces in `src/lib/types.ts`; avoid `any`
- Import types from the central types file for consistency
- Leverage type inference where appropriate
- Use strict mode settings

### React Components

- Use functional components with hooks
- Follow the React 19 patterns and best practices
- Utilize the React Compiler for automatic optimizations
- Keep components focused and single-purpose
- Use proper prop typing with TypeScript interfaces

#### Component Organization

Components are organized **by route**. Anything used by exactly one route lives in that route's folder; anything used across routes (or by `layout.tsx`) lives at the components root.

Folders:

1. **Shared feature components** (`src/components/`): Used by 2+ routes. Currently `PageHeader`, `GoalCard`, `DayCard`.
2. **Route folders** (`src/components/{dashboard,goals,write,about}/`): Components used only by that route, including its `*PageClient.tsx`.
3. **Navigation** (`src/components/navigation/`): The `Navigation` shell (mounted in `layout.tsx`) and its children. Grouped rather than kept at the root to reduce clutter.
4. **UI primitives** (`src/components/ui/`): Reusable base components (`Button`, `Card`, `Input`, `ProgressBar`).

When creating or moving a component:
- If only one route imports it → put it in that route's folder.
- If a second route starts importing it → promote it to the components root and update the usage table below.
- If it's a low-level primitive (styled `<button>`, `<input>`, etc.) → `ui/`.

Import conventions inside `src/components/`:
- Same-folder siblings: relative (`./StatsCard`).
- Anything else (shared components, `ui/`, `@/lib/*`): absolute alias (`@/components/PageHeader`, `@/components/ui/Button`).

##### Component usage table

Keep this table in sync when a component's scope changes. If a route stops importing a component, or a shared component drops to a single caller, move the file and update the row.

| Component | Location | Used by |
| --- | --- | --- |
| `PageHeader` | `components/PageHeader.tsx` | `/`, `/goals`, `/write`, `/about` |
| `GoalCard` | `components/GoalCard.tsx` | `/` (via `DashboardClient`), `/goals` (via `GoalsPageClient`) |
| `DayCard` | `components/DayCard.tsx` | `WeeklyCalendar` (dashboard), `MonthlyCalendar` (goals) |
| `DashboardClient` | `components/dashboard/` | `src/app/page.tsx` |
| `StatsCard` | `components/dashboard/` | `DashboardClient` |
| `ProgressCard` | `components/dashboard/` | `DashboardClient` |
| `WeeklyCalendar` | `components/dashboard/` | `DashboardClient` |
| `SortableCards` | `components/dashboard/` | `DashboardClient` |
| `GoalsPageClient` | `components/goals/` | `src/app/goals/page.tsx` |
| `CreateGoalForm` | `components/goals/` | `GoalsPageClient` |
| `MonthlyCalendar` | `components/goals/` | `GoalsPageClient` |
| `CalendarHeader` | `components/goals/` | `MonthlyCalendar` |
| `GoogleDocsPicker` | `components/write/` | `src/app/write/page.tsx` |
| `DocumentTabs` | `components/write/` | `src/app/write/page.tsx` |
| `editor/` (Tiptap) | `components/write/editor/` | `src/app/write/page.tsx` |
| `AboutPageClient` | `components/about/` | `src/app/about/page.tsx` |
| `Navigation` | `components/navigation/` | `src/app/layout.tsx` |
| `NavLinks` | `components/navigation/` | `Navigation` |
| `NavShortcuts` | `components/navigation/` | `Navigation` |
| `MobileNavMenu` | `components/navigation/` | `Navigation` |
| `ThemeToggle` | `components/navigation/` | `Navigation` |
| `SignInButton` | `components/navigation/` | `Navigation`, `src/app/about/page.tsx` |
| `SignOutButton` | `components/navigation/` | `Navigation` |
| `ui/*` | `components/ui/` | Many; treat as always-shared |

### File Naming

- **Components**: CapitalCamelCase matching the component name (e.g., `ThemeToggle.tsx`, `MonthlyCalendar.tsx`, `CreateGoalForm.tsx`)
- **Actions, hooks, utilities**: kebab-case (e.g., `date-utils.ts`, `use-current-goal.ts`, `dummy-data.json`)
- **Pages**: kebab-case with Next.js conventions (e.g., `page.tsx`, `layout.tsx`)

### Styling

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use semantic HTML elements
- Maintain consistent spacing and sizing scale

### Theming

The application supports six themes divided into two categories:

- **Light themes**: "Light", "Strawberry", "Seafoam"
- **Dark themes**: "Dark", "Cherry", "Ocean"

Users can toggle between themes using the theme selector in the navigation.

## Best Practices for AI Agents

### Making Changes

1. **Read before writing**: Always examine existing code before making modifications
2. **Maintain consistency**: Match the existing code style and patterns
3. **Test thoroughly**: Verify that changes work as expected
4. **Fix linting errors**: Address all ESLint warnings and errors properly
5. **Use pnpm**: Never suggest npm or yarn commands

### Common Tasks

#### Adding a New Component

1. Decide the folder (see [Component Organization](#component-organization)):
   - Used by exactly one route → `src/components/{route}/`
   - Used by 2+ routes or by `layout.tsx` → `src/components/` (root)
   - Reusable primitive → `src/components/ui/`
2. Use TypeScript with proper prop types
3. Apply Tailwind classes for styling
4. Export the component as default or named export
5. If the component is shared (or its scope later widens), add/update its row in the component usage table
6. Run linting to ensure code quality

#### Adding a New Page

1. Create a new directory under `src/app/`
2. Add a `page.tsx` file with the page component
3. Follow Next.js App Router conventions
4. Update navigation if needed
5. Test the route in the development server

#### Fixing Linting Errors

- **Never** add `// eslint-disable-next-line` comments
- **Never** add `/* eslint-disable */` blocks
- **Always** fix the underlying issue
- Common fixes:
  - Add missing dependencies to useEffect
  - Use proper key props in lists
  - Remove unused variables and imports
  - Fix accessibility issues (e.g., alt text, ARIA labels)

#### Adding Dependencies

```bash
# Production dependency
pnpm add [package-name]

# Development dependency
pnpm add -D [package-name]
```

Always commit the updated `pnpm-lock.yaml` file.

## Common Pitfalls to Avoid

1. **Don't use npm or yarn** - This project uses pnpm exclusively
2. **Don't silence linting errors** - Fix them properly
3. **Don't ignore TypeScript errors** - Address type issues correctly
4. **Don't mix styling approaches** - Use Tailwind CSS consistently
5. **Don't skip testing** - Run `pnpm test` and verify changes in the browser. If your change adds logic to `src/lib/`, an API route, or an interactive component, add a test for it (see [Testing](#testing)).

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [pnpm Documentation](https://pnpm.io)

## Questions or Issues?

When encountering problems:
1. Check the console for errors
2. Review ESLint output for warnings
3. Verify TypeScript compilation with `pnpm build`
4. Consult the relevant documentation
5. Examine existing code patterns in the project
