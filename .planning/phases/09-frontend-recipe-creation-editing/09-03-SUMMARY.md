---
phase: 09-frontend-recipe-creation-editing
plan: 03
subsystem: ui
tags: [react, nextjs, dnd-kit, tanstack-query, vitest]

# Dependency graph
requires:
  - phase: 09-frontend-recipe-creation-editing
    provides: dnd-kit installed, recipe detail page with tab editor, IngredientRow/IngredientSectionEditor patterns

provides:
  - StepRow component with drag handle, step number badge, title input, body textarea, delete button
  - StepEditor component with DndContext reorder, add step form, empty state
  - Instrucciones tab in recipe detail page wired to real editor (replaces placeholder)
  - StepEditor.test.tsx with 5 test cases

affects: [09-04, 09-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useSortable with setNodeRef/transform/transition for draggable rows"
    - "onBlur-based update mutations for text inputs (fires patch without save button)"
    - "Toggle showAddForm state to reveal inline add form"

key-files:
  created:
    - apps/web/src/components/recipes/editor/StepRow.tsx
    - apps/web/src/components/recipes/editor/StepEditor.tsx
    - apps/web/src/components/__tests__/StepEditor.test.tsx
  modified:
    - apps/web/src/app/(app)/recipes/[slug]/page.tsx

key-decisions:
  - "StepEditor uses single DndContext wrapping all steps (unlike IngredientSectionEditor which uses per-section DndContext) — steps are flat, no nesting"
  - "showAddForm toggle state controls visibility of add step inline form — consistent with add-section pattern in IngredientSectionEditor"
  - "onBlur triggers update mutation for both title and body fields — no save button per step, mutations fire on focus loss"

patterns-established:
  - "StepRow: index prop for badge display, step.id for sortable key — sequential numbering from parent list order"
  - "Empty state shown only when steps.length === 0 and add form is hidden"

requirements-completed: [INS-01, INS-02]

# Metrics
duration: 5min
completed: 2026-03-18
---

# Phase 09 Plan 03: Step Editor Summary

**Drag-and-drop instruction step editor using dnd-kit with add/update/delete/reorder mutations wired into Instrucciones tab**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-18T18:17:22Z
- **Completed:** 2026-03-18T18:22:00Z
- **Tasks:** 1
- **Files modified:** 4

## Accomplishments
- StepRow with useSortable, step number badge (rounded-full bg-foreground), title input, body textarea, drag handle, delete button
- StepEditor wrapping steps in DndContext for drag-and-drop reorder via PUT /api/recipes/:id/steps/reorder
- Instrucciones tab in recipe detail page now renders real StepEditor (placeholder removed)
- 5 test cases covering StepRow render/delete and StepEditor empty state/add button/sequential numbers — all 46 tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Create StepRow, StepEditor components, tests, and wire into detail page** - `9cab091` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `apps/web/src/components/recipes/editor/StepRow.tsx` - Draggable step row with number badge, title input, body textarea, delete
- `apps/web/src/components/recipes/editor/StepEditor.tsx` - Step list with DndContext, reorder mutation, add step inline form, empty state
- `apps/web/src/app/(app)/recipes/[slug]/page.tsx` - Instrucciones tab wired to StepEditor
- `apps/web/src/components/__tests__/StepEditor.test.tsx` - 5 test cases for StepRow and StepEditor

## Decisions Made
- StepEditor uses a single flat DndContext for all steps (steps are not nested into sections like ingredients are)
- showAddForm toggle state controls the add step inline form visibility
- onBlur update mutation fires for both title and body — no per-step save button needed

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Step editor complete; ready for Plan 09-04 (photo management tab)
- All editor tabs now have real editors: Ingredientes (09-02), Instrucciones (09-03), Basico (09-01)

---
*Phase: 09-frontend-recipe-creation-editing*
*Completed: 2026-03-18*

## Self-Check: PASSED
- StepRow.tsx: FOUND
- StepEditor.tsx: FOUND
- StepEditor.test.tsx: FOUND
- 09-03-SUMMARY.md: FOUND
- Commit 9cab091: FOUND
