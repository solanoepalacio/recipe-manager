---
phase: 05-backend-search-sharing-meal-plan
plan: "03"
subsystem: api

tags: [nestjs, prisma, meal-plan, tdd, class-validator, swagger]

# Dependency graph
requires:
  - phase: 05-backend-search-sharing-meal-plan
    provides: SharedModule (foods/units), RecipesModule, shared types
  - phase: 02-database-schema-prisma
    provides: MealPlan and MealPlanEntry Prisma models

provides:
  - MealPlanModule with GET /meal-plan, POST /meal-plan/entries, PATCH /meal-plan/entries/:id, DELETE /meal-plan/entries/:id
  - Lazy MealPlan creation (upsert) on first createEntry call
  - Household ownership verification for PATCH/DELETE via mealPlan.householdId join
  - packages/shared/src/api/meal-plan.ts with 4 shared type contracts

affects:
  - Phase 10 (Frontend Meal Planner — consumes MealPlanResponse and entry CRUD endpoints)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Lazy resource creation via Prisma upsert (getOrCreateMealPlan)
    - Cross-table ownership verification (MealPlanEntry has no householdId; must join mealPlan)
    - TDD: spec created before service; RED then GREEN

key-files:
  created:
    - packages/shared/src/api/meal-plan.ts
    - apps/api/src/meal-plan/meal-plan.service.ts
    - apps/api/src/meal-plan/meal-plan.service.spec.ts
    - apps/api/src/meal-plan/meal-plan.controller.ts
    - apps/api/src/meal-plan/meal-plan.module.ts
    - apps/api/src/meal-plan/dto/create-meal-plan-entry.dto.ts
    - apps/api/src/meal-plan/dto/update-meal-plan-entry.dto.ts
  modified:
    - packages/shared/src/index.ts (added export ./api/meal-plan)
    - apps/api/src/app.module.ts (added MealPlanModule import)
    - apps/api/jest.config.ts (fixed moduleNameMapper path: ../../ -> ../../../)

key-decisions:
  - "MealPlanEntry ownership verified by fetching entry with include: { mealPlan: true } and checking mealPlan.householdId — MealPlanEntry has no direct householdId column"
  - "Lazy MealPlan creation via mealPlan.upsert({ where: { householdId }, create: { householdId }, update: {} }) on createEntry — no explicit init endpoint needed"
  - "jest.config.ts moduleNameMapper used ../../ (wrong, resolves to apps/packages/shared) — fixed to ../../../ to correctly reach workspace root packages/shared"

patterns-established:
  - "Cross-table ownership verification: when child entity lacks householdId, include parent in findUnique and check parent.householdId"
  - "Lazy resource creation: upsert pattern for one-to-one household-scoped aggregates"

requirements-completed: []

# Metrics
duration: 4min
completed: 2026-03-16
---

# Phase 5 Plan 03: Meal Plan Module Summary

**MealPlanModule with full CRUD for household meal plan entries using lazy MealPlan upsert, cross-table ownership verification, and 12 TDD-driven unit tests**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-16T18:47:32Z
- **Completed:** 2026-03-16T18:51:32Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Full MealPlanModule: GET /meal-plan (with optional from/to date filter), POST /meal-plan/entries, PATCH /meal-plan/entries/:id, DELETE /meal-plan/entries/:id
- Shared type contracts in packages/shared/src/api/meal-plan.ts (MealPlanEntryResponse, MealPlanResponse, CreateMealPlanEntryRequest, UpdateMealPlanEntryRequest)
- TDD: 12 unit tests covering all service methods including ownership enforcement and edge cases
- Auto-fixed broken jest moduleNameMapper path that prevented @recipe-manager/shared imports in test files

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared meal-plan types + DTOs + spec + MealPlanService** - `b08161f` (feat)
2. **Task 2: MealPlanController + MealPlanModule + AppModule wiring** - `81956de` (feat)

**Plan metadata:** (docs commit follows)

_Note: Task 1 was TDD — spec written first (RED), service implemented second (GREEN)_

## Files Created/Modified
- `packages/shared/src/api/meal-plan.ts` - 4 shared type interfaces: MealPlanEntryResponse, MealPlanResponse, CreateMealPlanEntryRequest, UpdateMealPlanEntryRequest
- `packages/shared/src/index.ts` - Added `export * from './api/meal-plan'`
- `apps/api/src/meal-plan/dto/create-meal-plan-entry.dto.ts` - CreateMealPlanEntryDto with @ApiProperty and class-validator
- `apps/api/src/meal-plan/dto/update-meal-plan-entry.dto.ts` - UpdateMealPlanEntryDto (all fields optional)
- `apps/api/src/meal-plan/meal-plan.service.spec.ts` - 12 unit tests (all green)
- `apps/api/src/meal-plan/meal-plan.service.ts` - MealPlanService with getEntries, createEntry, updateEntry, deleteEntry
- `apps/api/src/meal-plan/meal-plan.controller.ts` - 4 route handlers with Swagger docs
- `apps/api/src/meal-plan/meal-plan.module.ts` - MealPlanModule declaration
- `apps/api/src/app.module.ts` - Added MealPlanModule to imports array
- `apps/api/jest.config.ts` - Fixed moduleNameMapper: `../../` → `../../../` (rootDir is `src`, needs 3 levels to reach monorepo root)

## Decisions Made
- MealPlanEntry lacks a householdId column — ownership verification requires fetching the entry with `include: { mealPlan: true }` and checking `entry.mealPlan.householdId`
- Lazy MealPlan creation: `mealPlan.upsert` on every `createEntry` call — idiomatic, atomic, and avoids a separate init endpoint
- `toMealPlanEntryResponse` mapper converts `Date` objects to ISO strings correctly for both live Prisma data and test mocks

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed jest moduleNameMapper incorrect path**
- **Found during:** Task 1 (TDD RED phase — first test run)
- **Issue:** `moduleNameMapper` resolved `@recipe-manager/shared` to `apps/packages/shared/src/index.ts` (non-existent). Path used `<rootDir>/../../` but `<rootDir>` is `src` inside `apps/api`, so `../../` only reaches `apps/`, not the monorepo root. No prior spec imported from shared directly, so the bug was latent.
- **Fix:** Changed `../../packages/shared` to `../../../packages/shared` in `apps/api/jest.config.ts`
- **Files modified:** `apps/api/jest.config.ts`
- **Verification:** All 68 tests pass; all specs that import from `@recipe-manager/shared` resolve correctly
- **Committed in:** `b08161f` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 — blocking)
**Impact on plan:** Required for TDD GREEN phase to work. No scope creep.

## Issues Encountered
None beyond the auto-fixed jest config path.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- MealPlanModule complete; all 4 endpoints ready for Phase 10 Frontend Meal Planner
- 68 unit tests passing; TypeScript build clean
- No blockers

---
*Phase: 05-backend-search-sharing-meal-plan*
*Completed: 2026-03-16*

## Self-Check: PASSED
- packages/shared/src/api/meal-plan.ts: FOUND
- apps/api/src/meal-plan/meal-plan.service.ts: FOUND
- apps/api/src/meal-plan/meal-plan.controller.ts: FOUND
- apps/api/src/meal-plan/meal-plan.module.ts: FOUND
- Commit b08161f: FOUND
- Commit 81956de: FOUND
- MealPlanModule in app.module.ts: FOUND (line 8 and 11)
