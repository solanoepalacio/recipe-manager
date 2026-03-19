---
phase: 12-frontend-admin-panel
plan: "02"
subsystem: ui
tags: [react, nextjs, tailwind, admin, tanstack-query]

requires:
  - phase: 12-01
    provides: AdminAuthProvider, adminApi client, (admin)/layout.tsx with auth guard

provides:
  - AdminSidebar component (desktop sidebar + mobile tab bar, 5 nav items)
  - AdminTable generic typed component (column config, rows, actions, empty state)
  - AdminForm layout wrapper (title, children slots, cancel/submit buttons)
  - AdminPanelLayout combining sidebar + main content
  - admin/panel/layout.tsx rendering AdminPanelLayout
  - admin/panel/page.tsx redirect to /admin/panel/users
  - admin queryKeys namespace under ['admin', ...]
  - PaginationControls pageSizeOptions prop (backward-compatible)
  - OneTimeDisplay component with copy/dismiss

affects:
  - 12-03 (Users CRUD section uses AdminSidebar, AdminTable, AdminForm, queryKeys.admin.users)
  - 12-04 (Foods/Units CRUD sections use same primitives)
  - 12-05 (Tokens CRUD section uses same primitives + OneTimeDisplay)

tech-stack:
  added: []
  patterns:
    - AdminTable generic component pattern with column config array + getRowKey callback
    - AdminForm layout wrapper accepting children for field composition
    - admin queryKeys namespace prevents collision with user-facing foods/units keys

key-files:
  created:
    - apps/web/src/components/admin/AdminSidebar.tsx
    - apps/web/src/components/admin/AdminTable.tsx
    - apps/web/src/components/admin/AdminForm.tsx
    - apps/web/src/components/admin/AdminPanelLayout.tsx
    - apps/web/src/components/admin/OneTimeDisplay.tsx
    - apps/web/src/app/(admin)/admin/panel/layout.tsx
    - apps/web/src/app/(admin)/admin/panel/page.tsx
    - apps/web/tests/admin/OneTimeDisplay.test.tsx
  modified:
    - apps/web/src/lib/query-keys.ts
    - apps/web/src/components/recipes/PaginationControls.tsx

key-decisions:
  - "AdminSidebar renders desktop sidebar (lg:flex, 280px) + mobile tab bar (lg:hidden) in same component — no separate mobile component"
  - "AdminTable empty state renders div (not table) to avoid empty tbody — simpler and matches spec"
  - "pageSizeOptions prop on PaginationControls defaults to [10,20,50] — fully backward-compatible, existing recipe list unaffected"
  - "Test file placed at apps/web/tests/admin/ per plan spec — vitest default include pattern finds it"

patterns-established:
  - "AdminTable<T> generic pattern: columns: AdminTableColumn<T>[], rows: T[], getRowKey: (row: T) => string — all 5 CRUD sections follow this interface"
  - "AdminForm as layout shell: pass field inputs as children, handle submit/cancel via props — decouples field layout from form mechanics"

requirements-completed: [ADM-01, ADM-02, ADM-03, ADM-04, ADM-05, ADM-06]

duration: 5min
completed: 2026-03-19
---

# Phase 12 Plan 02: Admin Panel Shell Summary

**Admin panel shell with sidebar navigation, generic AdminTable/AdminForm/OneTimeDisplay primitives, and admin queryKeys namespace — shared foundation for all 5 CRUD sections (plans 03-05)**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-19T15:54:52Z
- **Completed:** 2026-03-19T15:59:52Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- AdminSidebar with desktop fixed sidebar (280px, bg-subtle) and mobile tab bar — both showing Usuarios/Hogares/Alimentos/Unidades/Tokens with active accent indicator
- Generic AdminTable and AdminForm components ready for all CRUD sections to import without duplicating table/form logic
- Admin queryKeys namespace (`['admin', ...]`) prevents collision with user-facing foods/units keys; PaginationControls gains backward-compatible pageSizeOptions prop
- OneTimeDisplay (raw token / password reset URL display) with copy-to-clipboard and dismiss — tested with 3 unit tests

## Task Commits

1. **Task 1: Admin query keys + PaginationControls update + OneTimeDisplay** - `d5ee2b0` (feat)
2. **Task 2: AdminSidebar + AdminTable + AdminForm + panel layout + redirect** - `17047f3` (feat)

## Files Created/Modified

- `apps/web/src/lib/query-keys.ts` - Added admin namespace with users/households/foods/units/tokens sub-keys
- `apps/web/src/components/recipes/PaginationControls.tsx` - Added optional pageSizeOptions prop (defaults to [10,20,50])
- `apps/web/src/components/admin/OneTimeDisplay.tsx` - One-time copyable value display with copy/dismiss buttons
- `apps/web/tests/admin/OneTimeDisplay.test.tsx` - 3 unit tests: render, copy, dismiss
- `apps/web/src/components/admin/AdminSidebar.tsx` - Desktop sidebar + mobile tab bar with 5 nav items + logout
- `apps/web/src/components/admin/AdminTable.tsx` - Generic typed table with column config, rows, actions column, empty state
- `apps/web/src/components/admin/AdminForm.tsx` - Form layout wrapper with title, children fields, cancel/submit buttons
- `apps/web/src/components/admin/AdminPanelLayout.tsx` - Combines AdminSidebar + main content flex layout
- `apps/web/src/app/(admin)/admin/panel/layout.tsx` - Renders AdminPanelLayout for panel routes
- `apps/web/src/app/(admin)/admin/panel/page.tsx` - Redirects /admin/panel to /admin/panel/users

## Decisions Made

- AdminSidebar is a single component rendering both desktop sidebar (hidden lg:flex) and mobile tab bar (lg:hidden) — avoids maintaining two separate nav components with the same data
- AdminTable empty state renders a div instead of a table with empty tbody — cleaner HTML, matches the spec's "no data" treatment
- `pageSizeOptions` prop defaults to `[10, 20, 50]` inline — backward-compatible, all existing recipe list usages unaffected

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Pre-existing TypeScript errors in test files (missing isLocked/coverImageUrl on mock recipe objects) were out of scope and not touched.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All admin UI primitives (AdminTable, AdminForm, OneTimeDisplay, AdminSidebar, AdminPanelLayout) are ready for import
- Plans 12-03 through 12-05 can implement CRUD sections without duplicating table/form/pagination logic
- Admin queryKeys namespace ready — each CRUD plan adds its own useQuery/useMutation hooks

---
*Phase: 12-frontend-admin-panel*
*Completed: 2026-03-19*
