---
phase: 07-frontend-setup-app-shell-auth-flows
plan: 02
subsystem: ui
tags: [react, next.js, tailwind, lucide-react, vitest, testing-library]

# Dependency graph
requires:
  - phase: 07-01
    provides: Tailwind CSS config, theme tokens, Outfit font, Providers, Wave-0 test stubs
provides:
  - TopBar component with hamburger aria-label and page title slot
  - Drawer slide-in nav panel with scrim, user header, nav items, logout
  - AppShell layout wrapper managing drawer open state
  - Route groups: (app)/layout.tsx, (app)/page.tsx, (app)/planner/page.tsx, (auth)/login/page.tsx
  - AppShell test suite with 7 real assertions passing
affects:
  - 07-03 (AuthProvider + ProtectedLayout will replace (app)/layout.tsx stub and LoginPage shell)
  - Phase 8+ (all recipe feature pages will be wrapped by AppShell)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - AppShell pattern: TopBar + Drawer + children + FAB compose the persistent chrome
    - TDD for UI components: write failing tests first (RED), implement to pass (GREEN)
    - Route groups with parenthesized directory names: (app)/ for protected, (auth)/ for public

key-files:
  created:
    - apps/web/src/components/layout/TopBar.tsx
    - apps/web/src/components/layout/Drawer.tsx
    - apps/web/src/components/layout/AppShell.tsx
    - apps/web/src/app/(app)/layout.tsx
    - apps/web/src/app/(app)/page.tsx
    - apps/web/src/app/(app)/planner/page.tsx
    - apps/web/src/app/(auth)/login/page.tsx
  modified:
    - apps/web/src/components/__tests__/AppShell.test.tsx

key-decisions:
  - "AppShell search+filter row is rendered inside AppShell itself (not in child pages) — it is persistent chrome for all app pages in Phase 7"
  - "Drawer nav 'Recetas' label also matches the TopBar default title — tests use getAllByText for that item to avoid multiple-element errors"
  - "(app)/layout.tsx is a temporary stub with null user — Plan 07-03 replaces it with AuthProvider + ProtectedLayout"

patterns-established:
  - "Pattern 1: Layout components live in apps/web/src/components/layout/ — TopBar, Drawer, AppShell"
  - "Pattern 2: Route groups use Next.js parenthesized directories: (app)/ and (auth)/"
  - "Pattern 3: next/navigation (usePathname, useRouter) is mocked in vitest via vi.mock for any component using router"

requirements-completed: [UX-01]

# Metrics
duration: 8min
completed: 2026-03-18
---

# Phase 7 Plan 02: App Shell Components Summary

**TopBar + Drawer + AppShell components pixel-accurate to UI-SPEC with slide-in animation, scrim, and FAB; route groups (app)/(auth) scaffolded; 7 AppShell tests passing**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-18T13:54:10Z
- **Completed:** 2026-03-18T14:02:00Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- TopBar with hamburger button (`aria-label="Abrir menú"`), centered title, right placeholder — matches UI-SPEC exactly
- Drawer with 280px slide-in panel, `rgba(44,44,42,0.3)` scrim, sand header with user name, nav items (Hoy/Recetas/Planificador), Cerrar sesión in `text-destructive`
- AppShell composing TopBar + Drawer + SearchBar + FilterActionsRow + children + FAB (`aria-label="Crear receta"`)
- Route groups in place: `(app)/layout.tsx`, `(app)/page.tsx`, `(app)/planner/page.tsx`, `(auth)/login/page.tsx`
- AppShell test suite: 7 real assertions passing (replaced Wave-0 stubs)

## Task Commits

Each task was committed atomically:

1. **Task 1: Build TopBar, Drawer, and AppShell components** - `22ecf74` (feat)
2. **Task 2: Create route groups, stub pages** - `2e21ec0` (feat, via pre-commit hook)

## Files Created/Modified
- `apps/web/src/components/layout/TopBar.tsx` - Full-width header: hamburger, title slot, right placeholder
- `apps/web/src/components/layout/Drawer.tsx` - Slide-in nav panel with scrim, user header, nav items, logout
- `apps/web/src/components/layout/AppShell.tsx` - Outer layout wrapper: manages drawer state, SearchBar, FAB
- `apps/web/src/app/(app)/layout.tsx` - Protected route group layout stub (replaced in 07-03)
- `apps/web/src/app/(app)/page.tsx` - RecipeListPage scaffold with empty state strings
- `apps/web/src/app/(app)/planner/page.tsx` - PlannerPage scaffold
- `apps/web/src/app/(auth)/login/page.tsx` - LoginPage shell (full form added in 07-03)
- `apps/web/src/components/__tests__/AppShell.test.tsx` - 7 real assertions replacing Wave-0 todos

## Decisions Made
- AppShell renders SearchBar + FilterActionsRow as persistent chrome for all (app) routes in Phase 7; child pages render only their content
- Drawer nav "Recetas" item label collides with AppShell default title prop — resolved in tests with `getAllByText` assertion
- (app)/layout.tsx uses `user={null}` stub so AppShell renders without crashing before AuthProvider is wired in Plan 07-03

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed "multiple elements" test failure for 'Recetas'**
- **Found during:** Task 1 (TDD GREEN — running tests after implementing components)
- **Issue:** `getByText('Recetas')` threw "Found multiple elements" because "Recetas" appears in both the TopBar default title and the Drawer nav item
- **Fix:** Changed assertion to `getAllByText('Recetas').length >= 1` with a clarifying comment
- **Files modified:** `apps/web/src/components/__tests__/AppShell.test.tsx`
- **Verification:** All 7 tests pass
- **Committed in:** `22ecf74` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Essential for test correctness. No scope creep.

## Issues Encountered
- Pre-commit hook auto-committed the (app)/ and (auth)/ route group files as a second commit (`2e21ec0`) before the manual `git add` + `git commit` command ran — resulted in no-op manual commit (nothing to stage). Both Task 1 and Task 2 changes are committed and verified.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- AppShell chrome is complete and ready to receive AuthProvider in Plan 07-03
- (app)/layout.tsx stub intentionally minimal — Plan 07-03 replaces it with real auth guard + ProtectedLayout
- (auth)/login/page.tsx stub is a loading placeholder — Plan 07-03 adds the full LoginPage form
- All routes resolve in Next.js build: `/`, `/login`, `/planner`

---
*Phase: 07-frontend-setup-app-shell-auth-flows*
*Completed: 2026-03-18*
