---
phase: 09-frontend-recipe-creation-editing
plan: "02"
subsystem: frontend
tags: [ingredient-editor, dnd-kit, food-picker, sections, drag-and-drop]
dependency_graph:
  requires: [Phase 09-01 (edit mode + EditorTabs), api-client, query-keys, shared types, @dnd-kit packages]
  provides: [IngredientPicker, IngredientRow, IngredientSectionEditor, units query key, api.put method]
  affects: [apps/web/src/app/(app)/recipes/[slug]/page.tsx]
tech_stack:
  added: []
  patterns: [DndContext + SortableContext for drag-and-drop, useSortable per row, useMutation per operation, full-screen picker modal with body scroll lock]
key_files:
  created:
    - apps/web/src/components/recipes/editor/IngredientPicker.tsx
    - apps/web/src/components/recipes/editor/IngredientRow.tsx
    - apps/web/src/components/recipes/editor/IngredientSectionEditor.tsx
    - apps/web/src/components/__tests__/IngredientEditor.test.tsx
  modified:
    - apps/web/src/lib/query-keys.ts
    - apps/web/src/lib/api-client.ts
    - apps/web/src/app/(app)/recipes/[slug]/page.tsx
decisions:
  - api.put added to api-client for reorder endpoint (PUT /api/recipes/:id/sections/:sid/ingredients/reorder)
  - units query key added to query-keys.ts alongside existing foods key
  - IngredientSectionEditor wraps each section in its own DndContext — isolated drag contexts per section
  - reorderIngredientsMutation.isPending disables drag handles via pointer-events-none opacity-50 wrapper div
  - Empty state (no sections) renders immediately with add-section button below message
metrics:
  duration: "2 min"
  completed_date: "2026-03-18"
  tasks_completed: 2
  files_changed: 7
---

# Phase 09 Plan 02: Ingredient Section Editor Summary

Sectioned ingredient editor with @dnd-kit drag-and-drop reorder, full-screen food picker with debounced search + unit/qty/note inputs, and section management (add/rename/delete) wired into the Ingredientes tab of the detail page edit mode.

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Create IngredientPicker, IngredientRow, IngredientSectionEditor, tests | 2384762 | IngredientPicker.tsx, IngredientRow.tsx, IngredientSectionEditor.tsx, IngredientEditor.test.tsx |
| 2 | Wire IngredientSectionEditor into detail page Ingredientes tab | b224775 | [slug]/page.tsx |

## Decisions Made

1. **api.put added to api-client**: The reorder endpoints use HTTP PUT (not PATCH). The existing api-client only had get/post/patch/delete — added put method to support `PUT /api/recipes/:id/sections/:sid/ingredients/reorder`.

2. **Per-section DndContext**: Each section gets its own `DndContext` + `SortableContext` instance. This isolates drag operations to within a section (no cross-section dragging, which the backend doesn't support in this plan).

3. **Drag handle disable pattern**: While `reorderIngredientsMutation.isPending`, the parent div around `IngredientRow` gets `pointer-events-none opacity-50` class — simpler than passing isPending into each row.

4. **Empty state shows add-section button**: When `sections.length === 0`, the component renders the "Sin ingredientes aún" empty state message alongside an "+ Añadir sección" button so the user can start building the recipe.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] api.put missing from api-client**
- **Found during:** Task 1 implementation
- **Issue:** `IngredientSectionEditor` uses `api.put` for the reorder mutation, but `apps/web/src/lib/api-client.ts` only exported get/post/patch/delete. TypeScript would fail at compile time.
- **Fix:** Added `put: <T>(path: string, body: unknown) => request<T>('PUT', path, body)` to the api object in api-client.ts.
- **Files modified:** `apps/web/src/lib/api-client.ts`
- **Commit:** 2384762

## Self-Check: PASSED

All created files found on disk. Both task commits (2384762, b224775) verified in git log.
