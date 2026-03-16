---
phase: 03-backend-auth
plan: "03"
subsystem: auth
tags: [nestjs, bcrypt, prisma, guards, setup-wizard, class-validator, swagger]

# Dependency graph
requires:
  - phase: 03-backend-auth plan 02
    provides: AnyAuthGuard as APP_GUARD, @Public() decorator, PrismaModule global with Admin model
provides:
  - SetupGuard — blocks POST /setup if Admin already exists (throws NotFoundException)
  - SetupService.checkRequired() — returns { required: boolean } based on Admin count
  - SetupService.createAdmin() — creates Admin with bcrypt-hashed password at 12 salt rounds
  - SetupController GET /setup (@Public) and POST /setup (@Public + SetupGuard)
  - SetupModule wired into AppModule
  - e2e stub for AUTH-04 with DB_AVAILABLE conditional pattern
affects: [admin, setup-wizard, phase-12]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - SetupGuard uses prisma.admin.count() to gate POST /setup — same CanActivate pattern as SessionAuthGuard
    - @Public() on both GET and POST /setup — unauthenticated routes bypass AnyAuthGuard
    - @UseGuards(SetupGuard) on POST /setup in addition to @Public() — guard runs on first-time setup only
    - bcrypt.hash(password, 12) in SetupService — consistent SALT_ROUNDS=12 with auth service

key-files:
  created:
    - apps/api/src/setup/guards/setup.guard.ts
    - apps/api/src/setup/guards/setup.guard.spec.ts
    - apps/api/src/setup/dto/create-admin.dto.ts
    - apps/api/src/setup/setup.service.ts
    - apps/api/src/setup/setup.controller.ts
    - apps/api/src/setup/setup.module.ts
    - apps/api/tests/setup.e2e-spec.ts
  modified:
    - apps/api/src/app.module.ts

key-decisions:
  - "SetupGuard injects PrismaService directly (no DI token abstraction) — consistent with other guards"
  - "SetupModule exports SetupService for potential reuse by future admin modules"
  - "POST /setup uses @Public() + @UseGuards(SetupGuard) combination — @Public() bypasses AnyAuthGuard, SetupGuard enforces one-time setup constraint"

patterns-established:
  - "One-time setup guard pattern: count() check + NotFoundException — reusable for any resource that should exist exactly once"

requirements-completed: [AUTH-04]

# Metrics
duration: 3min
completed: 2026-03-16
---

# Phase 3 Plan 03: Setup Module Summary

**SetupGuard + SetupService + SetupController implementing one-time admin setup wizard with bcrypt password hashing and prisma.admin.count() gate**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-16T12:43:30Z
- **Completed:** 2026-03-16T12:46:10Z
- **Tasks:** 2 (TDD: 3 commits)
- **Files modified:** 8

## Accomplishments
- SetupGuard with full unit test coverage (2 tests: count===0 returns true, count>0 throws NotFoundException)
- SetupService with checkRequired() and createAdmin() — bcrypt at 12 salt rounds, Admin stored via Prisma
- SetupController: GET /setup and POST /setup both @Public(), POST additionally gated by SetupGuard
- SetupModule wired into AppModule — all 21 unit tests passing

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): SetupGuard unit test** - `10bd735` (test)
2. **Task 1 (GREEN): SetupGuard implementation** - `b6aa5a8` (feat)
3. **Task 2: SetupModule (controller, service, dto, e2e stub, AppModule update)** - `532250c` (feat)

_Note: TDD tasks have multiple commits (test → feat)_

## Files Created/Modified
- `apps/api/src/setup/guards/setup.guard.ts` - CanActivate guard gating POST /setup via admin.count()
- `apps/api/src/setup/guards/setup.guard.spec.ts` - 2 unit tests (RED → GREEN TDD cycle)
- `apps/api/src/setup/dto/create-admin.dto.ts` - CreateAdminDto with @ApiProperty + class-validator decorators
- `apps/api/src/setup/setup.service.ts` - checkRequired() and createAdmin() with bcrypt SALT_ROUNDS=12
- `apps/api/src/setup/setup.controller.ts` - GET /setup + POST /setup both @Public(); POST uses @UseGuards(SetupGuard)
- `apps/api/src/setup/setup.module.ts` - SetupModule with controller, service, guard; exports SetupService
- `apps/api/tests/setup.e2e-spec.ts` - e2e stub with DB_AVAILABLE conditional (AUTH-04)
- `apps/api/src/app.module.ts` - Added SetupModule import

## Decisions Made
- SetupGuard injects PrismaService directly — consistent with SessionAuthGuard and other guards
- SetupModule exports SetupService for potential reuse by future admin modules
- @Public() + @UseGuards(SetupGuard) combination on POST /setup: @Public() bypasses AnyAuthGuard global guard, SetupGuard enforces the one-time constraint

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Setup wizard backend complete; AUTH-04 satisfied
- SetupGuard and SetupService available for Phase 12 (admin setup UI integration)
- All 21 unit tests pass — no regressions introduced

---
*Phase: 03-backend-auth*
*Completed: 2026-03-16*
