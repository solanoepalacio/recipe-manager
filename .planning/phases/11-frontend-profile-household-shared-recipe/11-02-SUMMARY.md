---
phase: 11-frontend-profile-household-shared-recipe
plan: "02"
subsystem: ui
tags: [react, tanstack-query, vitest, share, bottom-sheet, clipboard]

# Dependency graph
requires:
  - phase: 08-frontend-recipe-list-detail-cook-mode
    provides: RecipeDetailPage with inert Compartir button
  - phase: 05-backend-search-sharing-meal-plan
    provides: POST /api/recipes/:id/share endpoint returning shareToken
provides:
  - Compartir button wired to share mutation on recipe detail page
  - BottomSheet with shareable URL and one-tap clipboard copy
  - ShareLinkFlow unit tests (5 tests)
affects: [phase-12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - useMutation firing POST to API, storing token in state, opening BottomSheet on success
    - handleCopy using navigator.clipboard.writeText with 2-second Copiado feedback
    - ShareLinkFlow tests use real QueryClientProvider + mocked api-client (not full tanstack mock)

key-files:
  created:
    - apps/web/src/components/__tests__/ShareLinkFlow.test.tsx
  modified:
    - apps/web/src/app/(app)/recipes/[slug]/page.tsx

key-decisions:
  - "ShareLinkFlow tests use real QueryClientProvider (not vi.mock tanstack-react-query) so mutation callbacks (onSuccess/onError) actually execute — needed to test share flow state transitions"
  - "BottomSheet rendered unconditionally (isOpen=false by default) not conditionally — consistent with BottomSheet API which returns null when closed"

patterns-established:
  - "Share flow pattern: mutate() -> onSuccess sets token + opens sheet -> handleCopy writes URL to clipboard"
  - "Test pattern for mutation side effects: real QueryClientProvider + mocked api.post resolving/rejecting"

requirements-completed: [SHR-01]

# Metrics
duration: 2min
completed: 2026-03-19
---

# Phase 11 Plan 02: Share Link Flow Summary

**Compartir button on recipe detail wired to POST /recipes/:id/share with BottomSheet showing shareable URL and one-tap clipboard copy**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-19T00:16:43Z
- **Completed:** 2026-03-19T00:18:51Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Compartir button now fires POST /api/recipes/:id/share and shows loading spinner while pending
- BottomSheet opens on success with full shareable URL (origin + /shared/:token)
- Copiar enlace button copies URL to clipboard with 2-second "Copiado" feedback
- Error toast shown when share generation fails
- 5 ShareLinkFlow unit tests covering all scenarios pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire Compartir button to share mutation + BottomSheet** - `2cdc9d9` (feat)
2. **Task 2: ShareLinkFlow unit tests** - `06975d9` (test)

## Files Created/Modified
- `apps/web/src/app/(app)/recipes/[slug]/page.tsx` - Added shareMutation, handleCopy, shareSheetOpen/shareToken/copied state, wired Compartir button, added BottomSheet JSX
- `apps/web/src/components/__tests__/ShareLinkFlow.test.tsx` - 5 unit tests for share link flow

## Decisions Made
- ShareLinkFlow tests use real QueryClientProvider (not fully mocked @tanstack/react-query) because mutation onSuccess/onError callbacks need to actually execute to test state transitions
- BottomSheet placed outside the conditional view/edit blocks so it can open from any mode

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Share link flow complete and tested
- SHR-01 satisfied: user can generate and copy a shareable public link for any recipe
- Ready for phase 12

---
*Phase: 11-frontend-profile-household-shared-recipe*
*Completed: 2026-03-19*
