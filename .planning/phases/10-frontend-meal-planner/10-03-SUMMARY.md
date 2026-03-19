---
phase: 10-frontend-meal-planner
plan: "03"
subsystem: frontend/planner
tags: [dnd-kit, drag-and-drop, bottom-sheet, optimistic-update, meal-planner]
dependency_graph:
  requires: ["10-01", "10-02"]
  provides: ["drag-and-drop-planner", "edit-entry-sheet", "phase-10-complete"]
  affects: ["apps/web/src/app/(app)/planner/page.tsx", "apps/web/src/components/planner/"]
tech_stack:
  added: []
  patterns:
    - "useDraggable/useDroppable from @dnd-kit/core for cross-day drag"
    - "DndContext at page level with PointerSensor (distance: 8 activation)"
    - "Optimistic PATCH with snapshot rollback pattern"
    - "Bottom sheet with ConfirmDialog for destructive inline actions"
key_files:
  created:
    - apps/web/src/components/planner/EditEntrySheet.tsx
  modified:
    - apps/web/src/components/planner/MealEntryRow.tsx
    - apps/web/src/components/planner/DayAccordion.tsx
    - apps/web/src/app/(app)/planner/page.tsx
    - apps/web/src/components/__tests__/PlannerPage.test.tsx
decisions:
  - "DndContext placed inside the loading branch (not wrapping WeekToggle or WeekNav) — drag context only active when entries are loaded"
  - "Both week and month view DayAccordion lists wrapped in separate DndContext instances — reuses same sensors and handleDragEnd"
  - "Grip handle uses touch-none on the row outer div to prevent scroll interference during drag on mobile"
metrics:
  duration: "2 min"
  completed: "2026-03-19"
  tasks_completed: 2
  files_modified: 5
---

# Phase 10 Plan 03: Drag-and-Drop and Edit Entry Sheet Summary

**One-liner:** Cross-day drag-and-drop via @dnd-kit with optimistic PATCH and EditEntrySheet for meal type changes and confirmation-gated deletion.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add drag-and-drop to MealEntryRow/DayAccordion, create EditEntrySheet | 8d20721 | MealEntryRow.tsx, DayAccordion.tsx, EditEntrySheet.tsx |
| 2 | Wire DndContext and EditEntrySheet into PlannerPage, add tests | 1c12520 | page.tsx, PlannerPage.test.tsx |

## What Was Built

### MealEntryRow (updated)
- Added `useDraggable` with `data: { entry }` for drag data propagation
- `CSS.Translate.toString(transform)` applied as inline style for smooth movement
- `GripVertical` icon (16px, text-secondary) added as leftmost element with drag handle listeners
- `isDragging` state adds `z-50 shadow-md` and 0.9 opacity on the dragging element

### DayAccordion (updated)
- Added `useDroppable` with `id: day-${date}` for drop target identification
- Both collapsed and expanded states receive `setDroppableRef` — enables dropping on collapsed days
- `isOver` highlight: `bg-accent/5` on outer wrapper, `border-l-2 border-accent` on expanded panel container

### EditEntrySheet (new)
- Bottom sheet for editing a meal plan entry's meal type
- Displays current recipe name (read-only)
- `MealTypeChips` for selecting new meal type
- "Guardar cambios" button fires PATCH with changed fields only (no-op close if no changes)
- "Eliminar entrada" link triggers inline `ConfirmDialog` with "Mantener entrada" cancel label
- State resets on entry change via `useEffect`

### PlannerPage (updated)
- `DndContext` with `PointerSensor` (distance: 8px activation constraint) wraps day accordions in both week and month views
- `patchEntryMutation` implements optimistic update: cancelQueries → setQueryData → onError rollback → onSettled invalidate
- `handleDragEnd` extracts destination date from `over.id.replace('day-', '')`, guards same-day no-op
- `editEntry` state (`MealPlanEntryResponse | null`) controls `EditEntrySheet` open/close
- All `onEditEntry` callbacks now wire to `setEditEntry(entry)` in both view modes
- Error toast "No se pudo mover la receta" on drag PATCH failure

### Tests (updated)
- Added 4 new tests covering PLAN-03 and PLAN-04:
  - Grip handle containers present in DOM
  - Edit sheet opens on recipe name click
  - Edit sheet shows "Guardar cambios" and "Eliminar entrada"
  - Delete confirmation shows "¿Eliminar esta entrada del planificador?" and "Mantener entrada"
- Total test suite: 72 tests (was 68)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] `apps/web/src/components/planner/EditEntrySheet.tsx` — created
- [x] `apps/web/src/components/planner/MealEntryRow.tsx` — contains `useDraggable`, `GripVertical`, `CSS.Translate.toString`
- [x] `apps/web/src/components/planner/DayAccordion.tsx` — contains `useDroppable`, `day-${date}`, `isOver`
- [x] `apps/web/src/app/(app)/planner/page.tsx` — contains `DndContext`, `patchEntryMutation`, `handleDragEnd`, `EditEntrySheet`
- [x] All 72 tests pass
- [x] Commits 8d20721, 1c12520 exist

## Self-Check: PASSED
