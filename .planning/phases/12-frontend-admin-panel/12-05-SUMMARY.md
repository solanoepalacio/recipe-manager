---
phase: 12-frontend-admin-panel
plan: 05
subsystem: ui
tags: [react, tanstack-query, admin, api-tokens]

# Dependency graph
requires:
  - phase: 12-02
    provides: AdminTable, AdminForm, OneTimeDisplay, ConfirmDialog, PaginationControls, admin-api-client, query-keys

provides:
  - Admin API tokens management page at /admin/tokens
  - Token list with name, user, creation date, last used
  - Create token flow with raw token displayed exactly once via OneTimeDisplay
  - Revoke token with ConfirmDialog confirmation
  - Raw token stored in local useState only — never in TanStack Query cache

affects: [any future admin sections needing one-time secret display pattern]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Raw secret one-time display: useState<string | null>(null) stores raw token locally; onSuccess sets it; onDismiss clears it; never passed to setQueryData
    - Create-or-revoke-only pattern: tokens have no edit — only create and revoke actions

key-files:
  created:
    - apps/web/src/app/(admin)/admin/panel/tokens/page.tsx
    - apps/web/tests/admin/tokens-section.test.tsx
  modified: []

key-decisions:
  - "[12-05] Raw token (data.token from AdminTokenCreatedResponse) stored only in createdToken useState — never in query cache; cleared on dismiss"
  - "[12-05] Users query enabled:showForm so dropdown only loads when form opens"
  - "[12-05] waitFor select options to contain user ID before fireEvent.change in tests — ensures users query has resolved and option is in DOM"

patterns-established:
  - "One-time secret display: useState<string|null> + OneTimeDisplay + onDismiss clears state"

requirements-completed: [ADM-05, ADM-06]

# Metrics
duration: 4min
completed: 2026-03-19
---

# Phase 12 Plan 05: API Tokens Management Summary

**Admin tokens page with create-show-once raw token via OneTimeDisplay and revoke with ConfirmDialog, raw token never cached in TanStack Query state**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-19T16:11:23Z
- **Completed:** 2026-03-19T16:14:43Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- Tokens list page with name, resolved user name, creation date, last-used columns
- Create token form with user dropdown loaded from /admin/users; raw token shown via OneTimeDisplay after create success
- Raw token stored only in `createdToken` useState — no TanStack Query cache involvement
- Dismiss clears `createdToken` state permanently; raw token never visible again
- Revoke action with ConfirmDialog (confirmLabel="Revocar")
- 7 tests pass covering heading, row rendering, create form, OneTimeDisplay show/dismiss, ConfirmDialog, delete mutation

## Task Commits

1. **Task 1: Tokens management section with one-time display** - `e7e8353` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `apps/web/src/app/(admin)/admin/panel/tokens/page.tsx` - Tokens admin page with full CRUD (create/list/revoke)
- `apps/web/tests/admin/tokens-section.test.tsx` - 7 tests for all required behaviors

## Decisions Made
- Raw token from `AdminTokenCreatedResponse.token` stored only in `createdToken` useState; onSuccess sets it, onDismiss clears it; `setQueryData` with token field never called
- `enabled: showForm` on users query prevents unnecessary fetches when form is closed
- Test uses `waitFor` to confirm user option is in select DOM before `fireEvent.change` — necessary because users query resolves asynchronously even with mock

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test select change failing because users option not in DOM yet**
- **Found during:** Task 1 (tests)
- **Issue:** `fireEvent.change(select, { target: { value: 'u1' } })` fired before users mock resolved, so `formUserId` stayed empty on submit
- **Fix:** Added `waitFor` checking `select.options` contains `'u1'` before firing change event
- **Files modified:** apps/web/tests/admin/tokens-section.test.tsx
- **Verification:** All 127 tests pass
- **Committed in:** e7e8353 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug)
**Impact on plan:** Required for test correctness. No scope creep.

## Issues Encountered
- `getByRole('button', { name: /Crear token/i })` matched both the header button and the form submit button. Fixed by using `Cancelar` button to navigate to the form element and calling `fireEvent.submit(form)`.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 5 plans for Phase 12 (frontend-admin-panel) are now complete
- Admin panel has: layout/shell, sidebar/nav, users, households, foods, units, tokens sections
- Ready for final integration testing or next phase

---
*Phase: 12-frontend-admin-panel*
*Completed: 2026-03-19*
