---
phase: 04-backend-recipe-crud
plan: "04"
subsystem: api
tags: [nestjs, prisma, multer, file-upload, rest-api]

# Dependency graph
requires:
  - phase: 04-backend-recipe-crud
    provides: RecipesService.findAndVerifyOwnership, RecipesModule base, ReorderDto, Wave-0 spec files for steps and images

provides:
  - StepsService with create/update/remove/reorder (InstructionStep CRUD)
  - StepsController at /recipes/:id/steps (PUT reorder declared before PATCH :stepId)
  - ImagesService with create (Multer upload, /uploads/ URL) and remove (fs.promises.unlink)
  - ImagesController at /recipes/:id/images (multipart POST + DELETE)
  - RecipesModule final state with all 5 controllers and 5 providers

affects:
  - 05-frontend (consumes these endpoints)
  - integration tests

# Tech tracking
tech-stack:
  added: ["@types/multer (dev dependency for Express.Multer.File type)"]
  patterns:
    - "Sub-module services verify recipe ownership via direct prisma.recipe.findUnique (no RecipesService injection) — matches Wave-0 spec mock structure"
    - "File upload: diskStorage with process.cwd() (not __dirname), randomUUID() filename, MIME filter, 10MB limit"
    - "Image delete: DB record deleted first, then fs.promises.unlink with .catch(() => {}) to swallow ENOENT"
    - "Route order: PUT reorder declared before PATCH :stepId in controller to prevent NestJS route collision"

key-files:
  created:
    - apps/api/src/recipes/steps/steps.service.ts
    - apps/api/src/recipes/steps/steps.controller.ts
    - apps/api/src/recipes/steps/dto/create-step.dto.ts
    - apps/api/src/recipes/steps/dto/update-step.dto.ts
    - apps/api/src/recipes/images/images.service.ts
    - apps/api/src/recipes/images/images.controller.ts
  modified:
    - apps/api/src/recipes/recipes.module.ts

key-decisions:
  - "StepsService and ImagesService verify ownership via direct prisma.recipe.findUnique (same pattern as SectionsService/IngredientsService) — Wave-0 specs only mock PrismaService, not RecipesService"
  - "process.cwd() used for Multer destination (not __dirname) — avoids dist/ path issue after TypeScript build"
  - "@types/multer added as dev dependency — required for Express.Multer.File type in TypeScript (multer was present but types were missing)"

patterns-established:
  - "Sub-resource ownership pattern: private verifyRecipeOwnership calling prisma.recipe.findUnique directly"
  - "Reorder pattern: Promise.all(ids.map((id, index) => prisma.update({ where: { id }, data: { order: index } })))"

requirements-completed: [API-01]

# Metrics
duration: 4min
completed: 2026-03-16
---

# Phase 4 Plan 04: Steps, Images sub-modules + final RecipesModule Summary

**Steps CRUD with reorder, image upload via Multer disk storage with UUID filenames and MIME filter, and RecipesModule finalized with all 5 controllers and 5 providers**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-16T16:44:55Z
- **Completed:** 2026-03-16T16:48:11Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- StepsService and StepsController: full CRUD + reorder with PUT declared before PATCH to avoid NestJS route collision
- ImagesService: Multer file upload storing `/uploads/<filename>` relative URL in DB; delete removes DB record and calls `fs.promises.unlink` (swallows ENOENT)
- ImagesController: `FileInterceptor` with `diskStorage` using `process.cwd()`, `randomUUID()` filenames, 10MB limit, JPEG/PNG/WebP/GIF MIME filter
- RecipesModule finalized with all 5 controllers and 5 providers — completes Phase 4 REST API surface
- All 41 unit tests pass across 12 test suites; TypeScript build clean

## Task Commits

Each task was committed atomically:

1. **Task 1: StepsService + StepsController + DTOs** - `6c6b03b` (feat)
2. **Task 2: ImagesService + ImagesController + final RecipesModule** - `c8f858f` (feat)

## Files Created/Modified

- `apps/api/src/recipes/steps/steps.service.ts` - StepsService: create/update/remove/reorder with ownership verification
- `apps/api/src/recipes/steps/steps.controller.ts` - StepsController: 4 endpoints, reorder before :stepId
- `apps/api/src/recipes/steps/dto/create-step.dto.ts` - CreateStepDto with class-validator + ApiProperty
- `apps/api/src/recipes/steps/dto/update-step.dto.ts` - UpdateStepDto with class-validator + ApiProperty
- `apps/api/src/recipes/images/images.service.ts` - ImagesService: upload to /uploads/, delete with fs.promises.unlink
- `apps/api/src/recipes/images/images.controller.ts` - ImagesController: FileInterceptor multer POST + DELETE
- `apps/api/src/recipes/recipes.module.ts` - Final state: 5 controllers + 5 providers

## Decisions Made

- StepsService and ImagesService verify ownership via direct `prisma.recipe.findUnique` (same pattern as SectionsService). The Wave-0 specs only mock `PrismaService`, not `RecipesService` — injecting `RecipesService` would have caused test compilation errors.
- `process.cwd()` used for Multer destination to avoid `dist/` path issues after TypeScript build.
- `@types/multer` added as dev dependency — required for `Express.Multer.File` type; `multer` package was present but types were missing.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added @types/multer dev dependency**
- **Found during:** Task 2 (ImagesService + ImagesController)
- **Issue:** `Express.Multer.File` type from `@types/multer` was not installed; TypeScript compilation failed with "Namespace 'global.Express' has no exported member 'Multer'"
- **Fix:** Ran `yarn workspace @recipe-manager/api add -D @types/multer`
- **Files modified:** apps/api/package.json, yarn.lock
- **Verification:** `yarn workspace @recipe-manager/api test --testPathPattern=images.service` exits 0 (4 tests pass)
- **Committed in:** c8f858f (Task 2 commit)

**2. [Rule 1 - Pattern] StepsService uses direct prisma ownership verification (not RecipesService)**
- **Found during:** Task 1 (StepsService)
- **Issue:** Plan spec showed `RecipesService` injection but Wave-0 spec test provides only `PrismaService` — injecting `RecipesService` would have caused DI test failure
- **Fix:** Followed same pattern as SectionsService/IngredientsService: private `verifyRecipeOwnership` method using `prisma.recipe.findUnique` directly
- **Files modified:** apps/api/src/recipes/steps/steps.service.ts
- **Verification:** Wave-0 reorder test passes (2 tests)
- **Committed in:** 6c6b03b (Task 1 commit)

---

**Total deviations:** 2 (1 blocking dep fix, 1 implementation pattern alignment)
**Impact on plan:** Both required for correctness. No scope creep.

## Issues Encountered

None beyond the deviations documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Full recipe CRUD REST API surface is complete: RecipeService + 4 sub-resources (Sections, Ingredients, Steps, Images)
- RecipesModule finalized with all 5 controllers and 5 providers
- All 41 unit tests pass; TypeScript build clean
- Ready for Phase 5 (frontend)

## Self-Check: PASSED

All files and commits verified present.

---
*Phase: 04-backend-recipe-crud*
*Completed: 2026-03-16*
