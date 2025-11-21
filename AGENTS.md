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
- **Compiler**: React Compiler (babel-plugin-react-compiler 1.0.0)

## Project Structure

```
src/
├── app/                           # Next.js App Router pages
│   ├── globals.css               # Global styles
│   ├── icon.svg                  # App icon
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page (dashboard)
│   ├── theme-init.tsx            # Theme initialization
│   ├── goals/                    # Goals page
│   │   └── page.tsx
│   ├── history/                  # Writing history page
│   │   └── page.tsx
│   └── write/                    # Writing session page
│       └── page.tsx
├── components/                    # React components
│   ├── CalendarHeader.tsx        # Calendar header with month navigation
│   ├── CreateGoalForm.tsx        # Goal creation form
│   ├── DayCard.tsx               # Day display card
│   ├── GoalCard.tsx              # Goal display card
│   ├── GoalsPageClient.tsx       # Client-side goals page logic
│   ├── MonthlyCalendar.tsx       # Monthly calendar view
│   ├── Navigation.tsx            # Main navigation component
│   ├── PageHeader.tsx            # Reusable page header component
│   ├── ProgressCard.tsx          # Progress display card
│   ├── StatsCard.tsx             # Statistics display card
│   ├── ThemeToggle.tsx           # Theme switcher component
│   ├── WeeklyCalendar.tsx        # Weekly calendar view
│   ├── WritingStatsHeader.tsx    # Stats header component
│   ├── icons/                    # Icon components
│   │   ├── ChevronDown.tsx       # Chevron down icon
│   │   ├── ChevronLeft.tsx       # Chevron left icon
│   │   ├── ChevronRight.tsx      # Chevron right icon
│   │   ├── Moon.tsx              # Moon icon for dark theme
│   │   ├── Sun.tsx               # Sun icon for light theme
│   │   ├── Trash.tsx             # Trash/delete icon
│   │   └── index.ts              # Icon exports
│   └── ui/                       # UI primitives
│       ├── Button.tsx            # Button component
│       ├── Card.tsx              # Base card component
│       ├── Input.tsx             # Input component
│       └── ProgressBar.tsx       # Progress bar component
└── lib/                          # Utility functions and helpers
    ├── class-utils.ts            # CSS class utility functions
    ├── date-utils.ts             # Date formatting utilities
    ├── dummy-data.json           # Sample data for development
    ├── theme-utils.ts            # Theme management utilities
    ├── types.ts                  # TypeScript type definitions
    ├── use-calendar-navigation.ts # Custom hook for calendar navigation
    ├── use-current-goal.ts       # Custom hook for goal management
    └── use-toggle.ts             # Custom hook for toggle state
```

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

### Linting

```bash
pnpm lint
```

**Important: All linting errors must be addressed, not silenced.** Do not use `eslint-disable` comments or suppress warnings unless there is a documented, exceptional reason. Fix the underlying issues instead.

## Architecture & Data Model

### Type System

The application uses a centralized type system defined in `src/lib/types.ts`:

- **Goal**: Represents a writing goal with start/end dates and daily word target
- **WritingSession**: Tracks words written on a specific date
- **DayData**: Combines date, words written, and goal for a single day
- **CalendarDay**: Extended day data with UI state (isToday, isFuture)

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

Components are organized into three categories:

1. **Feature Components** (`src/components/`): Domain-specific components like `GoalCard`, `WeeklyCalendar`, `CreateGoalForm`
2. **UI Primitives** (`src/components/ui/`): Reusable base components like `Button`, `Card`, `Input`, `ProgressBar`
3. **Icons** (`src/components/icons/`): SVG icon components with consistent sizing and theming

When creating new components:
- Place domain-specific components in the root components folder
- Place reusable UI primitives in the `ui/` folder
- Place icon components in the `icons/` folder and export from `icons/index.ts`

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

1. Create the component file in `src/components/`
2. Use TypeScript with proper prop types
3. Apply Tailwind classes for styling
4. Export the component as default or named export
5. Run linting to ensure code quality

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
5. **Don't skip testing** - Always verify changes work in the browser

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
