---
phase: quick
plan: 260319-ut2
subsystem: ui
tags: [nextjs, tanstack-query, react, household]

requires:
  - phase: 11-frontend-profile-household-shared-recipe
    provides: Drawer with user name nav, AppShell chrome, query-keys pattern
provides:
  - Household name displayed in Drawer (real name from API instead of hardcoded Hogar)
  - Clickable household link navigating to /household
  - /household page listing all members with name and age
affects: [any future household feature expansion]

tech-stack:
  added: []
  patterns:
    - "Query key added to query-keys.ts: household.detail ['household']"
    - "Prop drilling from ProtectedLayout -> AppShell -> Drawer for household name"

key-files:
  created:
    - apps/web/src/app/(app)/household/page.tsx
  modified:
    - apps/web/src/lib/query-keys.ts
    - apps/web/src/app/(app)/layout.tsx
    - apps/web/src/components/layout/AppShell.tsx
    - apps/web/src/components/layout/Drawer.tsx
    - apps/web/src/components/__tests__/AppShell.test.tsx

key-decisions:
  - "Household data fetched in ProtectedLayout (not household page) so Drawer gets name without double-fetching — TanStack Query deduplicates via shared query key"
  - "householdName prop is string (not string|undefined) with empty string default while loading — avoids conditional type complexity in Drawer and AppShell"

requirements-completed: [quick-260319-ut2]

duration: 4min
completed: 2026-03-19
---

# Quick Task 260319-ut2: Household Navbar Link and Members View Summary

**Drawer now shows real household name from GET /api/household and navigates to a new /household page that lists all members with name and computed age.**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-19T22:33:16Z
- **Completed:** 2026-03-19T22:37:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- Household name fetched via useQuery in ProtectedLayout and plumbed through AppShell into Drawer via prop
- Hardcoded "Hogar" replaced with dynamic household name (falls back to "Hogar" while loading)
- Household button in Drawer wired to navigate to /household via handleNav
- New /household page renders household name heading + member list with avatar initials and computed age
- AppShell titleFromPathname extended with "Mi hogar" for /household route
- AppShell tests updated to pass new required householdName prop

## Task Commits

1. **Task 1: Plumb household name into Drawer and wire navigation** - `13b2bcb` (feat)
2. **Task 2: Create /household members list page** - `2d9e134` (feat)

## Files Created/Modified

- `apps/web/src/lib/query-keys.ts` - Added household.detail query key
- `apps/web/src/app/(app)/layout.tsx` - useQuery for household, pass householdName to AppShell
- `apps/web/src/components/layout/AppShell.tsx` - Added householdName prop, Mi hogar title case, forward to Drawer
- `apps/web/src/components/layout/Drawer.tsx` - Added householdName prop, dynamic display with Hogar fallback, onClick navigation
- `apps/web/src/app/(app)/household/page.tsx` - New read-only members list page with loading skeleton
- `apps/web/src/components/__tests__/AppShell.test.tsx` - Added householdName="" to all render calls

## Decisions Made

- Household data fetched in ProtectedLayout so Drawer receives name without an extra network request from the household page — TanStack Query deduplicates via the shared `queryKeys.household.detail` key.
- `householdName` is typed as `string` (not `string | undefined`) with empty string as the loading-state default, keeping Drawer and AppShell prop types simple.

## Deviations from Plan

**1. [Rule 2 - Missing Critical] Fixed AppShell.test.tsx for new required prop**
- **Found during:** Task 1 verification (TypeScript check)
- **Issue:** Adding householdName as required prop to AppShellProps caused 5 type errors in the existing test file
- **Fix:** Added `householdName=""` to all AppShell render calls in the test file
- **Files modified:** apps/web/src/components/__tests__/AppShell.test.tsx
- **Verification:** TypeScript passes without AppShell-related errors
- **Committed in:** 13b2bcb (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 2 - missing prop in tests)
**Impact on plan:** Required fix to keep TypeScript clean. No scope creep.

## Issues Encountered

Pre-existing TypeScript errors in test files (CookModePage, RecipeDetailPage, RecipeEditor, RecipeListPage) were out-of-scope and left untouched. These are unrelated to the household feature.

## Next Phase Readiness

- Drawer household navigation is live
- /household page is ready for future expansion (edit household, invite members, etc.)

---
*Phase: quick*
*Completed: 2026-03-19*
