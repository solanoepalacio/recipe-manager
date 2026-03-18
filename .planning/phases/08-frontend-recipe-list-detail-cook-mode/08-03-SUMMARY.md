---
phase: 08-frontend-recipe-list-detail-cook-mode
plan: 03
subsystem: ui
tags: [react, nextjs, tanstack-query, tailwind, lucide-react]

# Dependency graph
requires:
  - phase: 08-02
    provides: Recipe detail page and CookStep/useQuery patterns established

provides:
  - CookStep component with done/current/pending variants
  - Full-screen cook mode page at /recipes/[slug]/cook?id=:id
  - Step state machine (done/current/pending) with check-off navigation
  - Completion state with Listo! heading and Volver a la receta action

affects:
  - 09-frontend-meal-plan
  - any future phase touching recipe cook experience

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "fixed inset-0 z-[100] overlay pattern for full-screen pages covering AppShell"
    - "useState(0) currentStep index as step state machine driver"
    - "slice(0, currentStep) for done steps / slice(currentStep) for current+pending"

key-files:
  created:
    - apps/web/src/components/recipes/CookStep.tsx
    - apps/web/src/app/(app)/recipes/[slug]/cook/page.tsx
    - apps/web/src/components/__tests__/CookModePage.test.tsx
  modified: []

key-decisions:
  - "CookStep onKeyDown handler added for accessibility (Enter/Space) — not in spec but required for keyboard navigation correctness"

patterns-established:
  - "CookStep: three-variant component driven by status prop (done/current/pending) — use same pattern for other step-like UI"
  - "Full-screen overlay: fixed inset-0 z-[100] to cover AppShell; flex-col layout for top bar + scrollable content"

requirements-completed:
  - RCP-08

# Metrics
duration: 2min
completed: 2026-03-18
---

# Phase 08 Plan 03: Cook Mode Page Summary

**Full-screen cook mode overlay with CookStep component (done/current/pending), step check-off state machine, completion state, and exit button via router.back()**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-18T18:53:15Z
- **Completed:** 2026-03-18T18:55:30Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- CookStep component with 3 visual variants: collapsed done (52px, check circle, truncated), active current (left border, large text, clickable), inactive pending (large text, no interaction)
- Cook mode page as fixed full-screen overlay (inset-0 z-[100]) covering AppShell with step state machine driven by currentStep index
- TDD: RED (test scaffold + CookStep) committed before GREEN (page implementation) — all 6 CookModePage tests pass, 29 total tests pass, build clean

## Task Commits

Each task was committed atomically:

1. **Task 1: CookStep component + Wave 0 test scaffold** - `1441006` (test)
2. **Task 2: Cook mode page — full-screen overlay with step state machine** - `8946014` (feat)

**Plan metadata:** (pending docs commit)

_Note: TDD tasks have separate test (RED) and feat (GREEN) commits_

## Files Created/Modified

- `apps/web/src/components/recipes/CookStep.tsx` - Three-variant step row component (done/current/pending) with Lucide Check icon, aria-label for accessibility
- `apps/web/src/app/(app)/recipes/[slug]/cook/page.tsx` - Full-screen cook mode page: overlay, top bar with x Salir, step list with state machine, completion state, loading skeletons, error state
- `apps/web/src/components/__tests__/CookModePage.test.tsx` - 6 tests covering: name render, exit button, step text render, step 1 current, step advancement, done step text retention

## Decisions Made

- Added `onKeyDown` handler to CookStep current variant for keyboard accessibility (Enter/Space keys trigger onDone). Not explicitly in spec but required for correct keyboard navigation — Rule 2 (missing critical functionality).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added keyboard accessibility to CookStep current variant**
- **Found during:** Task 1 (CookStep component creation)
- **Issue:** Plan spec showed only onClick for current step — omitting keyboard handler means the component fails WCAG 2.1 keyboard accessibility
- **Fix:** Added `onKeyDown` that fires `onDone` on Enter or Space keypress
- **Files modified:** apps/web/src/components/recipes/CookStep.tsx
- **Verification:** Component renders with role="button" and tabIndex={0}; keyboard handler present
- **Committed in:** 1441006 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Essential accessibility fix. No scope creep.

## Issues Encountered

None — plan executed cleanly with all tests passing and TypeScript build succeeding.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Cook mode (RCP-08) complete — users can enter cook mode from recipe detail page
- CookStep pattern established for reuse in any future step-oriented UI
- All Phase 08 plans (01 recipe list, 02 recipe detail, 03 cook mode) now complete
- Ready for Phase 09 (frontend meal planner)

---
*Phase: 08-frontend-recipe-list-detail-cook-mode*
*Completed: 2026-03-18*

## Self-Check: PASSED

All created files exist on disk. All task commits verified in git history.
