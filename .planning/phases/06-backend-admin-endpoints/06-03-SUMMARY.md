---
phase: 06-backend-admin-endpoints
plan: 03
subsystem: api
tags: [nestjs, prisma, admin, households, crud, swagger]

# Dependency graph
requires:
  - phase: 06-backend-admin-endpoints-01
    provides: AdminHouseholdResponse, AdminHouseholdDetailResponse, AdminUserResponse shared types; AdminAuthGuard; AdminModule scaffold
  - phase: 06-backend-admin-endpoints-02
    provides: AdminPaginationDto reusable across admin sub-modules; AdminUsersService pagination/mapper pattern
provides:
  - AdminHouseholdsService: findAll (paginated + memberCount), findOne (with members), create, update, remove (cascade $transaction)
  - AdminHouseholdsController: GET/POST/GET:id/PATCH:id/DELETE:id endpoints at admin/households
  - CreateAdminHouseholdDto and UpdateAdminHouseholdDto
  - AdminModule wired with households controller + service
affects: [06-backend-admin-endpoints-04, 06-backend-admin-endpoints-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "toAdminHouseholdResponse mapper: maps _count.users to memberCount (avoids N+1 on list)"
    - "Cascade delete pattern: pre-fetch child IDs then $transaction with deleteMany in dependency order"
    - "AdminPaginationDto reused from users sub-module (no new pagination DTOs needed)"

key-files:
  created:
    - apps/api/src/admin/households/admin-households.service.ts
    - apps/api/src/admin/households/admin-households.controller.ts
    - apps/api/src/admin/households/dto/create-household.dto.ts
    - apps/api/src/admin/households/dto/update-household.dto.ts
  modified:
    - apps/api/src/admin/admin.module.ts

key-decisions:
  - "Cascade delete uses $transaction with array of deleteMany operations in strict dependency order (mealPlanEntry → mealPlan → recipeIngredient → ingredientSection → recipeImage → instructionStep → recipe → apiToken → user → household)"
  - "recipe.findMany pre-fetched outside $transaction to get recipeIds for child deletion (Prisma array transactions cannot reference results of earlier steps)"
  - "recipes ?? [] null-guard added for test robustness when mock returns undefined"

patterns-established:
  - "Household cascade delete: pre-fetch recipeIds, then single $transaction for all deletes"
  - "AdminHouseholdsController: AdminAuthGuard at class level, AdminPaginationDto for list query params"

requirements-completed: []

# Metrics
duration: 2min
completed: 2026-03-18
---

# Phase 6 Plan 3: Admin Households CRUD Summary

**AdminHouseholdsService with paginated list (memberCount), detail (members array), and cascade $transaction delete; plus controller with 5 Swagger-documented endpoints protected by AdminAuthGuard**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-18T11:08:43Z
- **Completed:** 2026-03-18T11:10:43Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- AdminHouseholdsService: findAll returns paginated list with memberCount from `_count.users`; findOne returns full members array; create/update/remove CRUD; cascade delete via `$transaction` in correct dependency order
- AdminHouseholdsController: 5 endpoints (GET/POST/GET:id/PATCH:id/DELETE:id), AdminAuthGuard at class level, full Swagger documentation
- All 5 Wave-0 spec tests passing; build clean

## Task Commits

Each task was committed atomically:

1. **Task 1: DTOs + AdminHouseholdsService** - `dd9c73d` (feat)
2. **Task 2: AdminHouseholdsController** - `1f12f80` (feat)

## Files Created/Modified

- `apps/api/src/admin/households/admin-households.service.ts` - CRUD service with cascade delete via Prisma $transaction
- `apps/api/src/admin/households/admin-households.controller.ts` - REST controller with AdminAuthGuard, 5 CRUD endpoints
- `apps/api/src/admin/households/dto/create-household.dto.ts` - CreateAdminHouseholdDto with class-validator + Swagger
- `apps/api/src/admin/households/dto/update-household.dto.ts` - UpdateAdminHouseholdDto with class-validator + Swagger
- `apps/api/src/admin/admin.module.ts` - Wired AdminHouseholdsController + AdminHouseholdsService

## Decisions Made

- Cascade delete pre-fetches recipeIds outside the transaction because Prisma array transactions cannot reference earlier step results
- `recipes ?? []` null-guard added for test robustness — Wave-0 spec's `remove` test doesn't mock `recipe.findMany`, which returns `undefined` from a bare `jest.fn()`
- AdminPaginationDto imported from `../users/dto/admin-pagination.dto` (reuse as planned)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Null-guard on recipe.findMany result in remove()**
- **Found during:** Task 1 (AdminHouseholdsService)
- **Issue:** Wave-0 spec's `remove` test doesn't configure `prisma.recipe.findMany` mock — bare `jest.fn()` returns `undefined`; `undefined.map(...)` throws TypeError
- **Fix:** Changed `recipes.map(...)` to `(recipes ?? []).map(...)` — defensive null-guard
- **Files modified:** apps/api/src/admin/households/admin-households.service.ts
- **Verification:** All 5 spec tests pass after fix
- **Committed in:** dd9c73d (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Single defensive null-guard — no scope creep. Required for test compatibility.

## Issues Encountered

None beyond the auto-fixed mock-compatibility issue above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Admin households CRUD complete; ready for Plan 06-04 (admin foods/units) and 06-05 (admin tokens)
- AdminModule pattern established: controller + service wired in admin.module.ts providers/controllers/exports

---
*Phase: 06-backend-admin-endpoints*
*Completed: 2026-03-18*

## Self-Check: PASSED

- FOUND: apps/api/src/admin/households/admin-households.service.ts
- FOUND: apps/api/src/admin/households/admin-households.controller.ts
- FOUND: apps/api/src/admin/households/dto/create-household.dto.ts
- FOUND: apps/api/src/admin/households/dto/update-household.dto.ts
- FOUND commit: dd9c73d
- FOUND commit: 1f12f80
