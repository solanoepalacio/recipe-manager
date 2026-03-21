---
phase: 18-compound-recipe-create
plan: 01
subsystem: api
tags: [nestjs, prisma, dto, class-validator, transaction, integration-test]

# Dependency graph
requires:
  - phase: 17-batch-ingredient-add
    provides: BatchIngredientItemDto reused for inline ingredient items in CreateRecipeDto
  - phase: 15-shared-types-name-filters
    provides: CreateRecipeRequest shared type and transform:true ValidationPipe already in place
provides:
  - CompoundStepItemDto class with optional title + required body, full validation decorators
  - Extended CreateRecipeDto with optional ingredients[] and steps[] arrays
  - RecipesService.create wrapped in prisma.$transaction with conditional nested creates
  - P2003 FK error caught and rethrown as BadRequestException
  - 4 new unit tests in create -- compound describe block
  - 3 integration tests covering backward-compat, full compound create, and FK rollback
affects: [19-any-future-recipe-phase, api-docs, agent-client-integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Compound nested create: single $transaction wrapping recipe.create with conditional spread for ingredients/steps"
    - "FK error handling: catch P2003 PrismaClientKnownRequestError, rethrow as BadRequestException"
    - "Empty-array guard: dto.ingredients?.length (not just dto.ingredients) treats [] same as undefined"
    - "Reuse existing DTO: BatchIngredientItemDto imported from ingredients submodule into parent DTO"

key-files:
  created:
    - apps/api/integration_tests/recipes-compound-create.integration-spec.ts
  modified:
    - apps/api/src/recipes/dto/create-recipe.dto.ts
    - apps/api/src/recipes/recipes.service.ts
    - apps/api/src/recipes/recipes.service.spec.ts

key-decisions:
  - "generateUniqueSlug stays OUTSIDE $transaction (read-only, avoids locking issues)"
  - "Always use $transaction even for simple creates (single code path per locked decision)"
  - "dto.ingredients?.length guard treats both undefined and empty array as no-ingredients case"
  - "BadRequestException (not NotFoundException) for P2003 per plan locked decision"
  - "Error message exactly: 'Invalid ingredient data: food or unit not found'"

patterns-established:
  - "Compound create: conditional spread inside sections.create[0] for ingredients, top-level spread for steps"
  - "Integration test FK rollback: count before/after + findFirst(name) double verification"

requirements-completed: [ERGO-03]

# Metrics
duration: 3min
completed: 2026-03-21
---

# Phase 18 Plan 01: Compound Recipe Create Summary

**POST /api/recipes extended with optional ingredients[] and steps[] arrays — all entities created atomically via prisma.$transaction with P2003 FK rollback and backward compatibility**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-21T14:10:40Z
- **Completed:** 2026-03-21T14:13:56Z
- **Tasks:** 2
- **Files modified:** 4 (3 modified, 1 created)

## Accomplishments
- Extended CreateRecipeDto with CompoundStepItemDto class and optional ingredients[]/steps[] arrays with full class-validator + @ApiProperty decorators
- Wrapped RecipesService.create in prisma.$transaction with conditional nested ingredient/step creation; P2003 FK errors caught and rethrown as BadRequestException
- Added 4 unit tests in create -- compound describe block (all 24 unit tests pass)
- Created 3 integration tests against real DB: backward-compat, full compound create with hydrated response, FK rollback with orphan verification

## Task Commits

Each task was committed atomically:

1. **Task 1: DTO extension + service $transaction + unit tests** - `14a45d1` (feat)
2. **Task 2: Integration tests for compound create** - `de7ca76` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `apps/api/src/recipes/dto/create-recipe.dto.ts` - Added CompoundStepItemDto class and optional ingredients[]/steps[] array fields with full validation chain
- `apps/api/src/recipes/recipes.service.ts` - Wrapped create() in $transaction, added conditional nested creates, P2003 error handling
- `apps/api/src/recipes/recipes.service.spec.ts` - Added $transaction mock + create -- compound describe block (4 tests)
- `apps/api/integration_tests/recipes-compound-create.integration-spec.ts` - New: 3 integration tests against real PostgreSQL

## Decisions Made
- generateUniqueSlug kept OUTSIDE $transaction — it is read-only and keeping it outside avoids any lock-duration concerns
- Always use $transaction for the create path (single code path, per locked plan decision)
- dto.ingredients?.length guard (not just dto.ingredients) ensures empty array [] behaves identically to undefined
- BadRequestException for P2003, not NotFoundException — per plan locked decision
- Error message exactly: "Invalid ingredient data: food or unit not found"

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing test failures in unrelated files were present before this plan (out of scope per deviation rules):
- `auth.service.spec.ts` — uses Vitest import in Jest environment (pre-existing incompatibility)
- `admin-users.service.spec.ts` — missing gender/dateOfBirth required fields (added in quick task 260319-qas)
- `admin-tokens.service.spec.ts`, `sharing.service.spec.ts`, `meal-plan.service.spec.ts` — pre-existing failures

These are logged as deferred items and do not affect this plan's deliverables.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All v1.2 API ergonomics phases complete (15, 16, 17, 18)
- Compound recipe create is production-ready: agents can create a full recipe in a single POST /api/recipes call
- No blockers for future phases

---
*Phase: 18-compound-recipe-create*
*Completed: 2026-03-21*
