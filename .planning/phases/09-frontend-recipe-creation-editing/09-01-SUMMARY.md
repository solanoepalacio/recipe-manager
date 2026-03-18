---
phase: 09-frontend-recipe-creation-editing
plan: "01"
subsystem: frontend
tags: [recipe-editor, bottom-sheet, fab, edit-mode, metadata-form]
dependency_graph:
  requires: [Phase 08 detail page, api-client, query-keys, shared types]
  provides: [BottomSheet primitive, RecipeNamePrompt, EditorTabs, MetadataForm, FAB on list page, edit mode on detail page, Guardar pill]
  affects: [apps/web/src/app/(app)/recipes/page.tsx, apps/web/src/app/(app)/recipes/[slug]/page.tsx]
tech_stack:
  added: ["@dnd-kit/core@^6.3.1", "@dnd-kit/sortable@^9.0.0", "@dnd-kit/utilities@^3.2.2"]
  patterns: [forwardRef + useImperativeHandle for getValues, useMutation + useQueryClient for PATCH, bottom sheet with scrim + scroll lock + Escape close]
key_files:
  created:
    - apps/web/src/components/ui/BottomSheet.tsx
    - apps/web/src/components/recipes/editor/RecipeNamePrompt.tsx
    - apps/web/src/components/recipes/editor/EditorTabs.tsx
    - apps/web/src/components/recipes/editor/MetadataForm.tsx
    - apps/web/src/components/__tests__/RecipeEditor.test.tsx
  modified:
    - apps/web/src/app/(app)/recipes/page.tsx
    - apps/web/src/app/(app)/recipes/[slug]/page.tsx
    - apps/web/src/components/__tests__/RecipeDetailPage.test.tsx
    - apps/web/package.json
    - yarn.lock
decisions:
  - MetadataForm uses forwardRef + useImperativeHandle to expose getValues() — parent page reads values on Guardar press without prop drilling
  - Guardar pill only visible on Basico tab (metadata-only save); sub-resource mutations fire immediately (plans 09-02/03)
  - isEditMode is local React state; ?edit=1 in searchParams triggers entry on mount only
  - RecipeDetailPage test updated to include useMutation and useQueryClient in @tanstack/react-query mock
metrics:
  duration: "3 min"
  completed_date: "2026-03-18"
  tasks_completed: 2
  files_changed: 9
---

# Phase 09 Plan 01: Recipe Creation Entry Point + Edit Mode Foundation Summary

FAB on recipe list opens name prompt bottom sheet that POSTs to /api/recipes; detail page gains a functional edit mode toggle with tabbed editor (Ingredientes/Instrucciones/Basico/Fotos/Ajustes), MetadataForm on Basico tab, and Guardar pill that PATCHes /api/recipes/:id.

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Install @dnd-kit, create BottomSheet, RecipeNamePrompt, EditorTabs, MetadataForm | e42d9ef | BottomSheet.tsx, RecipeNamePrompt.tsx, EditorTabs.tsx, MetadataForm.tsx, RecipeEditor.test.tsx |
| 2 | Wire FAB into list page, add edit mode + tabs + Guardar pill to detail page | 4161ae3 | recipes/page.tsx, [slug]/page.tsx |

## Decisions Made

1. **MetadataForm ref pattern**: `forwardRef` + `useImperativeHandle` exposing `getValues(): UpdateRecipeRequest` — parent reads values imperatively on Guardar press, avoids lifting all field state to parent.

2. **Edit mode as local state**: `isEditMode` lives in the detail page component; `?edit=1` in the URL only triggers entry on mount (single `useEffect` with empty dependency array). URL is not kept in sync — keeps routing simple.

3. **Guardar pill scope**: Only shown on the Basico tab. Sub-resource tabs (Ingredientes, Instrucciones, Fotos) fire mutations immediately — no batch save needed per UI spec.

4. **@dnd-kit pre-installed**: All three packages (`core`, `sortable`, `utilities`) installed in wave 1 so plans 09-02 and 09-03 can use them without a separate install step.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] RecipeDetailPage test missing useMutation/useQueryClient mock exports**
- **Found during:** Task 2 verification
- **Issue:** The existing `RecipeDetailPage.test.tsx` partially mocked `@tanstack/react-query` with only `useQuery`. After adding `useMutation` and `useQueryClient` to the detail page, the test threw "No useQueryClient export is defined on the mock".
- **Fix:** Added `useMutation` and `useQueryClient` to the `vi.mock('@tanstack/react-query')` factory. Also added `sonner` and `@/lib/api-client` mocks which the updated page now imports.
- **Files modified:** `apps/web/src/components/__tests__/RecipeDetailPage.test.tsx`
- **Commit:** 4161ae3

## Self-Check: PASSED

All created files found on disk. Both task commits verified in git log.
