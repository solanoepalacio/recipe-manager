---
phase: 09-frontend-recipe-creation-editing
plan: 05
subsystem: ui
tags: [prisma, nestjs, react, tanstack-query, lock, duplicate]

# Dependency graph
requires:
  - phase: 09-01-frontend-recipe-creation-editing
    provides: Recipe detail page with tab editor, edit mode, queryKeys, api-client
  - phase: 04-backend-recipe-crud
    provides: RecipesService, RecipesController, shared types in packages/shared

provides:
  - isLocked Boolean field on Recipe model with migration applied
  - isLocked in RecipeDetailResponse and UpdateRecipeRequest shared types
  - POST /api/recipes/:id/duplicate endpoint that deep-copies recipe with "(copia)" suffix
  - RecipeSettings component with accessible lock toggle and duplicate button
  - Ajustes tab wired with real RecipeSettings editor
  - Lock guard on detail page hides edit button when recipe.isLocked is true

affects:
  - future phases reading recipe data (isLocked now in all RecipeDetailResponse)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Accessible toggle switch using role=switch + aria-checked without a UI library
    - Prisma migration created manually and applied via migrate resolve --applied when shadow DB ordering is broken

key-files:
  created:
    - apps/api/prisma/migrations/20260318210000_add_recipe_is_locked/migration.sql
    - apps/web/src/components/recipes/editor/RecipeSettings.tsx
    - apps/web/src/components/__tests__/RecipeSettings.test.tsx
  modified:
    - apps/api/prisma/schema.prisma
    - packages/shared/src/api/recipes.ts
    - apps/api/src/recipes/dto/update-recipe.dto.ts
    - apps/api/src/recipes/recipes.service.ts
    - apps/api/src/recipes/recipes.controller.ts
    - apps/web/src/app/(app)/recipes/[slug]/page.tsx

key-decisions:
  - "Prisma shadow database failed due to migration 20260316_remove_landscape_view lacking a timestamp prefix (sorts before init alphabetically); fixed by manually creating migration SQL and using prisma migrate resolve --applied to bypass shadow DB"
  - "duplicate() service method reuses generateUniqueSlug() (not ensureUniqueSlug as plan stated — that method does not exist); slug = name + (copia) generates unique slug automatically"
  - "Lock guard: when recipe.isLocked is true and not in edit mode, edit button is replaced with Lock icon + Bloqueada text; Ajustes tab remains accessible in edit mode so user can unlock"

patterns-established:
  - "Accessible toggle switch: button role=switch + aria-checked={boolean} + aria-label — no third-party switch component needed"

requirements-completed: [RCP-02, RCP-05]

# Metrics
duration: 6min
completed: 2026-03-18
---

# Phase 09 Plan 05: Recipe Lock and Duplicate Summary

**isLocked field added to DB/API/shared types, POST duplicate endpoint, and RecipeSettings component with accessible lock toggle and duplicate button wired into Ajustes tab**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-18T21:22:00Z
- **Completed:** 2026-03-18T21:28:16Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- isLocked Boolean field added to Prisma schema with migration applied to live database; shared types, DTO, service mapper, and update method all updated
- POST /api/recipes/:id/duplicate endpoint deep-copies recipe (sections, ingredients, steps) with "(copia)" name suffix and unique slug
- RecipeSettings component with accessible role=switch toggle and duplicate button; detail page Ajustes tab wired; lock guard hides edit button when recipe is locked
- 5 new tests added; all 59 frontend tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Add isLocked to Prisma schema, shared types, DTO, service mapper, update service; add duplicate endpoint** - `1e7a811` (feat)
2. **Task 2: Create RecipeSettings component, wire into Ajustes tab, add lock mode guard** - `e650522` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `apps/api/prisma/migrations/20260318210000_add_recipe_is_locked/migration.sql` - ADD COLUMN isLocked to Recipe
- `apps/api/prisma/schema.prisma` - isLocked Boolean @default(false) added to Recipe model
- `packages/shared/src/api/recipes.ts` - isLocked added to RecipeDetailResponse and UpdateRecipeRequest
- `apps/api/src/recipes/dto/update-recipe.dto.ts` - @IsBoolean() isLocked field added
- `apps/api/src/recipes/recipes.service.ts` - toRecipeDetailResponse mapper updated; update() handles isLocked; duplicate() method added
- `apps/api/src/recipes/recipes.controller.ts` - POST :id/duplicate endpoint added
- `apps/web/src/components/recipes/editor/RecipeSettings.tsx` - New component: lock toggle + duplicate button
- `apps/web/src/app/(app)/recipes/[slug]/page.tsx` - RecipeSettings wired into Ajustes tab; lock guard added
- `apps/web/src/components/__tests__/RecipeSettings.test.tsx` - 5 tests for lock toggle states, PATCH call, POST duplicate, loading state

## Decisions Made
- Prisma shadow database migration ordering was broken (20260316_remove_landscape_view has no timestamp prefix, sorts before init alphabetically). Fixed by manually writing the SQL migration file and using `prisma migrate resolve --applied` to mark it applied, bypassing the shadow DB entirely.
- The plan referenced `ensureUniqueSlug` but the actual method is `generateUniqueSlug`. Used the correct existing method.
- Lock guard implementation: edit button replaced with Lock icon + "Bloqueada" text when locked in view mode. Ajustes tab remains accessible in edit mode (user can still toggle lock from there).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Prisma migrate dev failed due to broken migration ordering**
- **Found during:** Task 1 (Prisma migration)
- **Issue:** Migration directory `20260316_remove_landscape_view` lacks timestamp prefix; it sorts before `20260316112250_init` alphabetically, causing shadow DB to fail with "Recipe table does not exist"
- **Fix:** Manually created migration SQL at `20260318210000_add_recipe_is_locked/migration.sql`, applied DDL directly via PrismaClient raw query, then used `prisma migrate resolve --applied` to register it in `_prisma_migrations`
- **Files modified:** apps/api/prisma/migrations/20260318210000_add_recipe_is_locked/migration.sql (created)
- **Verification:** `isLocked` column confirmed present in database; Prisma client regenerated; API build passes
- **Committed in:** 1e7a811 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 3 - blocking)
**Impact on plan:** Pre-existing migration ordering bug required manual workaround. No scope creep. All planned functionality delivered.

## Issues Encountered
- Shadow database issue with pre-existing migration `20260316_remove_landscape_view` (no timestamp in name). Worked around with manual migration + resolve. This is a pre-existing issue in the migrations directory that should be cleaned up eventually.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 09 complete: all 5 plans done. Full recipe creation/editing flow implemented.
- Backend: isLocked and duplicate endpoint ready for use.
- Frontend: all editor tabs (Básico, Ingredientes, Instrucciones, Fotos, Ajustes) functional.

---
*Phase: 09-frontend-recipe-creation-editing*
*Completed: 2026-03-18*
