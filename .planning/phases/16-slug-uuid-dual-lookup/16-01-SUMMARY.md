---
phase: 16-slug-uuid-dual-lookup
plan: 01
subsystem: api
tags: [nestjs, prisma, recipes, slug, uuid, dual-lookup, swagger]

# Dependency graph
requires:
  - phase: 13-foundation-read
    provides: RecipesService and RecipesController foundation
provides:
  - isUuid() module-level helper for UUID v4 regex detection
  - findByIdOrSlug() method on RecipesService for slug/UUID dual lookup
  - GET /api/recipes/:id accepts both UUID and human-readable slug
  - Cross-household access returns 404 (not 403) for GET :id
  - Swagger ApiParam documenting UUID or slug on GET :id
affects: [phase-18-compound-create, agent-clients]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - isUuid module-level function above @Injectable for UUID v4 detection via regex
    - findByIdOrSlug dispatches to findUnique (UUID) or findFirst+householdId (slug)
    - UUID cross-household silently sets recipe=null (404), never throws ForbiddenException from findOne path
    - findAndVerifyOwnership unchanged — write ops still return 403

key-files:
  created:
    - apps/api/integration_tests/recipes-slug.integration-spec.ts
  modified:
    - apps/api/src/recipes/recipes.service.ts
    - apps/api/src/recipes/recipes.service.spec.ts
    - apps/api/src/recipes/recipes.controller.ts

key-decisions:
  - "isUuid is a module-level function (not class method) to stay outside DI container"
  - "findByIdOrSlug sets recipe=null on cross-household UUID then throws NotFoundException — no ForbiddenException from GET :id"
  - "jest.resetAllMocks() replaces jest.clearAllMocks() in beforeEach to prevent Once-queue leakage across tests"
  - "findAndVerifyOwnership preserved unchanged — write ops (update, remove, duplicate) still use it with 403 behavior"

patterns-established:
  - "isUuid pattern: module-level regex check before dispatching to findUnique vs findFirst"
  - "Slug lookup always includes householdId in Prisma where predicate — never post-fetch check"

requirements-completed: [ERGO-04]

# Metrics
duration: 6min
completed: 2026-03-21
---

# Phase 16 Plan 01: Slug/UUID Dual Lookup Summary

**GET /api/recipes/:id now accepts both UUID and human-readable slug via isUuid dispatch in RecipesService.findByIdOrSlug, with cross-household access returning 404 for both paths**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-21T11:19:58Z
- **Completed:** 2026-03-21T11:25:41Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added `isUuid()` module-level helper using UUID v4 regex, placed above `@Injectable()` decorator
- Added `findByIdOrSlug()` method: UUID branch calls `findUnique` with household check (null=404), slug branch calls `findFirst` with householdId in where predicate
- Updated `findOne()` to delegate to `findByIdOrSlug` — cross-household UUID now returns 404 instead of 403
- Updated controller GET `:id` with `@ApiParam` documenting UUID/slug dual lookup, removed 403 response
- Added 6 unit tests in `describe('findOne — dual lookup')` block covering all branches
- Added 4 Prisma integration tests in `recipes-slug.integration-spec.ts` (ERGO-04)

## Task Commits

Each task was committed atomically:

1. **Task 1: Add isUuid helper + findByIdOrSlug to RecipesService with unit tests** - `4dc515a` (feat)
2. **Task 2: Update controller Swagger annotation + add integration tests** - `407df67` (feat)

**Plan metadata:** (docs commit below)

_Note: Task 1 followed TDD (RED then GREEN)_

## Files Created/Modified
- `apps/api/src/recipes/recipes.service.ts` - Added `isUuid()` and `findByIdOrSlug()`, updated `findOne()`
- `apps/api/src/recipes/recipes.service.spec.ts` - Added `findOne — dual lookup` describe block (6 tests), switched to `resetAllMocks`
- `apps/api/src/recipes/recipes.controller.ts` - Added `ApiParam`, updated `ApiOperation`, removed 403 response from GET :id
- `apps/api/integration_tests/recipes-slug.integration-spec.ts` - New: 4 Prisma integration tests for ERGO-04

## Decisions Made
- `isUuid` is a module-level function (not a class method) — no need for DI, clean separation
- `findByIdOrSlug` sets `recipe = null` on cross-household UUID match then throws NotFoundException — GET :id is ergonomics-first (404 not 403)
- `findAndVerifyOwnership` left unchanged — write ops (PATCH, DELETE, duplicate) retain 403 behavior
- Switched `jest.clearAllMocks()` to `jest.resetAllMocks()` in `beforeEach` to prevent Once-queue leakage when a prior test's non-UUID string bypasses `findUnique`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed jest.clearAllMocks() → jest.resetAllMocks() to prevent mock queue leakage**
- **Found during:** Task 1 (TDD GREEN phase)
- **Issue:** Prior tests in `findOne` describe block used `mockResolvedValueOnce` with non-UUID strings. Since `clearAllMocks` doesn't flush the Once queue, those unconsumed mocks leaked into the new dual lookup tests, causing `findUnique` to return wrong values
- **Fix:** Changed `jest.clearAllMocks()` to `jest.resetAllMocks()` in `beforeEach` so the Once queue is flushed before every test
- **Files modified:** `apps/api/src/recipes/recipes.service.spec.ts`
- **Verification:** All 21 unit tests pass in full suite run
- **Committed in:** `4dc515a` (Task 1 commit)

**2. [Rule 3 - Blocking] Fixed Gender enum case and removed non-existent username field in integration test**
- **Found during:** Task 2 (integration test run)
- **Issue:** Integration test used `gender: 'OTHER'` (uppercase, wrong) and `username` field (not in User schema). TypeScript compilation failed.
- **Fix:** Changed to `gender: 'other'` (Prisma enum lowercase) and removed `username` field
- **Files modified:** `apps/api/integration_tests/recipes-slug.integration-spec.ts`
- **Verification:** Integration test suite passes with 4 new tests (10 total)
- **Committed in:** `407df67` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 Rule 1 bug, 1 Rule 3 blocking)
**Impact on plan:** Both fixes necessary for test correctness and compilation. No scope creep.

## Issues Encountered
- None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Slug/UUID dual lookup complete for GET /api/recipes/:id
- Write ops (PATCH, DELETE, duplicate) remain UUID-only with 403 on cross-household access — by design
- Phase 18 (compound create) can proceed; findByIdOrSlug pattern is established for any future slug lookup needs

---
*Phase: 16-slug-uuid-dual-lookup*
*Completed: 2026-03-21*
