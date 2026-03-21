---
phase: 17-batch-ingredient-add
plan: 01
subsystem: api
tags: [nestjs, prisma, transaction, batch, ingredients, class-validator]

# Dependency graph
requires:
  - phase: 15-shared-types-name-filters
    provides: BatchCreateIngredientsRequest interface in @recipe-manager/shared
  - phase: 16-slug-uuid-dual-lookup
    provides: jest.resetAllMocks() pattern for unit tests
provides:
  - POST /api/recipes/:id/sections/:sectionId/ingredients/batch endpoint
  - IngredientsService.batchCreate with $transaction, MAX+1 order computation, SectionResponse return
  - BatchCreateIngredientsDto with @ValidateNested({ each: true }) for nested array validation
  - SECTION_WITH_INGREDIENTS_INCLUDE const and module-level mapper functions in ingredients.service.ts
affects: [phase-18-compound-create, any agent consuming batch ingredient endpoint]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Prisma interactive $transaction for atomic multi-step operations"
    - "Module-level mapper functions (toIngredientResponse, toSectionResponse) duplicated per-service to avoid cross-service coupling"
    - "SECTION_WITH_INGREDIENTS_INCLUDE const for reusable include shape"
    - "$transaction mock pattern: (mockPrisma as any).$transaction = jest.fn().mockImplementation((fn) => fn(mockPrisma))"

key-files:
  created:
    - apps/api/src/recipes/ingredients/dto/batch-create-ingredient.dto.ts
    - apps/api/integration_tests/recipes-batch-ingredient.integration-spec.ts
  modified:
    - apps/api/src/recipes/ingredients/ingredients.service.ts
    - apps/api/src/recipes/ingredients/ingredients.controller.ts
    - apps/api/src/recipes/ingredients/ingredients.service.spec.ts

key-decisions:
  - "Mappers (toIngredientResponse, toSectionResponse) duplicated in ingredients.service.ts rather than imported from recipes.service.ts to avoid cross-service coupling"
  - "@Post('batch') declared as first method in IngredientsController, before @Put('reorder'), to prevent NestJS route collision with :ingredientId parameter routes"
  - "Empty ingredients array short-circuits before $transaction — no DB writes needed, just fetch and return"
  - "P2003 FK errors caught in catch block and re-thrown as NotFoundException('Invalid food or unit ID')"

patterns-established:
  - "Interactive $transaction pattern: validate section inside tx, aggregate MAX(order), createMany, re-fetch with include, return mapped response"
  - "TDD for service methods: RED commit (failing spec) then GREEN commit (implementation) then verify build"

requirements-completed: [ERGO-05]

# Metrics
duration: 3min
completed: 2026-03-21
---

# Phase 17 Plan 01: Batch Ingredient Add Summary

**Atomic POST batch endpoint for ingredients using Prisma $transaction with MAX+1 order computation and full SectionResponse hydration**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-03-21T12:20:45Z
- **Completed:** 2026-03-21T12:23:50Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- BatchCreateIngredientsDto with @ValidateNested({ each: true }) validates nested ingredient array items
- IngredientsService.batchCreate atomically inserts multiple ingredients via $transaction, computing MAX(order)+1 start, re-fetching with food/unit hydration
- POST /api/recipes/:id/sections/:sectionId/ingredients/batch route added as first controller method (safe from route collisions)
- 7 unit tests + 4 Prisma-direct integration tests all pass

## Task Commits

Each task was committed atomically:

1. **TDD RED: Failing tests for batchCreate** - `b9b744b` (test)
2. **TDD GREEN: IngredientsService.batchCreate implementation** - `44a077d` (feat)
3. **Task 2: Controller route + Integration tests** - `f451639` (feat)

_Note: TDD task split into RED + GREEN commits per TDD protocol_

## Files Created/Modified
- `apps/api/src/recipes/ingredients/dto/batch-create-ingredient.dto.ts` - BatchIngredientItemDto + BatchCreateIngredientsDto implementing BatchCreateIngredientsRequest
- `apps/api/src/recipes/ingredients/ingredients.service.ts` - Added SECTION_WITH_INGREDIENTS_INCLUDE const, mapper functions, batchCreate method
- `apps/api/src/recipes/ingredients/ingredients.service.spec.ts` - Extended with 5 batchCreate tests, resetAllMocks, createMany mock, $transaction mock
- `apps/api/src/recipes/ingredients/ingredients.controller.ts` - Added @Post('batch') as first route with Swagger docs
- `apps/api/integration_tests/recipes-batch-ingredient.integration-spec.ts` - 4 Prisma-direct integration tests: happy path, order continuation, FK rollback, hydration

## Decisions Made
- Mappers duplicated (not imported from recipes.service.ts) to keep ingredients service independent from recipes service
- @Post('batch') placed before @Put('reorder') as the first method — ensures no routing ambiguity with :ingredientId parameterized routes
- Empty array returns current SectionResponse without touching DB (short-circuit before $transaction)
- FK constraint errors (P2003) surfaced as NotFoundException with user-friendly message

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None. Pre-existing failures in auth, meal-plan, admin-tokens, admin-users, and sharing service specs are out of scope and existed before this plan.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Batch ingredient endpoint live and tested; agents can now add multiple ingredients in a single atomic call
- Phase 18 (compound recipe create) can proceed — patterns established here (batchCreate, SECTION_WITH_INGREDIENTS_INCLUDE, mapper functions) are ready for reference

---
*Phase: 17-batch-ingredient-add*
*Completed: 2026-03-21*

## Self-Check: PASSED
- batch-create-ingredient.dto.ts: FOUND
- ingredients.service.ts: FOUND
- integration spec: FOUND
- SUMMARY.md: FOUND
- Commits b9b744b, 44a077d, f451639: FOUND
