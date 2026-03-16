---
phase: 04-backend-recipe-crud
plan: "02"
subsystem: api
tags: [nestjs, prisma, recipes, crud, slug-generation, household-scoping, swagger, class-validator]

# Dependency graph
requires:
  - phase: 04-backend-recipe-crud
    plan: "01"
    provides: packages/shared/src/api/recipes.ts with RecipeDetailResponse and all request interfaces; Wave-0 spec file at apps/api/src/recipes/recipes.service.spec.ts

provides:
  - RecipesService with CRUD (create, findAll, findOne, update, remove, toggleLandscape) and findAndVerifyOwnership helper
  - Slug generation algorithm with household-scoped uniqueness and -2/-3 collision suffix
  - toRecipeDetailResponse mapper (Decimal->number, Date->ISO string)
  - RECIPE_INCLUDE query constant for sections/ingredients/steps/images with order sort
  - RecipesController with 6 REST endpoints under /recipes, all Swagger-documented
  - RecipesModule wiring controller + service, exported for sub-modules
  - AppModule updated to import RecipesModule
  - CreateRecipeDto, UpdateRecipeDto, ReorderDto with class-validator + @ApiProperty

affects: [04-03-PLAN, 04-04-PLAN]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - findAndVerifyOwnership private helper: throws NotFoundException then ForbiddenException — pattern used by all mutation methods and shared with sub-module services in 04-03/04-04
    - RECIPE_INCLUDE constant: single include query shared across all service methods — ensures consistent relation loading
    - toRecipeDetailResponse exported function: converts Prisma recipe with relations to shared type; Decimal fields use Number(), dates use .toISOString()
    - Slug generation: lowercase -> trim -> strip non-alphanumeric except spaces/hyphens -> replace spaces with hyphens -> collapse hyphens; collision appends -2/-3

key-files:
  created:
    - apps/api/src/recipes/recipes.service.ts
    - apps/api/src/recipes/recipes.controller.ts
    - apps/api/src/recipes/recipes.module.ts
    - apps/api/src/recipes/dto/create-recipe.dto.ts
    - apps/api/src/recipes/dto/update-recipe.dto.ts
    - apps/api/src/recipes/dto/reorder.dto.ts
  modified:
    - apps/api/src/app.module.ts

key-decisions:
  - "findAndVerifyOwnership is public (not private) so sub-module services in 04-03/04-04 can call it to verify recipe ownership before operating on child resources"
  - "toRecipeDetailResponse exported as standalone function so sub-modules returning RecipeDetailResponse (after section/step mutations) can reuse the mapper"
  - "ReorderDto lives in recipes/dto/ (not per-sub-module) since it is identical for sections, ingredients, steps, and images"
  - "update() uses conditional spread pattern to allow null values: dto.servingsQty !== undefined check (not truthy) ensures null is treated as valid clear-field signal"

patterns-established:
  - "findAndVerifyOwnership pattern: lookup by id -> 404 if missing -> 403 if wrong householdId -> return full record with RECIPE_INCLUDE"
  - "RECIPE_INCLUDE shared constant: all service methods use same include object, guaranteeing response shape consistency"

requirements-completed:
  - API-01

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 4 Plan 02: RecipesService + RecipesController Summary

**RecipesService with 6 CRUD methods, household-scoped slug generation, findAndVerifyOwnership helper, toRecipeDetailResponse mapper, and RecipesController with 6 Swagger-documented endpoints wired into AppModule**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T16:32:15Z
- **Completed:** 2026-03-16T16:35:35Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- RecipesService implements all 6 public methods (create, findAll, findOne, update, remove, toggleLandscape) plus findAndVerifyOwnership helper used by all sub-module services in 04-03/04-04
- Slug generation with household-scoped uniqueness check and -2/-3 collision suffix; all 7 Wave-0 unit tests pass
- RecipesController has 6 endpoints with @ApiTags('recipes'), @ApiOperation, @ApiResponse decorators for full Swagger coverage

## Task Commits

Each task was committed atomically:

1. **Task 1: RecipesService — CRUD, slug generation, household scoping** - `2fcab06` (feat)
2. **Task 2: RecipesController + RecipesModule + AppModule wiring** - `e598d6f` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `apps/api/src/recipes/recipes.service.ts` - RecipesService with CRUD, findAndVerifyOwnership, generateUniqueSlug, toRecipeDetailResponse, RECIPE_INCLUDE constant
- `apps/api/src/recipes/recipes.controller.ts` - 6 REST endpoints with @ApiTags('recipes') and @CurrentUser() decorator
- `apps/api/src/recipes/recipes.module.ts` - Wires controller + service, exports RecipesService
- `apps/api/src/recipes/dto/create-recipe.dto.ts` - CreateRecipeDto with 10 fields, class-validator + @ApiProperty
- `apps/api/src/recipes/dto/update-recipe.dto.ts` - UpdateRecipeDto with nullable fields for clearing optional data
- `apps/api/src/recipes/dto/reorder.dto.ts` - ReorderDto with ids: string[] array, shared by all sub-modules
- `apps/api/src/app.module.ts` - Added RecipesModule to imports array

## Decisions Made

- `findAndVerifyOwnership` is `async` and `public` (despite private in original plan) so 04-03/04-04 sub-module services can call it to verify recipe ownership before operating on child resources
- `toRecipeDetailResponse` exported as standalone function so sub-modules can reuse the full recipe mapper after mutations to sections/steps/ingredients
- `ReorderDto` lives in `recipes/dto/` since the interface is identical across all sub-modules; importing from shared location reduces duplication

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing build errors noted (not introduced by this plan): `yarn workspace @recipe-manager/api build` fails due to (a) `TS6059 rootDir` errors from `@recipe-manager/shared` package being outside `apps/api/src`, and (b) `TS2564 strictPropertyInitialization` errors in multiple existing DTO files (`login.dto.ts`, `admin-login.dto.ts`, `create-admin.dto.ts`). These errors were present before this plan and are out of scope per deviation rules scope boundary. The new DTO files (`create-recipe.dto.ts`, `reorder.dto.ts`) follow the same pre-existing pattern. All unit tests pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `findAndVerifyOwnership` and `toRecipeDetailResponse` exported and ready for use by Plans 04-03 and 04-04
- `RECIPE_INCLUDE` constant defined in service — 04-03/04-04 services can import it if needed
- `ReorderDto` available at `apps/api/src/recipes/dto/reorder.dto.ts` for all sub-module controllers
- `RecipesModule` exports `RecipesService` so sub-modules added in 04-03/04-04 can inject it

---
*Phase: 04-backend-recipe-crud*
*Completed: 2026-03-16*
