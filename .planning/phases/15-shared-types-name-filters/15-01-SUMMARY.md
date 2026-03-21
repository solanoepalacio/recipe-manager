---
phase: 15-shared-types-name-filters
plan: 01
subsystem: api
tags: [typescript, shared-types, nestjs, validation, class-validator]

# Dependency graph
requires:
  - phase: 14-write-ops-meal-plan
    provides: recipes.ts type file and existing shared package structure
provides:
  - FoodItem and UnitItem interfaces for foods/units list endpoints
  - BatchCreateIngredientsRequest for Phase 17 batch ingredient add
  - CreateRecipeRequest extended with optional ingredients[] and steps[] for Phase 18 compound create
  - ValidationPipe with transform: true enabling @ValidateNested in Phase 18
affects:
  - 15-02
  - 16-slug-lookup
  - 17-batch-ingredient-add
  - 18-compound-create

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Inline array shapes in request interfaces for compound create (avoids re-export of nested types)"
    - "transform: true on ValidationPipe required for @ValidateNested class instantiation from plain objects"

key-files:
  created:
    - packages/shared/src/api/foods-units.ts
  modified:
    - packages/shared/src/api/recipes.ts
    - packages/shared/src/index.ts
    - apps/api/src/main.ts

key-decisions:
  - "Inline ingredient/step array shapes in CreateRecipeRequest (not referencing CreateIngredientRequest/CreateStepRequest) to keep compound create interface self-contained"
  - "transform: true added to ValidationPipe now rather than in Phase 18 to avoid mid-phase main.ts edits"

patterns-established:
  - "foods-units.ts barrel export pattern: new domain types get their own file under packages/shared/src/api/"

requirements-completed:
  - ERGO-01
  - ERGO-02

# Metrics
duration: 1min
completed: 2026-03-21
---

# Phase 15 Plan 01: Shared Types + ValidationPipe Summary

**FoodItem, UnitItem, BatchCreateIngredientsRequest types added to shared package; CreateRecipeRequest extended with optional ingredients[]/steps[]; ValidationPipe gains transform:true for nested class instantiation**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-21T10:51:42Z
- **Completed:** 2026-03-21T10:52:38Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `packages/shared/src/api/foods-units.ts` exporting FoodItem, UnitItem, and BatchCreateIngredientsRequest
- Extended CreateRecipeRequest with optional `ingredients?` and `steps?` arrays using inline shapes
- Enabled `transform: true` on the global ValidationPipe in main.ts so Phase 18 @ValidateNested works correctly

## Task Commits

Each task was committed atomically:

1. **Task 1: Create foods-units.ts types and extend CreateRecipeRequest** - `6c7589a` (feat)
2. **Task 2: Fix ValidationPipe transform: true in main.ts** - `fe7e80b` (fix)

## Files Created/Modified

- `packages/shared/src/api/foods-units.ts` - New file with FoodItem, UnitItem, BatchCreateIngredientsRequest interfaces
- `packages/shared/src/api/recipes.ts` - CreateRecipeRequest extended with optional ingredients[] and steps[] fields
- `packages/shared/src/index.ts` - Added `export * from './api/foods-units'` barrel export
- `apps/api/src/main.ts` - Added `transform: true` to ValidationPipe options

## Decisions Made

- Inlined the ingredient/step array shapes directly in CreateRecipeRequest rather than referencing CreateIngredientRequest/CreateStepRequest — keeps the compound create interface self-contained and avoids consumers needing to compose nested types manually.
- Added transform: true in this plan rather than Phase 18 to ensure no mid-phase editing of main.ts across two different plans.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 15-02 (name filters) can proceed; shared package compiles cleanly.
- Phase 16 (slug lookup), Phase 17 (batch ingredient add), and Phase 18 (compound create) all have their required shared types available.
- The ValidationPipe transform: true blocker documented in STATE.md is now resolved.

---
*Phase: 15-shared-types-name-filters*
*Completed: 2026-03-21*
