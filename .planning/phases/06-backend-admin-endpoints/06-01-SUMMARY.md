---
phase: 06-backend-admin-endpoints
plan: 01
subsystem: api
tags: [nestjs, typescript, admin, shared-types, tdd, wave-0]

# Dependency graph
requires:
  - phase: 05-backend-search-sharing-meal-plan
    provides: Prisma schema with all models (User, Household, Food, Unit, ApiToken) and existing shared types barrel
provides:
  - packages/shared/src/api/admin.ts — 7 admin domain interfaces (AdminUserResponse, AdminHouseholdResponse, AdminHouseholdDetailResponse, AdminFoodResponse, AdminUnitResponse, AdminTokenResponse, AdminTokenCreatedResponse)
  - CurrentAdmin param decorator reading req.admin (set by AdminAuthGuard)
  - Wave-0 spec scaffolds for all 5 admin sub-modules defining expected behavior shapes before implementation
affects: [06-02-admin-users, 06-03-admin-households, 06-04-admin-foods-units, 06-05-admin-tokens]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Wave-0 TDD: spec scaffolds written before service implementations so TypeScript types enforce contract
    - Sensitive field exclusion enforced at type level (tokenHash, passwordHash absent from AdminTokenResponse/AdminUserResponse)
    - AdminTokenCreatedResponse extends AdminTokenResponse with one-time raw token field

key-files:
  created:
    - packages/shared/src/api/admin.ts
    - apps/api/src/auth/decorators/current-admin.decorator.ts
    - apps/api/src/admin/households/admin-households.service.spec.ts
    - apps/api/src/admin/foods/admin-foods.service.spec.ts
    - apps/api/src/admin/units/admin-units.service.spec.ts
    - apps/api/src/admin/tokens/admin-tokens.service.spec.ts
  modified:
    - packages/shared/src/index.ts
    - apps/api/src/admin/users/admin-users.service.spec.ts

key-decisions:
  - "Wave-0 scaffolds fail by design — implementation plans 06-02 through 06-05 make them pass"
  - "AdminTokenCreatedResponse extends AdminTokenResponse — raw token shown exactly once on POST; list endpoint never exposes tokenHash"
  - "CurrentAdmin reads req.admin (set by AdminAuthGuard) — parallel to CurrentUser reading req.user (set by AnyAuthGuard)"

patterns-established:
  - "Wave-0 TDD: write spec before service; spec fails at import level; implementation makes it pass"
  - "Admin types barrel pattern: packages/shared/src/api/admin.ts exported via index.ts"

requirements-completed: []

# Metrics
duration: 4min
completed: 2026-03-18
---

# Phase 6 Plan 1: Admin Shared Types + Wave-0 Spec Scaffolds Summary

**Seven shared admin response interfaces and Wave-0 spec scaffolds for all 5 admin sub-modules, enabling TDD implementation in plans 06-02 through 06-05**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-18T00:19:53Z
- **Completed:** 2026-03-18T00:23:50Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- packages/shared/src/api/admin.ts with 7 interfaces covering all admin domain response shapes (no tokenHash, no passwordHash)
- CurrentAdmin param decorator at apps/api/src/auth/decorators/current-admin.decorator.ts reading req.admin
- admin-users.service.spec.ts expanded from 3 to 10 tests with CRUD describe blocks (findAll, findOne, create, update, remove)
- Four new Wave-0 spec scaffolds for households, foods, units, and tokens — all fail on import because service implementations don't exist yet

## Task Commits

1. **Task 1: Create packages/shared/src/api/admin.ts + export from index** - `03e0717` (feat)
2. **Task 2: CurrentAdmin decorator + Wave-0 spec scaffolds** - `3112e57` (test)

## Files Created/Modified
- `packages/shared/src/api/admin.ts` - 7 exported admin response interfaces, no sensitive fields
- `packages/shared/src/index.ts` - added `export * from './api/admin'`
- `apps/api/src/auth/decorators/current-admin.decorator.ts` - CurrentAdmin param decorator reading req.admin
- `apps/api/src/admin/users/admin-users.service.spec.ts` - expanded with findAll, findOne, create, update, remove describe blocks
- `apps/api/src/admin/households/admin-households.service.spec.ts` - CRUD + cascade delete via $transaction
- `apps/api/src/admin/foods/admin-foods.service.spec.ts` - findAll, create, update/remove NotFoundException
- `apps/api/src/admin/units/admin-units.service.spec.ts` - findAll, create, update/remove NotFoundException
- `apps/api/src/admin/tokens/admin-tokens.service.spec.ts` - tokenHash exclusion + SHA-256 hash/raw token verification

## Decisions Made
- AdminTokenCreatedResponse extends AdminTokenResponse — raw token shown exactly once on POST; list endpoint never exposes tokenHash (sensitive field excluded at type level)
- CurrentAdmin reads req.admin set by AdminAuthGuard — parallel to CurrentUser reading req.user
- Wave-0 scaffolds import from service files that do not yet exist; this is intentional (scaffold fails → implementation makes it pass)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plans 06-02 through 06-05 can now start immediately — TypeScript shared types compile clean, spec scaffolds define the exact behavior expected
- admin-users.service.spec.ts ready for plan 06-02 (CRUD implementation)
- admin-households.service.spec.ts ready for plan 06-03
- admin-foods.service.spec.ts and admin-units.service.spec.ts ready for plan 06-04
- admin-tokens.service.spec.ts ready for plan 06-05

---
*Phase: 06-backend-admin-endpoints*
*Completed: 2026-03-18*

## Self-Check: PASSED

All files present and both task commits verified.
