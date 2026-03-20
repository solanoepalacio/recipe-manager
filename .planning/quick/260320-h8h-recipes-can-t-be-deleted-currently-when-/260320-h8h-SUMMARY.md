---
phase: quick-260320-h8h
plan: "01"
subsystem: frontend-recipe-detail
tags: [recipe, delete, dropdown, confirmation-dialog, mutation]
dependency_graph:
  requires: []
  provides: [recipe-delete-flow]
  affects: [recipe-detail-page, recipe-list-cache]
tech_stack:
  added: []
  patterns: [backdrop-z40-dropdown-z50, inline-confirm-dialog, useMutation-delete]
key_files:
  created: []
  modified:
    - apps/web/src/components/recipes/DetailTopBar.tsx
    - apps/web/src/app/(app)/recipes/[slug]/page.tsx
    - apps/web/src/components/__tests__/RecipeDetailPage.test.tsx
decisions:
  - "Dropdown only shown when onDelete prop is provided — backward-compatible ellipsis button"
  - "showDeleteConfirm state in page rather than DetailTopBar — keeps mutation logic colocated with data"
  - "backdrop div (z-40) + dropdown (z-50) pattern consistent with Phase 08-01 outside-click-to-close"
metrics:
  duration: "3 min"
  completed: "2026-03-20"
  tasks: 2
  files: 3
---

# Quick Task 260320-h8h: Recipe Delete Flow Summary

**One-liner:** Wired ellipsis dropdown with ConfirmDialog to DELETE /api/recipes/:id, invalidating list cache and navigating to /recipes on success.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add dropdown menu and delete callback to DetailTopBar | 488bf8f | DetailTopBar.tsx |
| 2 | Wire delete mutation in RecipeDetailPage and add test | 6553a0a | page.tsx, RecipeDetailPage.test.tsx |

## What Was Built

- **DetailTopBar.tsx:** Added `onDelete` and `isDeleting` optional props. Clicking the ellipsis button (when `onDelete` is provided) toggles a dropdown menu with an "Eliminar" option styled in `text-destructive`. A z-40 backdrop div closes the menu on outside click. Spinner replaces Trash2 icon when `isDeleting` is true.

- **page.tsx:** Added `deleteMutation` via `useMutation` calling `api.delete<{ id: string }>('/recipes/:id')`. On success: invalidates `queryKeys.recipes.all`, shows `toast.success('Receta eliminada')`, navigates to `/recipes`. On error: shows error toast. Added `showDeleteConfirm` state — `DetailTopBar.onDelete` sets it to true, which renders an inline `ConfirmDialog`. Confirming calls `deleteMutation.mutate()`; cancelling closes the dialog.

- **RecipeDetailPage.test.tsx:** Added "deletes recipe after confirmation" test. Mocks `api.delete`, clicks ellipsis, clicks Eliminar in dropdown, asserts ConfirmDialog appears, clicks confirm button, asserts `api.delete('/recipes/uuid-123')` was called. Updated `useMutation` mock to call `mutationFn()` when `mutate()` is invoked. Added `invalidateQueries` to `useQueryClient` mock.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- [x] DetailTopBar.tsx exists with dropdown and onDelete prop
- [x] page.tsx has deleteMutation and ConfirmDialog render
- [x] RecipeDetailPage.test.tsx has 6 passing tests (5 existing + 1 new delete test)
- [x] Commits 488bf8f and 6553a0a exist
