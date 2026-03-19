---
phase: 12-frontend-admin-panel
plan: "03"
subsystem: ui
tags: [react, nextjs, tailwind, admin, tanstack-query, crud]

requires:
  - phase: 12-02
    provides: AdminTable, AdminForm, OneTimeDisplay, adminApi, queryKeys.admin, PaginationControls pageSizeOptions

provides:
  - Users admin CRUD page at /admin/panel/users (paginated list, create/edit/delete, password reset URL)
  - Households admin CRUD page at /admin/panel/households (paginated list, create/edit/delete with cascade warning)

affects:
  - 12-04 (Foods/Units CRUD sections follow same patterns established here)
  - 12-05 (Tokens CRUD section follows same patterns)

tech-stack:
  added: []
  patterns:
    - PaginatedResponse uses items (not data) and totalPages computed as Math.ceil(total/perPage)
    - ConfirmDialog inline per-row for delete — deletingId state pattern
    - Single-row mock in delete mutation test to avoid multi-row Eliminar button ambiguity
    - vi.mocked() + mockResolvedValue in beforeEach pattern for TanStack Query mutation tests

key-files:
  created:
    - apps/web/src/app/(admin)/admin/panel/users/page.tsx
    - apps/web/src/app/(admin)/admin/panel/households/page.tsx
    - apps/web/tests/admin/users-section.test.tsx
    - apps/web/tests/admin/households-section.test.tsx

key-decisions:
  - "PaginatedResponse uses items[] not data[] (plan spec said data but shared type uses items) — plan spec was wrong, fixed to match shared type"
  - "totalPages computed as Math.ceil(total/perPage) locally — PaginatedResponse has no totalPages field"
  - "Delete mutation test uses single-row mock to avoid ConfirmDialog Eliminar button being overshadowed by second row's Eliminar"
  - "Households dropdown query in users form uses enabled: showForm && editingUser === null to avoid unnecessary requests"

requirements-completed: [ADM-01, ADM-02]

duration: 6min
completed: 2026-03-19
---

# Phase 12 Plan 03: Users and Households Admin Sections Summary

**Users and Households CRUD admin pages with paginated AdminTable, inline ConfirmDialog delete confirmations, OneTimeDisplay for password reset URLs, and cascade-delete warning for household deletion**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-19T18:59:26Z
- **Completed:** 2026-03-19T19:05:22Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Users management page: paginated list with create (name/email/password/household dropdown), edit (name/email/username), delete with inline ConfirmDialog, and password reset URL via OneTimeDisplay
- Households management page: paginated list with create/edit (name field), delete with cascade warning ("Se eliminaran todas sus recetas y planes")
- Both pages use AdminTable with column config, AdminForm wrapper, PaginationControls with pageSizeOptions [10, 25, 50]
- 9 passing unit tests across both sections (5 for users, 4 for households)

## Task Commits

1. **Task 1: Users management section with password reset** - `365337a` (feat)
2. **Task 2: Households management section** - `1254e2f` (feat)

## Files Created/Modified

- `apps/web/src/app/(admin)/admin/panel/users/page.tsx` - Users CRUD with paginated table, create/edit/delete forms, password reset URL, OneTimeDisplay
- `apps/web/src/app/(admin)/admin/panel/households/page.tsx` - Households CRUD with paginated table, create/edit/delete with cascade warning
- `apps/web/tests/admin/users-section.test.tsx` - 5 unit tests: heading, rows, create form, ConfirmDialog, delete mutation
- `apps/web/tests/admin/households-section.test.tsx` - 4 unit tests: heading, rows+member-count, cascade warning, create form

## Decisions Made

- `PaginatedResponse<T>` uses `items` not `data` (plan spec said `data` but shared type uses `items`) — fixed to match actual shared type
- `totalPages` computed locally as `Math.ceil(data.total / data.perPage)` because `PaginatedResponse` has no `totalPages` field
- Delete mutation test uses single-row mock to avoid ambiguity when clicking "Eliminar" confirm button (multi-row case has Eliminar buttons in between rows and ConfirmDialog)
- Households dropdown in users create form uses `enabled: showForm && editingUser === null` — avoids unnecessary API calls when editing

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] PaginatedResponse uses `items` not `data`**
- **Found during:** Task 1 (TypeScript check)
- **Issue:** Plan spec referenced `data.data` and `data.totalPages` but `PaginatedResponse<T>` in packages/shared/src/common.ts uses `items: T[]` (not `data`) and has no `totalPages` field
- **Fix:** Changed to `data?.items ?? []` and computed `totalPages = Math.ceil(data.total / data.perPage)` consistent with how recipes/page.tsx handles pagination
- **Files modified:** apps/web/src/app/(admin)/admin/panel/users/page.tsx, test files

## Self-Check: PASSED

Files exist:
- FOUND: apps/web/src/app/(admin)/admin/panel/users/page.tsx
- FOUND: apps/web/src/app/(admin)/admin/panel/households/page.tsx
- FOUND: apps/web/tests/admin/users-section.test.tsx
- FOUND: apps/web/tests/admin/households-section.test.tsx

Commits exist:
- FOUND: 365337a (Task 1 - users section)
- FOUND: 1254e2f (Task 2 - households section)

---
*Phase: 12-frontend-admin-panel*
*Completed: 2026-03-19*
